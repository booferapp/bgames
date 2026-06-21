/**
 * BooferSDK v2.0.0 — HTML5 Game Integration Bridge
 *
 * Architecture: Pure bridge — no backend calls, no secrets stored here.
 * All communication flows through Flutter's BooferNative JavaScriptChannel.
 * Sensitive data delivery to developer backends uses Xaor-signed session
 * tokens that the Boofer backend issues — the SDK only requests and relays them.
 *
 * Channel protocol (both directions carry JSON strings):
 *   JS → Flutter:  BooferNative.postMessage(JSON.stringify({ action, payload?, requestId, sdkVersion }))
 *   Flutter → JS:  window.postMessage(JSON.stringify({ action?, requestId?, success, data?, error? }), '*')
 *
 * Supported actions (JS → Flutter):
 *   init_game, get_player_info, save_score, game_over, track_event,
 *   get_leaderboard, show_leaderboard, share_score, trigger_haptic,
 *   get_session_token, get_achievement_list, unlock_achievement,
 *   get_inventory, consume_item, get_game_config, ping
 *
 * Push events (Flutter → JS, no requestId):
 *   player_data, score_update, session_init, achievement_unlocked,
 *   reward_earned, pause, resume, close, app_event
 *
 * @version 2.0.0
 * @author  Boofer / Shaadow Team
 * @license Proprietary — © Boofer / Shaadow. All rights reserved.
 *
 * Security note on Xaor:
 *   Session tokens returned by getSessionToken() are signed server-side by
 *   the Boofer backend using Shaadow's Xaor cryptographic engine
 *   (https://github.com/ogxaor/xaor). Verify tokens on your own backend
 *   using the `xaorjs` npm package or the server-side Xaor library of your
 *   language. The SDK itself never holds encryption keys — it only transports
 *   the signed token between Flutter and the game.
 */

