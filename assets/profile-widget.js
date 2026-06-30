(function() {
  function initProfileWidget() {
    // Hook/monkeypatch Boofer.initGame to capture the best score
    if (typeof Boofer !== 'undefined' && Boofer.initGame) {
      const originalInitGame = Boofer.initGame;
      Boofer.initGame = function(options) {
        return originalInitGame.apply(this, arguments).then(function(data) {
          if (data) {
            window._booferHighScore = data.high_score || data.highScore || 0;
            if (data.player && data.player.avatar) {
              const profileBtn = document.querySelector('.boofer-profile-btn');
              if (profileBtn) {
                profileBtn.innerHTML = `<img src="${data.player.avatar}" alt="Profile">`;
              }
            }
          }
          return data;
        });
      };
    }

    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
      .boofer-profile-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(18, 18, 18, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999998;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        transition: transform 0.2s, background 0.2s;
        overflow: hidden;
      }
      .boofer-profile-btn:hover {
        transform: scale(1.05);
        background: rgba(30, 30, 30, 0.8);
      }
      .boofer-profile-btn img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .boofer-profile-btn svg {
        width: 24px;
        height: 24px;
        color: #fff;
      }
      .boofer-profile-modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999999;
        display: none;
        align-items: center;
        justify-content: center;
        font-family: 'Outfit', system-ui, sans-serif;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .boofer-profile-modal.active {
        display: flex;
        opacity: 1;
      }
      .boofer-profile-card {
        background: rgba(18, 18, 18, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        width: 90%;
        max-width: 360px;
        padding: 32px;
        color: #fff;
        box-shadow: 0 24px 64px rgba(0,0,0,0.7);
        position: relative;
        transform: translateY(20px);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .boofer-profile-modal.active .boofer-profile-card {
        transform: translateY(0);
      }
      .boofer-profile-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        transition: color 0.2s;
      }
      .boofer-profile-close:hover {
        color: #fff;
      }
      .boofer-profile-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 24px;
      }
      .boofer-profile-avatar {
        width: 84px;
        height: 84px;
        border-radius: 50%;
        border: 2px solid #334155;
        margin-bottom: 16px;
        object-fit: cover;
      }
      .boofer-profile-name {
        font-size: 1.4rem;
        font-weight: 800;
        margin: 0 0 4px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .boofer-profile-verified {
        color: #3b82f6;
        width: 18px;
        height: 18px;
      }
      .boofer-profile-handle {
        font-size: 0.9rem;
        color: #94a3b8;
        margin: 0;
      }
      .boofer-profile-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 24px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 16px;
        padding: 16px;
      }
      .boofer-profile-stat {
        text-align: center;
      }
      .boofer-profile-stat-val {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .boofer-profile-stat-lbl {
        font-size: 0.65rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .boofer-profile-badge {
        display: inline-block;
        padding: 6px 14px;
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.3);
        color: #ffd700;
        border-radius: 14px;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: capitalize;
      }
      .boofer-profile-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #94a3b8;
      }
      .boofer-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(255,255,255,0.1);
        border-top-color: #fff;
        border-radius: 50%;
        animation: boofer-spin 1s linear infinite;
        margin-bottom: 16px;
      }
      @keyframes boofer-spin {
        to { transform: rotate(360deg); }
      }
      .boofer-leaderboard-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        border: none;
        border-radius: 12px;
        color: #fff;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        transition: transform 0.2s, filter 0.2s;
        margin-top: 16px;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .boofer-leaderboard-btn:hover {
        transform: scale(1.02);
        filter: brightness(1.1);
      }
      .boofer-leaderboard-btn svg {
        width: 18px;
        height: 18px;
        color: #fff;
      }
    `;
    document.head.appendChild(style);

    // 2. Inject Button
    const btn = document.createElement('div');
    btn.className = 'boofer-profile-btn';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    document.body.appendChild(btn);

    // 3. Inject Modal
    const modal = document.createElement('div');
    modal.className = 'boofer-profile-modal';
    modal.innerHTML = `
      <div class="boofer-profile-card">
        <button class="boofer-profile-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div id="boofer-profile-content">
          <div class="boofer-profile-loading">
            <div class="boofer-spinner"></div>
            <div>Loading profile...</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.boofer-profile-close');
    const content = modal.querySelector('#boofer-profile-content');

    function closeModal() {
      modal.classList.remove('active');
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    btn.addEventListener('click', async () => {
      modal.classList.add('active');
      content.innerHTML = `
        <div class="boofer-profile-loading">
          <div class="boofer-spinner"></div>
          <div>Loading profile...</div>
        </div>
      `;

      try {
        let profile;
        let highScore = window._booferHighScore || 0;
        let currentScore = 0;

        if (typeof Boofer !== 'undefined') {
          profile = await Boofer.getPlayerInfo();
          if (profile) {
            highScore = window._booferHighScore || profile.highScore || profile.high_score || highScore;
          }
          const sess = Boofer.getSessionInfo();
          if (sess) {
            currentScore = sess.currentScore || 0;
          }
        } else {
          // Fallback mock
          await new Promise(r => setTimeout(r, 600)); // Simulate network
          profile = {
            id: 'guest',
            handle: 'GuestPlayer',
            full_name: 'Guest Player',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
            age: 18,
            is_verified: false,
            follower_count: 0,
            badge_level: 'none',
            highScore: 120,
          };
          highScore = profile.highScore;
          currentScore = 45;
        }

        if (!profile) throw new Error("No profile data");

        const isVerifiedHtml = profile.is_verified ? `<svg class="boofer-profile-verified" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>` : '';
        const badgeHtml = profile.badge_level && profile.badge_level !== 'none' ? `<div class="boofer-profile-badge">${profile.badge_level} Badge</div>` : '';

        // Update Button Avatar if available
        if (profile.avatar) {
          btn.innerHTML = `<img src="${profile.avatar}" alt="Profile">`;
        }

        let ageText = profile.age ? profile.age.toString() : '-';
        if (ageText.length > 5) ageText = ageText.substring(0, 5);

        content.innerHTML = `
          <div class="boofer-profile-header">
            <img class="boofer-profile-avatar" src="${profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.handle}" alt="Avatar">
            <h2 class="boofer-profile-name">${profile.full_name || 'Player'} ${isVerifiedHtml}</h2>
            <p class="boofer-profile-handle">@${profile.handle || 'unknown'}</p>
          </div>
          <div class="boofer-profile-stats">
            <div class="boofer-profile-stat">
              <div class="boofer-profile-stat-val">${highScore}</div>
              <div class="boofer-profile-stat-lbl">Best Score</div>
            </div>
            <div class="boofer-profile-stat">
              <div class="boofer-profile-stat-val">${currentScore}</div>
              <div class="boofer-profile-stat-lbl">Current</div>
            </div>
            <div class="boofer-profile-stat">
              <div class="boofer-profile-stat-val">${profile.badge_level && profile.badge_level !== 'none' ? profile.badge_level : 'Bronze'}</div>
              <div class="boofer-profile-stat-lbl">Rank</div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 16px;">
            ${badgeHtml}
          </div>
          <button class="boofer-leaderboard-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            View Leaderboard
          </button>
        `;

        const leaderboardBtn = content.querySelector('.boofer-leaderboard-btn');
        if (leaderboardBtn) {
          leaderboardBtn.addEventListener('click', () => {
            if (typeof Boofer !== 'undefined') {
              Boofer.showLeaderboard().catch(function(err) {
                console.error("Error showing leaderboard:", err);
              });
            } else {
              alert("Leaderboard clicked! (Mock mode: Boofer SDK not active)");
            }
          });
        }
      } catch (e) {
        content.innerHTML = `
          <div class="boofer-profile-loading" style="color: #ef4444;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <div>Failed to load profile.</div>
            <div style="font-size: 0.75rem; margin-top: 8px; color: #94a3b8;">${e.message}</div>
          </div>
        `;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileWidget);
  } else {
    initProfileWidget();
  }
})();
