/**
 * AgentVerse - Enterprise Administrator Authentication & Access Management
 * 
 * Ensures only authorized administrators with verified credentials can switch
 * to the Admin role, and allows active administrators to grant or revoke access.
 */

(function () {
  // Master default credentials
  const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin@123',
    name: 'Primary Administrator',
    role: 'SuperAdmin',
    is_default: true
  };

  // State keys
  const SESSION_KEY = 'agentverse_admin_session';
  const CACHE_KEY = 'agentverse_cached_admins';

  // State
  let pendingAction = null;
  let isBypassingAuth = false;

  // --- Session Helpers ---
  function getAdminSession() {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  function setAdminSession(user) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      window.AgentVerseCurrentAdmin = user;
    } catch (e) {
      console.error('[AdminAuth] Error saving session:', e);
    }
  }

  function clearAdminSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      window.AgentVerseCurrentAdmin = null;
    } catch (e) {
      console.error('[AdminAuth] Error clearing session:', e);
    }
  }

  function isAdminLoggedIn() {
    const session = getAdminSession();
    return !!(session && session.username);
  }

  // --- Local Fallback Cache for Admins ---
  function getCachedAdmins() {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [DEFAULT_ADMIN];
  }

  function saveCachedAdmins(list) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    } catch {}
  }

  // --- API Handlers ---
  async function apiLogin(username, password) {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, user: data.user, token: data.token };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.detail || 'Invalid username or password' };
    } catch (e) {
      console.warn('[AdminAuth] Server unreachable, checking local credentials fallback:', e);
      // Fallback verification
      const admins = getCachedAdmins();
      const match = admins.find(a => 
        a.username.toLowerCase() === username.trim().toLowerCase() && 
        a.password === password
      );
      if (match) {
        return { 
          success: true, 
          user: { username: match.username, name: match.name, role: match.role || 'Administrator' } 
        };
      }
      return { success: false, message: 'Invalid username or password' };
    }
  }

  async function apiFetchAdmins() {
    try {
      const res = await fetch('/api/v1/auth/admins');
      if (res.ok) {
        const data = await res.json();
        if (data.admins && Array.isArray(data.admins)) {
          return data.admins;
        }
      }
    } catch (e) {
      console.warn('[AdminAuth] Fetch admins failed, using cached list:', e);
    }
    return getCachedAdmins().map(a => ({
      username: a.username,
      name: a.name || 'Administrator',
      role: a.role || 'Administrator',
      created_at: a.created_at || 'System Default',
      is_default: !!a.is_default
    }));
  }

  async function apiAddAdmin(newAdminData) {
    try {
      const res = await fetch('/api/v1/auth/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdminData)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, admin: data.admin, message: data.message };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.detail || 'Failed to add admin' };
    } catch (e) {
      // Local fallback save
      const admins = getCachedAdmins();
      if (admins.some(a => a.username.toLowerCase() === newAdminData.username.trim().toLowerCase())) {
        return { success: false, message: `Admin '${newAdminData.username}' already exists` };
      }
      const newAdmin = {
        username: newAdminData.username.trim(),
        password: newAdminData.password,
        name: newAdminData.name || 'Cluster Admin',
        role: newAdminData.role || 'Administrator',
        created_at: new Date().toLocaleString(),
        is_default: false
      };
      admins.push(newAdmin);
      saveCachedAdmins(admins);
      return { success: true, admin: newAdmin, message: 'Admin added (offline cached)' };
    }
  }

  async function apiDeleteAdmin(username) {
    if (username.toLowerCase() === 'admin') {
      return { success: false, message: "Cannot revoke default SuperAdmin 'admin'" };
    }
    try {
      const res = await fetch(`/api/v1/auth/admins/${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return { success: true };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.detail || 'Failed to revoke admin' };
    } catch (e) {
      const admins = getCachedAdmins().filter(a => a.username.toLowerCase() !== username.toLowerCase());
      saveCachedAdmins(admins);
      return { success: true };
    }
  }

  // --- UI Toast ---
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.av-auth-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `av-auth-toast ${type}`;
    toast.innerHTML = `
      <svg class="av-auth-toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${type === 'success' 
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />'
        }
      </svg>
      <span>${escapeHtml(message)}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Admin Login Modal ---
  function openAdminLoginModal(actionContext = null) {
    pendingAction = actionContext;

    // Remove any open modal
    closeAdminLoginModal();

    const overlay = document.createElement('div');
    overlay.className = 'av-auth-overlay';
    overlay.id = 'avAdminLoginOverlay';

    overlay.innerHTML = `
      <div class="av-auth-card" id="avAdminLoginCard" role="dialog" aria-modal="true" aria-labelledby="avAuthTitle">
        <div class="av-auth-glow-orb"></div>
        <div class="av-auth-glow-orb-secondary"></div>
        
        <button class="av-auth-close-btn" id="avAuthCloseBtn" title="Close & Cancel">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div class="av-auth-header">
          <div class="av-auth-badge">
            <span class="av-auth-pulse-dot"></span>
            <span>Restricted Access Control</span>
          </div>
          <h2 class="av-auth-title" id="avAuthTitle">
            <svg width="22" height="22" fill="none" stroke="#c084fc" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Administrator Login
          </h2>
          <p class="av-auth-subtitle">
            Enter authorized administrator credentials to unlock multi-node cluster topology and mission control.
          </p>
        </div>

        <div class="av-auth-body">
          <div id="avAuthErrorContainer" style="display: none;"></div>

          <form id="avAdminLoginForm" autocomplete="off">
            <div class="av-auth-field">
              <label class="av-auth-label" for="avAuthUsername">
                <span>Admin Username</span>
                <span style="font-size: 0.65rem; color: #a855f7; font-family: monospace;">REQUIRED</span>
              </label>
              <div class="av-auth-input-wrapper">
                <svg class="av-auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input 
                  type="text" 
                  id="avAuthUsername" 
                  class="av-auth-input" 
                  placeholder="Enter admin username" 
                  value="admin"
                  required 
                  autofocus
                />
              </div>
            </div>

            <div class="av-auth-field">
              <label class="av-auth-label" for="avAuthPassword">
                <span>Password</span>
                <span style="font-size: 0.65rem; color: #a855f7; font-family: monospace;">CREDENTIAL</span>
              </label>
              <div class="av-auth-input-wrapper">
                <svg class="av-auth-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <input 
                  type="password" 
                  id="avAuthPassword" 
                  class="av-auth-input" 
                  placeholder="Enter administrator password" 
                  required 
                />
                <button type="button" class="av-auth-eye-btn" id="avAuthTogglePassword" title="Show/Hide Password">
                  <svg id="avAuthEyeIcon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="av-auth-notice">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0; margin-top: 1px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <div>
                <strong>Enterprise Security Clearance:</strong><br/>
                Authorized personnel only. Access attempts are authenticated and auditable.
              </div>
            </div>

            <div class="av-auth-actions">
              <button type="submit" class="av-auth-submit-btn" id="avAuthSubmitBtn">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                </svg>
                <span>Authenticate & Enter Control Room</span>
              </button>

              <button type="button" class="av-auth-cancel-btn" id="avAuthCancelBtn">
                Stay as Employee
              </button>
            </div>
          </form>

          <div class="av-auth-footer-lock">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span>Registration disabled • Only active admins can grant access</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event Bindings
    const closeBtn = overlay.querySelector('#avAuthCloseBtn');
    const cancelBtn = overlay.querySelector('#avAuthCancelBtn');
    const form = overlay.querySelector('#avAdminLoginForm');
    const toggleEye = overlay.querySelector('#avAuthTogglePassword');
    const pwdInput = overlay.querySelector('#avAuthPassword');
    const usernameInput = overlay.querySelector('#avAuthUsername');
    const submitBtn = overlay.querySelector('#avAuthSubmitBtn');
    const errorBox = overlay.querySelector('#avAuthErrorContainer');

    function close() {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s ease';
      setTimeout(() => overlay.remove(), 200);
      pendingAction = null;
    }

    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    toggleEye.addEventListener('click', () => {
      const isPwd = pwdInput.type === 'password';
      pwdInput.type = isPwd ? 'text' : 'password';
      toggleEye.innerHTML = isPwd
        ? `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`
        : `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = usernameInput.value.trim();
      const p = pwdInput.value;

      errorBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <div class="av-auth-spinner"></div>
        <span>Verifying Security Clearance...</span>
      `;

      const result = await apiLogin(u, p);

      if (result.success) {
        setAdminSession(result.user);
        submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        submitBtn.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <span>Access Granted! Entering Control Room...</span>
        `;

        showToast(`Administrator authenticated: Welcome, ${result.user.name || result.user.username}!`, 'success');

        setTimeout(() => {
          overlay.remove();
          executeRoleSwitchToAdmin();
        }, 500);
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
          </svg>
          <span>Authenticate & Enter Control Room</span>
        `;
        errorBox.innerHTML = `
          <div class="av-auth-error">
            <svg class="av-auth-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${escapeHtml(result.message || 'Invalid username or password')}</span>
          </div>
        `;
        errorBox.style.display = 'block';
        pwdInput.focus();
        pwdInput.select();
      }
    });

    setTimeout(() => {
      if (usernameInput.value) {
        pwdInput.focus();
      } else {
        usernameInput.focus();
      }
    }, 100);
  }

  function closeAdminLoginModal() {
    const existing = document.getElementById('avAdminLoginOverlay');
    if (existing) existing.remove();
  }

  // --- Trigger Admin Role in React App ---
  function executeRoleSwitchToAdmin() {
    isBypassingAuth = true;

    // 1. If we captured a specific trigger element, click it with bypass
    if (pendingAction && pendingAction.triggerElem) {
      try {
        pendingAction.triggerElem.click();
      } catch (err) {
        console.warn('[AdminAuth] Trigger element click failed:', err);
      }
    } else {
      // 2. Otherwise look for the Administrator button in the UI
      triggerAdminButtonInDOM();
    }

    setTimeout(() => {
      isBypassingAuth = false;
      pendingAction = null;
      updateAdminManagementPills();
    }, 400);
  }

  function triggerAdminButtonInDOM() {
    // Check if on Landing page: "Enter as Administrator"
    const landingAdminCards = Array.from(document.querySelectorAll('div, button, a')).filter(el => {
      const txt = (el.innerText || el.textContent || '').trim();
      return (txt.includes('Enter as Administrator') || txt.includes('Enter Control Room')) && !el.closest('#avAdminLoginCard');
    });

    if (landingAdminCards.length > 0) {
      const card = landingAdminCards[landingAdminCards.length - 1];
      card.click();
      return;
    }

    // Check if dropdown Administrator button is already open
    const adminButtons = Array.from(document.querySelectorAll('button')).filter(b => {
      const txt = (b.innerText || b.textContent || '').trim();
      return txt.includes('Administrator') && (txt.includes('Topology') || txt.includes('Traffic'));
    });

    if (adminButtons.length > 0) {
      adminButtons[0].click();
      return;
    }

    // Try opening the Operator profile menu first
    const operatorBtn = Array.from(document.querySelectorAll('button')).find(b => {
      const txt = (b.innerText || b.textContent || '').trim();
      return txt.includes('Operator') && !b.closest('.av-auth-card');
    });

    if (operatorBtn) {
      operatorBtn.click();
      setTimeout(() => {
        const openedAdminBtn = Array.from(document.querySelectorAll('button')).find(b => {
          const txt = (b.innerText || b.textContent || '').trim();
          return txt.includes('Administrator') && txt.includes('Topology');
        });
        if (openedAdminBtn) {
          openedAdminBtn.click();
        }
      }, 100);
    }
  }

  // --- Admin Access Management Modal ---
  async function openAdminManagementModal() {
    closeAdminManagementModal();

    const overlay = document.createElement('div');
    overlay.className = 'av-auth-overlay';
    overlay.id = 'avAdminMgmtOverlay';

    overlay.innerHTML = `
      <div class="av-auth-card av-admin-mgmt-card" role="dialog" aria-modal="true">
        <div class="av-auth-glow-orb"></div>
        <div class="av-auth-glow-orb-secondary"></div>
        
        <button class="av-auth-close-btn" id="avMgmtCloseBtn" title="Close">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div class="av-auth-header">
          <div class="av-auth-badge">
            <span class="av-auth-pulse-dot"></span>
            <span>Security Subsystem</span>
          </div>
          <h2 class="av-auth-title">
            <svg width="22" height="22" fill="none" stroke="#c084fc" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Administrator Access Control
          </h2>
          <p class="av-auth-subtitle">
            Only authorized administrators can provision or revoke access to the cluster mission control room.
          </p>
        </div>

        <div class="av-mgmt-tabs">
          <button class="av-mgmt-tab-btn active" id="avTabListBtn">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Authorized Admins</span>
            <span id="avAdminCountBadge" style="background: rgba(168,85,247,0.2); padding: 1px 6px; border-radius: 99px; font-size: 0.65rem; color: #d8b4fe;">...</span>
          </button>
          <button class="av-mgmt-tab-btn" id="avTabAddBtn">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Grant New Admin Access</span>
          </button>
        </div>

        <div class="av-mgmt-content">
          <!-- List Panel -->
          <div id="avMgmtListPanel">
            <div id="avAdminsLoading" style="text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.85rem;">
              <div class="av-auth-spinner" style="margin: 0 auto 0.75rem;"></div>
              Loading authorized administrators...
            </div>
            <div class="av-admins-list" id="avAdminsListContainer" style="display: none;"></div>
          </div>

          <!-- Add Panel -->
          <div id="avMgmtAddPanel" style="display: none;">
            <div id="avAddAdminAlert" style="display: none;"></div>

            <form id="avAddAdminForm">
              <div class="av-auth-field">
                <label class="av-auth-label" for="avNewAdminUsername">
                  <span>Username</span>
                  <span style="font-size: 0.65rem; color: #a855f7; font-family: monospace;">UNIQUE ID</span>
                </label>
                <input 
                  type="text" 
                  id="avNewAdminUsername" 
                  class="av-auth-input" 
                  style="padding-left: 1rem;" 
                  placeholder="e.g. sarah_ops" 
                  required
                />
              </div>

              <div class="av-auth-field">
                <label class="av-auth-label" for="avNewAdminName">
                  <span>Full Name / Designation</span>
                  <span style="font-size: 0.65rem; color: #64748b; font-family: monospace;">OPTIONAL</span>
                </label>
                <input 
                  type="text" 
                  id="avNewAdminName" 
                  class="av-auth-input" 
                  style="padding-left: 1rem;" 
                  placeholder="e.g. Sarah Connor" 
                />
              </div>

              <div class="av-auth-field">
                <label class="av-auth-label" for="avNewAdminPassword">
                  <span>Password</span>
                  <span style="font-size: 0.65rem; color: #a855f7; font-family: monospace;">MIN 4 CHARS</span>
                </label>
                <input 
                  type="password" 
                  id="avNewAdminPassword" 
                  class="av-auth-input" 
                  style="padding-left: 1rem;" 
                  placeholder="Enter secure password" 
                  required
                />
              </div>

              <div class="av-auth-field">
                <label class="av-auth-label" for="avNewAdminRole">
                  <span>Administrative Role</span>
                </label>
                <select id="avNewAdminRole" class="av-auth-input" style="padding-left: 1rem; background-color: #0f172a;">
                  <option value="Administrator">Administrator (Full Access)</option>
                  <option value="SecOps Lead">SecOps Lead (Security & Topology)</option>
                  <option value="Cluster Engineer">Cluster Engineer (Diagnostics & Traces)</option>
                </select>
              </div>

              <div class="av-auth-actions">
                <button type="submit" class="av-auth-submit-btn" id="avCreateAdminSubmitBtn">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span>Grant Administrator Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#avMgmtCloseBtn');
    const tabListBtn = overlay.querySelector('#avTabListBtn');
    const tabAddBtn = overlay.querySelector('#avTabAddBtn');
    const listPanel = overlay.querySelector('#avMgmtListPanel');
    const addPanel = overlay.querySelector('#avMgmtAddPanel');
    const loadingElem = overlay.querySelector('#avAdminsLoading');
    const listContainer = overlay.querySelector('#avAdminsListContainer');
    const countBadge = overlay.querySelector('#avAdminCountBadge');
    const addForm = overlay.querySelector('#avAddAdminForm');
    const alertBox = overlay.querySelector('#avAddAdminAlert');

    function close() {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s ease';
      setTimeout(() => overlay.remove(), 200);
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Tab switching
    tabListBtn.addEventListener('click', () => {
      tabListBtn.classList.add('active');
      tabAddBtn.classList.remove('active');
      listPanel.style.display = 'block';
      addPanel.style.display = 'none';
      loadAdmins();
    });

    tabAddBtn.addEventListener('click', () => {
      tabAddBtn.classList.add('active');
      tabListBtn.classList.remove('active');
      listPanel.style.display = 'none';
      addPanel.style.display = 'block';
      overlay.querySelector('#avNewAdminUsername').focus();
    });

    // Load admin list
    async function loadAdmins() {
      loadingElem.style.display = 'block';
      listContainer.style.display = 'none';

      const admins = await apiFetchAdmins();
      countBadge.textContent = admins.length;
      loadingElem.style.display = 'none';
      listContainer.style.display = 'flex';
      listContainer.innerHTML = '';

      admins.forEach(admin => {
        const isMaster = admin.username.toLowerCase() === 'admin' || admin.is_default;
        const item = document.createElement('div');
        item.className = 'av-admin-item';
        item.innerHTML = `
          <div class="av-admin-info">
            <div class="av-admin-avatar">
              ${escapeHtml(admin.username.slice(0, 2).toUpperCase())}
            </div>
            <div class="av-admin-details">
              <h4>
                <span>${escapeHtml(admin.name || admin.username)}</span>
                <span class="av-role-pill ${isMaster ? 'super' : 'admin'}">
                  ${isMaster ? 'SuperAdmin' : escapeHtml(admin.role || 'Administrator')}
                </span>
              </h4>
              <p>Username: <strong>@${escapeHtml(admin.username)}</strong> • Added: ${escapeHtml(admin.created_at || 'Active')}</p>
            </div>
          </div>
          <div>
            ${isMaster 
              ? `<span style="font-size: 0.7rem; color: #94a3b8; font-family: 'JetBrains Mono', monospace; padding: 0.35rem 0.6rem; background: rgba(255,255,255,0.05); border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.08);">Protected</span>`
              : `<button class="av-revoke-btn" data-username="${escapeHtml(admin.username)}">Revoke Access</button>`
            }
          </div>
        `;

        if (!isMaster) {
          const revokeBtn = item.querySelector('.av-revoke-btn');
          revokeBtn.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to revoke administrator access for '${admin.username}'?`)) {
              revokeBtn.disabled = true;
              revokeBtn.textContent = 'Revoking...';
              const res = await apiDeleteAdmin(admin.username);
              if (res.success) {
                showToast(`Administrator '${admin.username}' revoked successfully.`, 'info');
                loadAdmins();
              } else {
                alert(res.message || 'Failed to revoke admin');
                revokeBtn.disabled = false;
                revokeBtn.textContent = 'Revoke Access';
              }
            }
          });
        }

        listContainer.appendChild(item);
      });
    }

    // Add admin submission
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = overlay.querySelector('#avNewAdminUsername').value.trim();
      const n = overlay.querySelector('#avNewAdminName').value.trim() || 'Cluster Administrator';
      const p = overlay.querySelector('#avNewAdminPassword').value;
      const r = overlay.querySelector('#avNewAdminRole').value.trim() || 'Administrator';

      const submitBtn = overlay.querySelector('#avCreateAdminSubmitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <div class="av-auth-spinner"></div>
        <span>Provisioning Access...</span>
      `;

      const result = await apiAddAdmin({ username: u, password: p, name: n, role: r });

      if (result.success) {
        showToast(`✓ Admin access granted for '@${u}'!`, 'success');
        addForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Grant Administrator Access</span>
        `;
        // Switch back to list tab
        tabListBtn.click();
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Grant Administrator Access</span>
        `;
        alertBox.innerHTML = `
          <div class="av-auth-error">
            <svg class="av-auth-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${escapeHtml(result.message)}</span>
          </div>
        `;
        alertBox.style.display = 'block';
      }
    });

    loadAdmins();
  }

  function closeAdminManagementModal() {
    const existing = document.getElementById('avAdminMgmtOverlay');
    if (existing) existing.remove();
  }

  // --- Dynamic UI Badges & Buttons ---
  function updateAdminManagementPills() {
    const isNowAdmin = isCurrentRoleAdmin();

    // 1. In header: add "Admin Access Control" button if admin
    const headerRight = document.querySelector('header .relative') || document.querySelector('header');
    let mgmtPill = document.getElementById('avHeaderAdminMgmtPill');

    if (isNowAdmin) {
      if (!mgmtPill && headerRight) {
        mgmtPill = document.createElement('button');
        mgmtPill.id = 'avHeaderAdminMgmtPill';
        mgmtPill.className = 'av-header-admin-mgmt-pill';
        mgmtPill.title = 'Manage Authorized Administrators';
        mgmtPill.innerHTML = `
          <svg width="14" height="14" fill="none" stroke="#c084fc" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span>Admin Access Control</span>
        `;
        mgmtPill.addEventListener('click', (e) => {
          e.stopPropagation();
          openAdminManagementModal();
        });
        // Insert right before the Operator profile button
        headerRight.parentNode.insertBefore(mgmtPill, headerRight);
      }
    } else {
      if (mgmtPill) mgmtPill.remove();
    }
  }

  function isCurrentRoleAdmin() {
    // Check Operator badge text in header
    const operatorBadges = Array.from(document.querySelectorAll('header span, nav span')).filter(s => {
      const txt = (s.innerText || s.textContent || '').trim().toLowerCase();
      return txt === 'admin';
    });
    return operatorBadges.length > 0;
  }

  // --- Global Capture-Phase Click Interceptor ---
  function initRoleSwitchInterceptor() {
    document.addEventListener('click', function (e) {
      if (isBypassingAuth) return;

      const target = e.target;
      if (!target) return;

      // 1. Did the user click "Employee" to switch back from admin?
      const employeeSwitchBtn = target.closest('button');
      if (employeeSwitchBtn) {
        const btnText = (employeeSwitchBtn.innerText || employeeSwitchBtn.textContent || '').trim();
        if (btnText.includes('Employee') && btnText.includes('Chat & Knowledge')) {
          // User is switching back to employee!
          if (isAdminLoggedIn()) {
            clearAdminSession();
            showToast('Switched to Employee mode. Administrator session locked.', 'info');
            setTimeout(updateAdminManagementPills, 300);
          }
          return; // Let click proceed to React to switch to employee
        }
      }

      // 2. Did the user click to switch to "Administrator"?
      const clickable = target.closest('button, [role="button"], a, div');
      if (!clickable) return;

      const text = (clickable.innerText || clickable.textContent || '').trim();

      // Case A: Operator dropdown "Administrator" button
      const isDropdownAdminBtn = clickable.tagName === 'BUTTON' && 
                                text.includes('Administrator') && 
                                (text.includes('Topology') || text.includes('Traffic') || text.includes('Traces'));

      // Case B: Landing page "Enter as Administrator" / "Enter Control Room"
      const isLandingAdminCard = (text.includes('Enter as Administrator') || text.includes('Enter Control Room')) && 
                                !clickable.closest('.av-auth-card');

      // Case C: Restricted modal "Simulate Admin & Proceed"
      const isSimulateAdminBtn = text.includes('Simulate Admin & Proceed') && !clickable.closest('.av-auth-card');

      // Case D: Restricted Admin Sidebar buttons when in Employee role
      let isRestrictedSidebarBtn = false;
      const sidebarContainer = clickable.closest('aside');
      if (sidebarContainer) {
        const isRestrictedSection = clickable.closest('div')?.previousElementSibling?.textContent?.includes('Admin Control Room') ||
                                   clickable.textContent.includes('Mission Control') ||
                                   clickable.textContent.includes('Cluster Topology') ||
                                   clickable.textContent.includes('Traffic Explorer') ||
                                   clickable.textContent.includes('Trace Waterfall');
        if (isRestrictedSection && !isCurrentRoleAdmin()) {
          isRestrictedSidebarBtn = true;
        }
      }

      if (isDropdownAdminBtn || isLandingAdminCard || isSimulateAdminBtn || isRestrictedSidebarBtn) {
        if (!isAdminLoggedIn()) {
          // STOP React from switching roles immediately!
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // If restricted modal is open, close it
          const restrictedModalClose = document.querySelector('div.fixed.inset-0.z-50 button');
          if (restrictedModalClose && isSimulateAdminBtn) {
            restrictedModalClose.click();
          }

          // Open the Admin Login Modal
          openAdminLoginModal({
            triggerElem: clickable,
            type: isDropdownAdminBtn ? 'dropdown' : (isLandingAdminCard ? 'landing' : 'sidebar')
          });
        }
      }
    }, true); // Important: capture phase to execute before React synthetic events!
  }

  // --- Initial check & DOM Observer ---
  function initObserver() {
    const observer = new MutationObserver(() => {
      updateAdminManagementPills();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    updateAdminManagementPills();
  }

  // Expose global controller
  window.AgentVerseAdminAuth = {
    openLogin: openAdminLoginModal,
    openManagement: openAdminManagementModal,
    logout: clearAdminSession,
    isLoggedIn: isAdminLoggedIn,
    getSession: getAdminSession
  };

  // Start interceptor
  initRoleSwitchInterceptor();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    initObserver();
  }

  console.log('[AgentVerse] Admin Authentication & Access Control Subsystem initialized.');
})();