(function (root) {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────────
  var SDK_VERSION = '2.0.0';
  var REQUEST_TIMEOUT = 12000;   // ms before a pending request auto-rejects
  var CHANNEL_POLL_MS = 50;      // interval for environment detection polling
  var CHANNEL_POLL_MAX = 12;      // 12 × 50ms = 600ms before showing gate

  // ─── Private state ────────────────────────────────────────────────────────────
  var _seq = 0;
  var _pending = {};       // requestId → { resolve, reject, timer }
  var _listeners = {};       // event name → [fn, ...]
  var _session = null;     // populated by initGame / session_init push
  var _playerCache = null;     // cached after first getPlayerInfo / init_game
  var _score = 0;        // most recent known score
  var _sessionStart = null;     // Date.now() when initGame was called

  // ─── Channel detection ────────────────────────────────────────────────────────
  function _inBoofer() {
    return (typeof root.BooferNative !== 'undefined' && typeof root.BooferNative.postMessage === 'function') ||
      (typeof root.BooferSDK !== 'undefined' && typeof root.BooferSDK.postMessage === 'function');
  }

  // ─── Request engine ───────────────────────────────────────────────────────────
  function _rid() { return 'b' + Date.now() + '_' + (++_seq); }

  function _send(action, payload) {
    return new Promise(function (resolve, reject) {
      if (!_inBoofer()) {
        reject(new Error('[BooferSDK] Not inside Boofer app.'));
        return;
      }
      var id = _rid();
      var msg = { action: action, requestId: id, sdkVersion: SDK_VERSION };
      if (payload != null) msg.payload = payload;

      _pending[id] = {
        resolve: resolve,
        reject: reject,
        timer: setTimeout(function () {
          if (_pending[id]) {
            delete _pending[id];
            reject(new Error('[BooferSDK] "' + action + '" timed out.'));
          }
        }, REQUEST_TIMEOUT)
      };

      try {
        if (typeof root.BooferNative !== 'undefined' && typeof root.BooferNative.postMessage === 'function') {
          root.BooferNative.postMessage(JSON.stringify(msg));
        } else if (typeof root.BooferSDK !== 'undefined' && typeof root.BooferSDK.postMessage === 'function') {
          root.BooferSDK.postMessage(JSON.stringify(msg));
        }
      } catch (err) {
        clearTimeout(_pending[id].timer);
        delete _pending[id];
        reject(new Error('[BooferSDK] Channel write failed: ' + err.message));
      }
    });
  }

  // ─── Response handler (Flutter → JS) ─────────────────────────────────────────
  function _handle(raw) {
    var msg;
    try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch (e) { return; }
    if (!msg || (!msg.requestId && !msg.action)) return;

    // Resolve pending promise if this is a response to a request
    if (msg.requestId && _pending[msg.requestId]) {
      var p = _pending[msg.requestId];
      clearTimeout(p.timer);
      delete _pending[msg.requestId];
      if (msg.success !== false) {
        p.resolve(msg.data !== undefined ? msg.data : msg);
      } else {
        p.reject(new Error(msg.error || '[BooferSDK] Request failed.'));
      }
    }

    // Update internal caches from push events
    if (msg.action === 'player_data' && msg.data) _playerCache = msg.data;
    if (msg.action === 'score_update' && msg.data) _score = msg.data.score != null ? msg.data.score : _score;
    if (msg.action === 'session_init' && msg.data) _session = msg.data;

    // Fire named event listeners
    if (msg.action && _listeners[msg.action]) {
      _listeners[msg.action].slice().forEach(function (fn) {
        try { fn(msg.data, msg); } catch (e) { }
      });
    }

    // Fire wildcard listeners
    if (_listeners['*']) {
      _listeners['*'].slice().forEach(function (fn) {
        try { fn(msg); } catch (e) { }
      });
    }

    // Broadcast as a DOM CustomEvent for advanced / library consumers
    try {
      root.dispatchEvent(new CustomEvent('boofer:message', { detail: msg }));
      root.dispatchEvent(new CustomEvent('booferResponse', { detail: msg }));
    } catch (e) { }
  }

  root.addEventListener('message', function (ev) { _handle(ev.data); });

  // ─── Listener helpers ─────────────────────────────────────────────────────────
  function _on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
    return function () { _off(event, fn); };
  }
  function _off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function (f) { return f !== fn; });
  }

  // ─── Browser guard (locks games to Boofer WebView only) ───────────────────────
  // NOTE: All CSS is written as pre-minified single-line strings so that
  // downstream minifiers (terser, etc.) can compress this entire file fully.
  (function () {
    // ── Title branding ──
    function _brand() {
      if (document.title && document.title.indexOf('Boofer') === -1) {
        document.title = document.title + ' | Boofer';
      } else if (!document.title) {
        document.title = 'Boofer Game';
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _brand);
    } else {
      _brand();
    }

    function _isDev() {
      var meta = document.querySelector('meta[name="boofer-env"]');
      return meta && meta.getAttribute('content') === 'development';
    }

    // Already inside Boofer — nothing more to do
    if (_inBoofer() || _isDev()) return;

    // ── Flash prevention: hide body immediately via injected style ──
    var _fb = document.createElement('style');
    _fb.id = '_bfg';
    _fb.textContent = 'body{visibility:hidden!important;overflow:hidden!important}';
    (_fb_h = document.head || document.documentElement).appendChild(_fb);

    // ── Silence all audio so game sounds don't leak through the gate ──
    ['AudioContext', 'webkitAudioContext'].forEach(function (k) {
      if (root[k]) root[k] = function () {
        return {
          state: 'suspended', destination: {}, createOscillator: function () {
            return { connect: function () { }, start: function () { }, stop: function () { } };
          }
        };
      };
    });
    if (root.Audio) root.Audio = function () {
      return {
        play: function () { return Promise.resolve(); }, pause: function () { },
        load: function () { }, volume: 0, muted: true
      };
    };

    // ── Poll for late BooferNative injection (e.g. channel latency) ──
    var _polls = 0;
    var _pt = setInterval(function () {
      _polls++;
      if (_inBoofer() || _isDev()) {
        clearInterval(_pt);
        var el = document.getElementById('_bfg');
        if (el) el.parentNode.removeChild(el);
        root.removeEventListener('keydown', _blockKeys, true);
      } else if (_polls >= CHANNEL_POLL_MAX) {
        clearInterval(_pt);
        _showGate();
      }
    }, CHANNEL_POLL_MS);

    function _blockKeys(e) { e.preventDefault(); e.stopPropagation(); }

    function _showGate() {
      // Inject Google Font
      if (!document.querySelector('link[href*="Outfit"]')) {
        var fl = document.createElement('link');
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap';
        (document.head || document.documentElement).appendChild(fl);
      }

      // Gate CSS — pre-minified single-line strings (terser-friendly)
      var s = document.createElement('style');
      s.textContent =
        '#_bfr_gate{position:fixed;inset:0;background:radial-gradient(circle at 50% -10%,#1e1b4b 0%,#090d16 100%);z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Outfit,system-ui,sans-serif;color:#fff;text-align:center;padding:24px;box-sizing:border-box;user-select:none;-webkit-user-select:none}' +
        '#_bfr_gate .g-logo{height:52px;width:auto;margin-bottom:12px;filter:drop-shadow(0 0 18px rgba(236,72,153,.5))}' +
        '#_bfr_gate .g-sub{font-size:.72rem;color:#818cf8;letter-spacing:.2em;text-transform:uppercase;font-weight:700;margin-bottom:36px}' +
        '#_bfr_gate .g-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:40px 28px;max-width:380px;width:100%;backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);box-shadow:0 24px 64px rgba(0,0,0,.7)}' +
        '#_bfr_gate h3{font-size:1.45rem;font-weight:800;margin:0 0 12px;color:#fff;letter-spacing:-.01em}' +
        '#_bfr_gate p{font-size:.9rem;line-height:1.7;color:#94a3b8;margin:0 0 28px}' +
        '#_bfr_gate .g-btn{display:inline-block;transition:transform .2s cubic-bezier(.175,.885,.32,1.275),filter .18s ease}' +
        '#_bfr_gate .g-btn:hover{transform:scale(1.06);filter:brightness(1.15)}' +
        '#_bfr_gate .g-btn img{height:58px;width:auto;display:block}' +
        '#_bfr_gate .g-foot{margin-top:44px;font-size:.66rem;color:#334155;letter-spacing:.07em}' +
        'body{visibility:visible!important;overflow:hidden!important}' +
        'body>*:not(#_bfr_gate){display:none!important}';
      (document.head || document.documentElement).appendChild(s);

      var gate = document.createElement('div');
      gate.id = '_bfr_gate';
      gate.setAttribute('role', 'dialog');
      gate.setAttribute('aria-label', 'Boofer App Required');
      gate.innerHTML =
        '<img class="g-logo" src="cg-new-full-boofer.svg" alt="Boofer" onerror="this.style.display=\'none\'">' +
        '<div class="g-sub">Exclusive to Boofer App</div>' +
        '<div class="g-card">' +
        '<h3>Open in Boofer</h3>' +
        '<p>This game is the personal property of Boofer and runs exclusively inside the <strong>Boofer App</strong>. Download the app to play for free.</p>' +
        '<a class="g-btn" href="https://play.google.com/store/apps/details?id=com.shaadow.boofer.android" target="_blank" rel="noopener noreferrer">' +
        '<img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play">' +
        '</a>' +
        '</div>' +
        '<div class="g-foot">\u00A9 ' + new Date().getFullYear() + ' Boofer \u2014 All rights reserved. Powered by Shaadow.</div>';

      // Remove flash-block style, insert gate
      var fb = document.getElementById('_bfg');
      if (fb) fb.parentNode.removeChild(fb);

      if (document.body) {
        document.body.appendChild(gate);
      } else {
        root.addEventListener('DOMContentLoaded', function () {
          document.body.appendChild(gate);
        });
      }

      root.addEventListener('keydown', _blockKeys, true);
      gate.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
  })();

  // ─── Public BooferSDK API ──────────────────────────────────────────────────────

  var Boofer = {

    /** SDK version string */
    version: SDK_VERSION,

    // ── Environment ────────────────────────────────────────────────────────────

    /**
     * Returns true when running inside the Boofer WebView.
     * @returns {boolean}
     */
    isAvailable: function () { return _inBoofer(); },

    /**
     * Wait for the BooferNative channel to be injected (handles startup latency).
     * @param {number} [ms=6000]
     * @returns {Promise<boolean>}
     */
    ready: function (ms) {
      ms = ms || 6000;
      return new Promise(function (resolve, reject) {
        if (_inBoofer()) { resolve(true); return; }
        var tries = 0;
        var max = Math.ceil(ms / 100);
        var t = setInterval(function () {
          if (_inBoofer()) {
            clearInterval(t);
            resolve(true);
          } else if (++tries >= max) {
            clearInterval(t);
            reject(new Error('[BooferSDK] Channel unavailable after ' + ms + ' ms.'));
          }
        }, 100);
      });
    },

    // ── Session & Player data ──────────────────────────────────────────────────

    /**
     * Initialize the game session. Call this first — Boofer returns player info.
     *
     * Resolved payload:
     *   {
     *     player: { userId, displayName, avatarUrl, level, xp, highScore, badges[] },
     *     session: { sessionId, gameId },
     *     currentScore: number,
     *     config: { … }  // developer-defined game config from Boofer dashboard
     *   }
     *
     * @param {Object} [options]
     * @param {string} [options.gameId]
     * @param {string} [options.gameVersion]
     * @param {Object} [options.config]
     * @returns {Promise<Object>}
     */
    initGame: function (options) {
      _sessionStart = Date.now();
      return _send('init_game', options || {}).then(function (data) {
        if (data) {
          _session = data.session || null;
          _playerCache = data.player || (_playerCache || null);
          _score = data.currentScore != null ? data.currentScore : 0;
        }
        return data;
      });
    },

    /**
     * Fetch current player profile.
     * Returns cached data unless `fresh` is true.
     *
     * Resolved payload:
     *   { userId, displayName, avatarUrl, level, xp, highScore, totalGamesPlayed,
     *     totalPlayTimeMs, badges[], joinedAt }
     *
     * @param {boolean} [fresh=false]
     * @returns {Promise<Object>}
     */
    getPlayerInfo: function (fresh) {
      if (!fresh && _playerCache) return Promise.resolve(_playerCache);
      return _send('get_player_info', null).then(function (d) {
        _playerCache = d;
        return d;
      });
    },

    /**
     * Returns the current in-memory session snapshot (no network call).
     * @returns {{ sessionId, startTime, duration, currentScore, playerId } | null}
     */
    getSessionInfo: function () {
      if (!_sessionStart) return null;
      return {
        sessionId: _session ? _session.sessionId : null,
        startTime: _sessionStart,
        duration: Date.now() - _sessionStart,
        currentScore: _score,
        playerId: _playerCache ? _playerCache.userId : null,
      };
    },

    // ── Xaor-secured developer token ──────────────────────────────────────────

    /**
     * Request a Xaor-signed session token from the Boofer backend.
     *
     * The token is signed by Boofer's server using Shaadow's Xaor cryptographic
     * engine (https://github.com/ogxaor/xaor). It contains a tamper-proof payload
     * of player + session data that your own backend can verify without contacting
     * Boofer's infrastructure.
     *
     * How to verify on your server:
     *   - Install: `npm install xaorjs` (JS) / `dart pub add xaor` / `cargo add xaor`
     *   - Use your developer secret key (from Boofer Dashboard) as the pepper/key.
     *   - The token format is the standard Xaor hash string: $xaor$v=3$…
     *
     * Resolved payload:
     *   {
     *     token:     string,       // Xaor-signed opaque token
     *     algorithm: 'xaor',
     *     payload:   {             // plaintext claims embedded in the token
     *       userId, sessionId, gameId, score, timestamp, expires
     *     },
     *     expires:   number        // Unix timestamp (ms)
     *   }
     *
     * @returns {Promise<Object>}
     */
    getSessionToken: function () {
      return _send('get_session_token', {
        sessionId: _session ? _session.sessionId : null,
        score: _score,
        timestamp: Date.now(),
      });
    },

    // ── Score & game events ────────────────────────────────────────────────────

    /**
     * Save the player's current score to Boofer's leaderboard.
     *
     * Resolved payload:
     *   { score, isNewHighScore, rank, timestamp }
     *
     * @param {number} score           Non-negative integer
     * @param {Object} [meta]          e.g. { level, combo, timeRemaining, ... }
     * @returns {Promise<Object>}
     */
    saveScore: function (score, meta) {
      if (!Number.isInteger(score) || score < 0)
        throw new TypeError('[BooferSDK] score must be a non-negative integer.');
      _score = score;
      return _send('save_score', { score: score, meta: meta || {} });
    },

    /**
     * Signal game over. Boofer saves the score and shows the post-game UI.
     *
     * Resolved payload:
     *   { gameEnded: true, finalScore, isNewHighScore, rank, newAchievements[] }
     *
     * @param {number} finalScore
     * @param {Object} [meta]     e.g. { reason: 'died', level: 5, accuracy: 0.91 }
     * @returns {Promise<Object>}
     */
    gameOver: function (finalScore, meta) {
      if (!Number.isInteger(finalScore) || finalScore < 0)
        throw new TypeError('[BooferSDK] finalScore must be a non-negative integer.');
      _score = finalScore;
      return _send('game_over', {
        score: finalScore,
        sessionDuration: _sessionStart ? Date.now() - _sessionStart : 0,
        meta: meta || {},
      });
    },

    // ── Analytics & event tracking ─────────────────────────────────────────────

    /**
     * Track a custom analytics event. Boofer stores it in the player's
     * behavioural history. Aggregated data is accessible in the Boofer
     * developer dashboard. A Xaor-signed delivery can optionally be
     * forwarded to your own webhook (configure in the dashboard).
     *
     * Standard event names (Boofer tracks these with richer analytics):
     *   'level_start', 'level_complete', 'level_fail', 'power_up_used',
     *   'item_collected', 'achievement_progress', 'session_checkpoint',
     *   'tutorial_step', 'ui_interaction', 'error'
     *
     * @param {string} name    Event name
     * @param {Object} [data]  Arbitrary key-value pairs
     * @returns {Promise<void>}
     */
    trackEvent: function (name, data) {
      if (!name || typeof name !== 'string')
        throw new TypeError('[BooferSDK] event name must be a non-empty string.');
      return _send('track_event', {
        name: name,
        data: data || {},
        timestamp: Date.now(),
        currentScore: _score,
        sessionDuration: _sessionStart ? Date.now() - _sessionStart : 0,
      });
    },

    /**
     * Bulk-send a batch of events (more efficient than many single trackEvent calls).
     * Each event object: { name: string, data?: object, timestamp?: number }
     * @param {Array<Object>} events
     * @returns {Promise<void>}
     */
    trackBatch: function (events) {
      if (!Array.isArray(events) || events.length === 0)
        throw new TypeError('[BooferSDK] trackBatch expects a non-empty array.');
      var now = Date.now();
      return _send('track_batch', {
        events: events.map(function (ev) {
          return { name: ev.name, data: ev.data || {}, timestamp: ev.timestamp || now };
        }),
        sessionId: _session ? _session.sessionId : null,
      });
    },

    // ── Leaderboard ────────────────────────────────────────────────────────────

    /**
     * Fetch the game leaderboard.
     *
     * Resolved payload: Array<{ rank, userId, displayName, avatarUrl, score, timestamp }>
     *
     * @param {Object}  [options]
     * @param {'global'|'friends'|'weekly'|'daily'} [options.scope='global']
     * @param {number}  [options.limit=10]
     * @param {number}  [options.offset=0]
     * @returns {Promise<Array>}
     */
    getLeaderboard: function (options) {
      return _send('get_leaderboard', Object.assign({ scope: 'global', limit: 10, offset: 0 }, options || {}));
    },

    /**
     * Show the native in-app leaderboard UI overlay.
     * @returns {Promise<void>}
     */
    showLeaderboard: function () { return _send('show_leaderboard', null); },

    // ── Achievements ───────────────────────────────────────────────────────────

    /**
     * Get all achievements defined for this game.
     * Resolved payload: Array<{ id, name, description, iconUrl, unlocked, unlockedAt? }>
     * @returns {Promise<Array>}
     */
    getAchievements: function () { return _send('get_achievement_list', null); },

    /**
     * Unlock (or report progress on) an achievement.
     * @param {string} achievementId
     * @param {number} [progress=100]  0–100
     * @returns {Promise<{ id, unlocked, progress }>}
     */
    unlockAchievement: function (achievementId, progress) {
      if (!achievementId) throw new TypeError('[BooferSDK] achievementId is required.');
      return _send('unlock_achievement', {
        id: achievementId,
        progress: progress != null ? Math.max(0, Math.min(100, progress)) : 100,
      });
    },

    // ── Inventory / virtual items ──────────────────────────────────────────────

    /**
     * Get the player's inventory for this game.
     * Resolved payload: Array<{ itemId, name, quantity, meta }>
     * @returns {Promise<Array>}
     */
    getInventory: function () { return _send('get_inventory', null); },

    /**
     * Consume one or more of an inventory item.
     * @param {string} itemId
     * @param {number} [quantity=1]
     * @returns {Promise<{ itemId, remaining }>}
     */
    consumeItem: function (itemId, quantity) {
      if (!itemId) throw new TypeError('[BooferSDK] itemId is required.');
      return _send('consume_item', { itemId: itemId, quantity: quantity || 1 });
    },

    // ── Native UI ─────────────────────────────────────────────────────────────

    /**
     * Share the player's score via the native share sheet.
     * @param {number} score
     * @param {string} [message]
     * @returns {Promise<void>}
     */
    shareScore: function (score, message) {
      if (!Number.isInteger(score) || score < 0)
        throw new TypeError('[BooferSDK] score must be a non-negative integer.');
      return _send('share_score', { score: score, message: message || '' });
    },

    /**
     * Trigger native haptic feedback.
     * @param {'light'|'medium'|'heavy'|'success'|'warning'|'error'} [type='light']
     * @returns {Promise<void>}
     */
    triggerHaptic: function (type) {
      var VALID = ['light', 'medium', 'heavy', 'success', 'warning', 'error'];
      type = type || 'light';
      if (VALID.indexOf(type) === -1)
        throw new TypeError('[BooferSDK] Invalid haptic type: ' + type + '. Valid: ' + VALID.join(', '));
      return _send('trigger_haptic', { type: type });
    },

    /**
     * Get developer-defined game configuration stored in the Boofer dashboard.
     * Useful for A/B testing, remote feature flags, difficulty curves, etc.
     * Resolved payload: { [key: string]: any }
     * @returns {Promise<Object>}
     */
    getGameConfig: function () { return _send('get_game_config', null); },

    /**
     * Ping the Boofer channel (for latency checks / keep-alive).
     * @returns {Promise<{ pong: true, latencyMs: number }>}
     */
    ping: function () {
      var t = Date.now();
      return _send('ping', { t: t }).then(function (d) {
        return Object.assign({ latencyMs: Date.now() - t }, d);
      });
    },

    // ── Event subscriptions ────────────────────────────────────────────────────

    /**
     * Subscribe to player profile updates pushed from Boofer
     * (e.g. when an achievement or reward is granted mid-session).
     * @param {function} fn  Called with (playerInfo: Object)
     * @returns {function}   Unsubscribe
     */
    onPlayerData: function (fn) { return _on('player_data', fn); },

    /**
     * Subscribe to score-update pushes (e.g. after leaderboard sync).
     * @param {function} fn  Called with ({ score, isNewHighScore, rank }: Object)
     * @returns {function}   Unsubscribe
     */
    onScoreUpdate: function (fn) { return _on('score_update', fn); },

    /**
     * Subscribe to achievement_unlocked push events.
     * @param {function} fn  Called with ({ id, name, iconUrl }: Object)
     * @returns {function}   Unsubscribe
     */
    onAchievementUnlocked: function (fn) { return _on('achievement_unlocked', fn); },

    /**
     * Subscribe to reward_earned push events (daily bonus, ad reward, etc.).
     * @param {function} fn  Called with ({ type, amount, currency }: Object)
     * @returns {function}   Unsubscribe
     */
    onRewardEarned: function (fn) { return _on('reward_earned', fn); },

    /**
     * Subscribe to lifecycle events pushed by the host app.
     * Names: 'pause', 'resume', 'close', 'app_event'
     * @param {string}   event
     * @param {function} fn
     * @returns {function} Unsubscribe
     */
    onAppEvent: function (event, fn) { return _on(event, fn); },

    /**
     * Subscribe to ALL raw messages from Boofer (useful for debugging).
     * @param {function} fn  Called with the raw message object
     * @returns {function}   Unsubscribe
     */
    onMessage: function (fn) { return _on('*', fn); },

    // ── Legacy compatibility shims ─────────────────────────────────────────────
    onResponse: function (fn) { return _on('*', fn); },
    offResponse: function (fn) { _off('*', fn); },
  };

  // ─── Export ────────────────────────────────────────────────────────────────────
  root.Boofer = Boofer;
  if (typeof module !== 'undefined' && module.exports) module.exports = Boofer;

})(typeof window !== 'undefined' ? window : this);

