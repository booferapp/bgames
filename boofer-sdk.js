/**
 * BooferSDK - HTML5 Game Integration Library v1.1.0
 *
 * Communicates with the Boofer Flutter app via the "BooferNative"
 * JavaScriptChannel that Flutter injects into every game WebView.
 *
 * Channel contract (both directions carry JSON strings):
 *
 *   JS → Flutter  (via BooferNative.postMessage(jsonString))
 *     { action, payload?, requestId }
 *
 *   Flutter → JS  (via window.postMessage(jsonString, '*'))
 *     { action, requestId?, success, data?, error? }
 *
 * Supported actions (JS → Flutter):
 *   init_game, save_score, game_over, get_player_info,
 *   show_leaderboard, share_score, trigger_haptic
 *
 * @version 1.1.0
 * @author  Boofer Team
 */

(function (window) {
  'use strict';

  // ── Internal state ──────────────────────────────────────────────────────────
  let _requestCounter = 0;
  const _pending = new Map();   // requestId → { resolve, reject, callback }

  // ── Channel detection ───────────────────────────────────────────────────────
  /**
   * Returns true when the Flutter "BooferNative" JavaScriptChannel is present.
   * The channel is injected by Flutter *before* the page is loaded, so it is
   * safe to check at any point after DOMContentLoaded.
   */
  function _isInBoofer() {
    return typeof window.BooferNative !== 'undefined' &&
           typeof window.BooferNative.postMessage === 'function';
  }

  // ── Core messaging ──────────────────────────────────────────────────────────
  function _generateRequestId() {
    return 'req_' + Date.now() + '_' + (++_requestCounter);
  }

  /**
   * Send a message to the native Boofer app and return a Promise.
   * Falls back gracefully when not running inside Boofer.
   */
  function _send(action, payload, callback) {
    return new Promise(function (resolve, reject) {
      if (!_isInBoofer()) {
        const err = '[BooferSDK] Not running inside the Boofer app.';
        console.warn(err);
        if (callback) callback({ success: false, error: err });
        reject(new Error(err));
        return;
      }

      const requestId = _generateRequestId();
      const message   = { action: action, requestId: requestId };
      if (payload !== null && payload !== undefined) message.payload = payload;

      _pending.set(requestId, { resolve: resolve, reject: reject, callback: callback || null });

      // Auto-clean after 10 s
      setTimeout(function () {
        if (_pending.has(requestId)) {
          _pending.delete(requestId);
          const timeoutErr = '[BooferSDK] Request ' + requestId + ' timed out.';
          if (callback) callback({ success: false, error: timeoutErr });
          reject(new Error(timeoutErr));
        }
      }, 10000);

      try {
        window.BooferNative.postMessage(JSON.stringify(message));
      } catch (e) {
        _pending.delete(requestId);
        const sendErr = '[BooferSDK] postMessage failed: ' + e.message;
        if (callback) callback({ success: false, error: sendErr });
        reject(new Error(sendErr));
      }
    });
  }

  // ── Response handler (Flutter → JS) ─────────────────────────────────────────
  function _handleResponse(response) {
    const { requestId, success, data, error, action } = response;

    if (requestId && _pending.has(requestId)) {
      const handlers = _pending.get(requestId);
      _pending.delete(requestId);

      if (handlers.callback) handlers.callback(response);
      if (success) {
        handlers.resolve(data !== undefined ? data : response);
      } else {
        handlers.reject(new Error(error || 'Unknown error'));
      }
    }

    // Broadcast to any listeners added via Boofer.onResponse()
    window.dispatchEvent(new CustomEvent('booferResponse', { detail: response }));
  }

  // Listen for messages posted by Flutter (window.postMessage)
  window.addEventListener('message', function (event) {
    try {
      const data = typeof event.data === 'string'
        ? JSON.parse(event.data)
        : event.data;
      if (data && (data.action || data.requestId)) {
        _handleResponse(data);
      }
    } catch (e) {
      // Ignore non-Boofer messages silently
    }
  });

  // ── Public API ───────────────────────────────────────────────────────────────
  var Boofer = {

    /**
     * Returns true when the game is running inside the Boofer app.
     * Use this to gate Boofer-specific features.
     */
    isAvailable: function () {
      return _isInBoofer();
    },

    /**
     * Wait until the BooferNative channel is injected, then resolve.
     * @param {number} [timeout=5000] - Max wait time in ms.
     * @returns {Promise<boolean>}
     */
    ready: function (timeout) {
      timeout = timeout || 5000;
      return new Promise(function (resolve, reject) {
        if (_isInBoofer()) { resolve(true); return; }

        var attempts = 0;
        var maxAttempts = Math.ceil(timeout / 100);
        var timer = setInterval(function () {
          attempts++;
          if (_isInBoofer()) {
            clearInterval(timer);
            resolve(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(timer);
            reject(new Error('[BooferSDK] BooferNative channel not available after ' + timeout + ' ms.'));
          }
        }, 100);
      });
    },

    /**
     * Initialize the game session and receive player info from Boofer.
     *
     * Resolved payload:
     *   { displayName: string, userId: string, highScore: number, currentScore: number }
     *
     * @param {Function} [callback]
     * @returns {Promise<Object>}
     */
    initGame: function (callback) {
      return _send('init_game', null, callback);
    },

    /**
     * Get current player info on demand.
     * @param {Function} [callback]
     * @returns {Promise<Object>}
     */
    getPlayerInfo: function (callback) {
      return _send('get_player_info', null, callback);
    },

    /**
     * Save the player's score to Boofer's leaderboard.
     * @param {number} score         - Non-negative integer score.
     * @param {Object} [gameData]    - Optional extra data (level, duration, …).
     * @param {Function} [callback]
     * @returns {Promise<{ score, isNewHighScore, timestamp }>}
     */
    saveScore: function (score, gameData, callback) {
      if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
        throw new TypeError('[BooferSDK] score must be a non-negative integer.');
      }
      var payload = { score: score };
      if (gameData) payload.gameData = gameData;
      return _send('save_score', payload, callback);
    },

    /**
     * Signal that the game is over.
     * Boofer will save the score and present the post-game UI automatically.
     * @param {number} finalScore
     * @param {Object} [gameData]
     * @param {Function} [callback]
     * @returns {Promise<{ gameEnded, finalScore }>}
     */
    gameOver: function (finalScore, gameData, callback) {
      if (typeof finalScore !== 'number' || finalScore < 0 || !Number.isInteger(finalScore)) {
        throw new TypeError('[BooferSDK] finalScore must be a non-negative integer.');
      }
      var payload = { score: finalScore };
      if (gameData) payload.gameData = gameData;
      return _send('game_over', payload, callback);
    },

    /**
     * Show the in-app leaderboard for this game.
     * @param {Function} [callback]
     * @returns {Promise}
     */
    showLeaderboard: function (callback) {
      return _send('show_leaderboard', null, callback);
    },

    /**
     * Share the player's score via the native share sheet.
     * @param {number} score
     * @param {string} [message]
     * @param {Function} [callback]
     * @returns {Promise}
     */
    shareScore: function (score, message, callback) {
      if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
        throw new TypeError('[BooferSDK] score must be a non-negative integer.');
      }
      var payload = { score: score };
      if (message) payload.message = message;
      return _send('share_score', payload, callback);
    },

    /**
     * Trigger native haptic feedback.
     * @param {'light'|'medium'|'heavy'|'success'|'warning'|'error'} [type='light']
     * @param {Function} [callback]
     * @returns {Promise}
     */
    triggerHaptic: function (type, callback) {
      type = type || 'light';
      var valid = ['light', 'medium', 'heavy', 'success', 'warning', 'error'];
      if (!valid.includes(type)) {
        throw new TypeError('[BooferSDK] Invalid haptic type: ' + type + '. Must be one of: ' + valid.join(', '));
      }
      return _send('trigger_haptic', { hapticType: type }, callback);
    },

    /**
     * Subscribe to ALL responses from Boofer (useful for debugging).
     * @param {Function} listener - receives the raw response object.
     */
    onResponse: function (listener) {
      window.addEventListener('booferResponse', function (e) {
        listener(e.detail);
      });
    },

    /**
     * Remove a response listener previously added with onResponse().
     * @param {Function} listener
     */
    offResponse: function (listener) {
      window.removeEventListener('booferResponse', listener);
    },
  };

  // Expose globally
  window.Boofer = Boofer;

  // CommonJS/Node compat (for bundlers)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Boofer;
  }

})(typeof window !== 'undefined' ? window : this);

