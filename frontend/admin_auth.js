/**
 * AgentVerse - Enterprise Administrator Authentication & Access Management
 * 
 * Ensures complete separation of the Employee and Administrator portals.
 * - Employee portal strictly contains ZERO admin buttons or restricted links.
 * - Administrator portal is guarded by password authentication (admin / admin@123).
 * - Administrator Access Control modal provides reliable Back and Close buttons.
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
      document.body.setAttribute('data-portal-role', 'admin');
    } catch (e) {
      console.error('[AdminAuth] Error saving session:', e);
    }
  }

  function clearAdminSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      window.AgentVerseCurrentAdmin = null;
      document.body.setAttribute('data-portal-role', 'employee');
      updateAdminManagementPills();
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
  function openAdminLoginModal(options = {}) {
    closeAdminLoginModal();

    const overlay = document.createElement('div');
    overlay.className = 'av-auth-overlay';
    overlay.id = 'avAdminLoginOverlay';

    overlay.innerHTML = `
      <div class="av-auth-card" id="avAdminLoginCard" role="dialog" aria-modal="true" aria-labelledby="avAuthTitle">
        <div class="av-auth-glow-orb"></div>
        <div class="av-auth-glow-orb-secondary"></div>
        
        <div class="av-auth-header">
          <div class="av-modal-top-bar">
            <button class="av-modal-back-btn" id="avAuthBackBtn" type="button" title="Back to Home Portal">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span>Back to Portal</span>
            </button>
            <button class="av-auth-close-btn" id="avAuthCloseBtn" type="button" title="Close Modal">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="av-auth-badge">
            <span class="av-auth-pulse-dot"></span>
            <span>Administrator Access Control</span>
          </div>
          <h2 class="av-auth-title" id="avAuthTitle">
            <svg width="22" height="22" fill="none" stroke="#c084fc" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Administrator Login
          </h2>
          <p class="av-auth-subtitle">
            Please authenticate with authorized credentials to enter the Cluster Mission Control room.
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
                Authorized administrators only. Access attempts are authenticated and auditable.
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
                Cancel & Return
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

    const closeBtn = overlay.querySelector('#avAuthCloseBtn');
    const backBtn = overlay.querySelector('#avAuthBackBtn');
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
    }

    if (closeBtn) closeBtn.onclick = close;
    if (backBtn) backBtn.onclick = close;
    if (cancelBtn) cancelBtn.onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };

    if (toggleEye) {
      toggleEye.onclick = () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        toggleEye.innerHTML = isPwd
          ? `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`
          : `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
      };
    }

    form.onsubmit = async (e) => {
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
          if (options.onSuccess && typeof options.onSuccess === 'function') {
            options.onSuccess(result.user);
          }
          updateAdminManagementPills();
        }, 400);
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
    };

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

  // --- Admin Access Management Modal with Bulletproof Back/Close Buttons ---
  async function openAdminManagementModal() {
    closeAdminManagementModal();

    const overlay = document.createElement('div');
    overlay.className = 'av-auth-overlay';
    overlay.id = 'avAdminMgmtOverlay';

    overlay.innerHTML = `
      <div class="av-auth-card av-admin-mgmt-card" id="avAdminMgmtCard" role="dialog" aria-modal="true">
        <div class="av-auth-glow-orb"></div>
        <div class="av-auth-glow-orb-secondary"></div>
        
        <div class="av-auth-header">
          <div class="av-modal-top-bar">
            <button class="av-modal-back-btn" id="avMgmtBackBtn" type="button" title="Back to Mission Control">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span>Back to Mission Control</span>
            </button>
            <button class="av-auth-close-btn" id="avMgmtCloseBtn" type="button" title="Close Panel">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

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
          <button class="av-mgmt-tab-btn active" id="avTabListBtn" type="button">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Authorized Admins</span>
            <span id="avAdminCountBadge" style="background: rgba(168,85,247,0.2); padding: 1px 6px; border-radius: 99px; font-size: 0.65rem; color: #d8b4fe;">1</span>
          </button>
          <button class="av-mgmt-tab-btn" id="avTabAddBtn" type="button">
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

        <div class="av-mgmt-footer">
          <button class="av-modal-done-btn" id="avMgmtDoneBtn" type="button">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span>Back to Mission Control</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#avMgmtCloseBtn');
    const backBtn = overlay.querySelector('#avMgmtBackBtn');
    const doneBtn = overlay.querySelector('#avMgmtDoneBtn');
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

    if (closeBtn) closeBtn.onclick = close;
    if (backBtn) backBtn.onclick = close;
    if (doneBtn) doneBtn.onclick = close;

    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };

    // Tab switching
    if (tabListBtn) {
      tabListBtn.onclick = () => {
        tabListBtn.classList.add('active');
        tabAddBtn.classList.remove('active');
        listPanel.style.display = 'block';
        addPanel.style.display = 'none';
        loadAdmins();
      };
    }

    if (tabAddBtn) {
      tabAddBtn.onclick = () => {
        tabAddBtn.classList.add('active');
        tabListBtn.classList.remove('active');
        listPanel.style.display = 'none';
        addPanel.style.display = 'block';
        const userInp = overlay.querySelector('#avNewAdminUsername');
        if (userInp) userInp.focus();
      };
    }

    // Load admin list
    async function loadAdmins() {
      if (loadingElem) loadingElem.style.display = 'block';
      if (listContainer) listContainer.style.display = 'none';

      const admins = await apiFetchAdmins();
      if (countBadge) countBadge.textContent = admins.length;
      if (loadingElem) loadingElem.style.display = 'none';
      if (listContainer) {
        listContainer.style.display = 'flex';
        listContainer.innerHTML = '';
      }

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
              : `<button class="av-revoke-btn" data-username="${escapeHtml(admin.username)}" type="button">Revoke Access</button>`
            }
          </div>
        `;

        if (!isMaster) {
          const revokeBtn = item.querySelector('.av-revoke-btn');
          if (revokeBtn) {
            revokeBtn.onclick = async () => {
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
            };
          }
        }

        if (listContainer) listContainer.appendChild(item);
      });
    }

    // Add admin submission
    if (addForm) {
      addForm.onsubmit = async (e) => {
        e.preventDefault();
        const u = overlay.querySelector('#avNewAdminUsername').value.trim();
        const n = overlay.querySelector('#avNewAdminName').value.trim() || 'Cluster Administrator';
        const p = overlay.querySelector('#avNewAdminPassword').value;
        const r = overlay.querySelector('#avNewAdminRole').value.trim() || 'Administrator';

        const submitBtn = overlay.querySelector('#avCreateAdminSubmitBtn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <div class="av-auth-spinner"></div>
            <span>Provisioning Access...</span>
          `;
        }

        const result = await apiAddAdmin({ username: u, password: p, name: n, role: r });

        if (result.success) {
          showToast(`✓ Admin access granted for '@${u}'!`, 'success');
          addForm.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>Grant Administrator Access</span>
            `;
          }
          if (tabListBtn) tabListBtn.click();
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>Grant Administrator Access</span>
            `;
          }
          if (alertBox) {
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
        }
      };
    }

    loadAdmins();
  }

  function closeAdminManagementModal() {
    const existing = document.getElementById('avAdminMgmtOverlay');
    if (existing) {
      existing.style.opacity = '0';
      existing.style.transition = 'opacity 0.2s ease';
      setTimeout(() => existing.remove(), 200);
    }
  }

  // --- Dynamic UI Badges & Buttons for Admin Only ---
  function updateAdminManagementPills() {
    const isAdmin = isCurrentRoleAdmin();

    // Set body role attribute
    document.body.setAttribute('data-portal-role', isAdmin ? 'admin' : 'employee');

    const headerRight = document.querySelector('header .relative') || document.querySelector('header');
    let mgmtPill = document.getElementById('avHeaderAdminMgmtPill');

    if (isAdmin && isAdminLoggedIn()) {
      if (!mgmtPill && headerRight) {
        mgmtPill = document.createElement('button');
        mgmtPill.id = 'avHeaderAdminMgmtPill';
        mgmtPill.type = 'button';
        mgmtPill.className = 'av-header-admin-mgmt-pill';
        mgmtPill.title = 'Manage Authorized Administrators';
        mgmtPill.innerHTML = `
          <svg width="14" height="14" fill="none" stroke="#c084fc" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span>Admin Access Control</span>
        `;
        mgmtPill.onclick = (e) => {
          e.stopPropagation();
          openAdminManagementModal();
        };
        headerRight.parentNode.insertBefore(mgmtPill, headerRight);
      }
    } else {
      if (mgmtPill) mgmtPill.remove();
    }
  }

  function isCurrentRoleAdmin() {
    const operatorBadges = Array.from(document.querySelectorAll('header span, nav span')).filter(s => {
      const txt = (s.innerText || s.textContent || '').trim().toLowerCase();
      return txt === 'admin';
    });
    return operatorBadges.length > 0;
  }

  // Global keyboard listener (Escape closes modals)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAdminManagementModal();
      closeAdminLoginModal();
    }
  });

  // Global delegated click listener for modal close/back buttons
  document.addEventListener('click', function (e) {
    if (e.target.closest('#avMgmtCloseBtn') || e.target.closest('#avMgmtBackBtn') || e.target.closest('#avMgmtDoneBtn')) {
      closeAdminManagementModal();
    }
    if (e.target.closest('#avAuthCloseBtn') || e.target.closest('#avAuthBackBtn') || e.target.closest('#avAuthCancelBtn')) {
      closeAdminLoginModal();
    }
  });

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    initObserver();
  }

  console.log('[AgentVerse] Admin Authentication & Strict Separation Subsystem initialized.');
})();