/*
 * ── Quick-start ───────────────────────────────────────────────────────────────
 *
 * <!-- 1. Declare your API key (Boofer reads this automatically): -->
 * <meta name="boofer-api-key" content="bfr_dev_YOUR_KEY_HERE">
 *
 * <!-- 2. The SDK is auto-injected by Boofer. You may also include it manually: -->
 * <script src="./assets/sdk/boofer-sdk.js"></script>
 *
 * <script>
 * Boofer.ready()
 *   .then(() => Boofer.initGame({ gameId: 'my_game', gameVersion: '1.0' }))
 *   .then(function (info) {
 *     console.log('Player:', info.player.displayName);
 *     console.log('High score:', info.player.highScore);
 *     startGame(info);
 *   });
 *
 * // Save score mid-game
 * Boofer.saveScore(1500, { level: 3, combo: 12 }).then(function (res) {
 *   if (res.isNewHighScore) Boofer.triggerHaptic('success');
 * });
 *
 * // Track events for analytics
 * Boofer.trackEvent('level_complete', { level: 3, stars: 2, time: 45.2 });
 *
 * // Get a Xaor-signed token to verify on your own server
 * Boofer.getSessionToken().then(function (t) {
 *   // Send t.token to YOUR backend; verify with xaorjs using your dev secret
 *   myServer.post('/verify', { token: t.token, score: t.payload.score });
 * });
 *
 * // End the game
 * Boofer.gameOver(finalScore, { reason: 'completed', level: 10 });
 * </script>
 *
 * ── Xaor token verification (your server, Node.js example) ───────────────────
 *
 * const xaor = require('xaorjs');
 * // Your developer secret from the Boofer dashboard (store in env, NOT in code)
 * const DEV_SECRET = process.env.BOOFER_DEV_SECRET;
 * async function verifyBooferToken(token) {
 *   // Xaor verify — returns true if token was signed with your secret
 *   const ok = await xaor.verify(token, DEV_SECRET);
 *   return ok; // { valid: boolean, payload: { userId, sessionId, score, … } }
 * }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