/*
 * ── Quick-start example ───────────────────────────────────────────────────────
 *
 * <!-- In your game's HTML, add your API key so Boofer can authenticate: -->
 * <meta name="boofer-api-key" content="bfr_dev_YOUR_KEY_HERE">
 *
 * <!-- Optionally include this SDK file (Boofer also injects it automatically): -->
 * <script src="boofer-sdk.js"></script>
 *
 * <script>
 * // Wait for the native channel, then start the game
 * Boofer.ready().then(function () {
 *   return Boofer.initGame();
 * }).then(function (playerInfo) {
 *   console.log('Hello,', playerInfo.displayName);
 *   console.log('Your best score:', playerInfo.highScore);
 *   startMyGame(playerInfo);
 * }).catch(function (err) {
 *   // Running outside Boofer — degrade gracefully
 *   console.warn(err.message);
 *   startMyGame({ displayName: 'Player', highScore: 0 });
 * });
 *
 * // Save score mid-game
 * Boofer.saveScore(1500, { level: 3, duration: 60 }).then(function (res) {
 *   if (res.isNewHighScore) Boofer.triggerHaptic('success');
 * });
 *
 * // End game
 * async function endGame(score) {
 *   await Boofer.gameOver(score, { reason: 'completed' });
 *   // Boofer handles the post-game UI automatically
 * }
 * </script>
 */