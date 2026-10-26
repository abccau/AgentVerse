/**
 * AgentVerse - Cinematic Home & Splash Experience Script
 * Integrates Stage 1 (Kinetic AGENTVERSE Reveal Splash)
 * and Stage 2 (Precision Orbit Hero, Cluster Status Bar, Specialized Agents, and Access Portals)
 */

(function () {
  // Prevent duplicate execution
  if (window.__AGENTVERSE_HERO_INITIALIZED__) return;
  window.__AGENTVERSE_HERO_INITIALIZED__ = true;

  // Render DOM nodes
  const template = `
    <!-- STAGE 1: CINEMATIC SPLASH SCREEN -->
    <section class="splash-stage" id="splash-stage" aria-label="Intro Sequence">
      <canvas class="splash-canvas" id="stars-canvas"></canvas>

      <div class="splash-rings" aria-hidden="true">
        <svg class="ring-svg" viewBox="0 0 600 600" width="100%" height="100%">
          <circle class="ring-rot-1" cx="300" cy="300" r="260" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.2" stroke-dasharray="14 36"/>
          <circle class="ring-rot-2" cx="300" cy="300" r="210" fill="none" stroke="rgba(95,242,194,0.14)" stroke-width="1" stroke-dasharray="24 16 8 16"/>
          <circle class="ring-rot-1" cx="300" cy="300" r="140" fill="none" stroke="rgba(155,140,255,0.18)" stroke-width="1.5" stroke-dasharray="6 32"/>
        </svg>
      </div>

      <div class="splash-content">
        <div class="splash-eyebrow">
          <span class="av-hero-pulse-dot"></span>
          <span>PROTOCOL // V4.9 ONLINE</span>
        </div>

        <div class="splash-title-wrapper">
          <h1 class="splash-title" id="kinetic-title" aria-label="AGENTVERSE">
            <!-- Letters populated by JS -->
          </h1>
        </div>

        <p class="splash-sub">Autonomous Multi-Agent Intelligence Network</p>

        <div class="splash-progress-wrap">
          <div class="splash-progress-bar">
            <div class="splash-progress-fill" id="progress-fill"></div>
          </div>
          <div class="splash-counter" id="progress-counter">SYS // 00%</div>
        </div>

        <button type="button" class="splash-cta" id="enter-btn">
          <span>Enter AgentVerse</span>
          <svg viewBox="0 0 9.5 8" fill="none" aria-hidden="true">
            <path d="M0.7 4H8.8M5.6 0.75 8.85 4 5.6 7.25" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </section>

    <!-- STAGE 2: ORBIT-STYLE PRECISION HERO HOME -->
    <div class="av-hero-frame" id="main-frame">
      <video
        class="av-hero-sky"
        id="bg-video"
        aria-hidden="true"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/0bf7409c-9fa2-4bef-a49d-34903dcc91ad.png"
        src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4b73c700-3112-4c07-bd48-0af2893dff7c.mp4"
      ></video>

      <div class="av-hero-veil"></div>

      <!-- Scaled Header -->
      <header class="av-hero-bar" data-open="false">
        <a class="av-hero-brand" id="brand-home" href="#" aria-label="AgentVerse — home">
          <svg viewBox="0 0 26.9 16.6" aria-hidden="true">
            <ellipse cx="13.25" cy="8.4" rx="13.2" ry="2.9" transform="rotate(-25 13.25 8.4)" stroke="currentColor" stroke-width="1.25"/>
            <circle cx="13.25" cy="8.4" r="8.8" fill="#000"/>
            <circle cx="13.25" cy="8.4" r="8.1" fill="currentColor"/>
            <ellipse cx="13.25" cy="8.4" rx="13.2" ry="2.9" transform="rotate(-25 13.25 8.4)" stroke="#000" stroke-width="0.9" stroke-dasharray="28.2 28.2"/>
            <ellipse cx="13.25" cy="8.4" rx="13.2" ry="2.9" transform="rotate(-25 13.25 8.4)" stroke="currentColor" stroke-width="1.25" stroke-dasharray="28.2 28.2"/>
          </svg>
          <div class="av-hero-brand-text">
            <span class="av-hero-brand-word">AGENTVERSE</span>
            <span class="av-hero-brand-tagline">ENTERPRISE AI PLATFORM</span>
          </div>
        </a>

        <nav class="av-hero-links" aria-label="Primary">
          <a href="#overview" class="nav-scroll-link">Overview</a>
          <a href="#access-portals" class="nav-scroll-link">Access Portals</a>
          <a href="#specialized-agents" class="nav-scroll-link">Specialized Agents</a>
        </nav>

        <div class="av-hero-actions">
          <div class="av-nodes-badge" id="top-nodes-badge">
            <span class="av-hero-pulse-dot"></span>
            <span id="top-nodes-count">3 Nodes Active</span>
          </div>
          <button class="av-hero-btn solid trigger-workspace" type="button">
            <span>Launch App</span>
            <svg viewBox="0 0 9.5 8" fill="none" style="width: 10px; height: 9px; margin-left: 6px;" aria-hidden="true">
              <path d="M0.7 4H8.8M5.6 0.75 8.85 4 5.6 7.25" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="av-hero-menu" id="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="menu-sheet">
            <svg viewBox="0 0 20 14" fill="none" aria-hidden="true">
              <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
          <nav class="av-hero-sheet" id="menu-sheet" aria-label="Menu">
            <a href="#overview" class="nav-scroll-link">Overview</a>
            <a href="#access-portals" class="nav-scroll-link">Access Portals</a>
            <a href="#specialized-agents" class="nav-scroll-link">Specialized Agents</a>
            <button class="av-hero-btn solid trigger-workspace" type="button">Launch App →</button>
          </nav>
        </div>
      </header>

      <!-- Scrollable Main Container -->
      <div class="av-hero-scroll-container">
        <!-- SECTION 1: HERO OVERVIEW -->
        <section class="av-hero-section" id="overview">
          <div class="av-hero-screen">
            <main class="av-hero-main">
              <!-- Eyebrow Pill -->
              <div class="av-hero-pill" aria-label="Autonomous Intelligence Mesh">
                <span class="av-hero-sparkle">✦</span>
                <span class="av-hero-pill-label">Autonomous Intelligence Mesh • Distributed Multi-Agent Platform</span>
              </div>

              <!-- Headline -->
              <h1>
                <span class="av-hero-ln"><span class="av-hero-ln-i">Enterprise Distributed Multi-</span></span>
                <span class="av-hero-ln"><span class="av-hero-ln-i">Agent Intelligence</span></span>
              </h1>

              <!-- Sub-headline -->
              <p>AgentVerse coordinates physical computer clusters across your local network — dynamically decomposing tasks, delegating research, generating code, and synthesizing answers across dedicated worker hardware nodes.</p>

              <!-- Node Hardware Cluster Status Cards Grid -->
              <div class="av-cluster-hud-grid" id="cluster-hud-grid">
                <div class="av-cluster-card">
                  <div class="av-card-sub">CONTROLLER</div>
                  <div class="av-card-title">Master Controller</div>
                  <div class="av-card-status"><span class="av-status-dot"></span> Online</div>
                </div>
                <div class="av-cluster-card">
                  <div class="av-card-sub">PLANNER NODE</div>
                  <div class="av-card-title">Brain & Reasoning</div>
                  <div class="av-card-status"><span class="av-status-dot"></span> Online</div>
                </div>
                <div class="av-cluster-card">
                  <div class="av-card-sub">CODING WORKER</div>
                  <div class="av-card-title">Python Engineer</div>
                  <div class="av-card-status"><span class="av-status-dot"></span> Online</div>
                </div>
                <div class="av-cluster-card">
                  <div class="av-card-sub">RESEARCH WORKER</div>
                  <div class="av-card-title">Research Specialist</div>
                  <div class="av-card-status"><span class="av-status-dot"></span> Online</div>
                </div>
              </div>

              <!-- Action Row -->
              <div class="av-hero-cta">
                <button class="av-hero-btn solid trigger-workspace" type="button">Open Workspace Console</button>
              </div>
            </main>
          </div>
        </section>

        <!-- SECTION 2: SPECIALIZED AGENT INTELLIGENCE -->
        <section class="av-content-section" id="specialized-agents">
          <div class="av-section-header">
            <h2 class="av-section-title">Specialized Agent Intelligence</h2>
            <p class="av-section-desc">Each machine is dedicated to a specific agent persona with tailored system prompts and tools.</p>
          </div>

          <div class="av-agent-cards-grid">
            <!-- Card 1 -->
            <div class="av-feature-card">
              <div class="av-card-badge blue-badge">REASONING & STRATEGY</div>
              <h3 class="av-feature-title">Autonomous Planner</h3>
              <p class="av-feature-desc">Decomposes complex requests into directed acyclic graph (DAG) tasks and determines the optimal assignment across worker nodes.</p>
            </div>

            <!-- Card 2 -->
            <div class="av-feature-card">
              <div class="av-card-badge cyan-badge">ENGINEERING & SCRIPTS</div>
              <h3 class="av-feature-title">Coding Specialist</h3>
              <p class="av-feature-desc">Generates high-performance algorithms, executes sandboxed Python scripts, and analyzes stack traces with automated self-correction.</p>
            </div>

            <!-- Card 3 -->
            <div class="av-feature-card">
              <div class="av-card-badge magenta-badge">DEEP ANALYSIS & SYNTHESIS</div>
              <h3 class="av-feature-title">Research Specialist</h3>
              <p class="av-feature-desc">Scours internal vector stores and live web sources, aggregates multi-perspective data, and synthesizes executive briefings.</p>
            </div>
          </div>
        </section>

        <!-- SECTION 3: ACCESS PORTALS -->
        <section class="av-content-section" id="access-portals">
          <div class="av-section-header">
            <h2 class="av-section-title">Select Your Access Portal</h2>
            <p class="av-section-desc">Choose your role to launch the appropriate workspace. You can switch roles anytime using the top profile controls.</p>
          </div>

          <div class="av-portals-grid" style="grid-template-columns: minmax(320px, 680px); justify-content: center;">
            <!-- Employee Portal -->
            <div class="av-portal-card employee-portal">
              <div class="av-portal-header">
                <span class="av-portal-tag">WORKSPACE PORTAL</span>
                <div class="av-portal-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>

              <h3 class="av-portal-title">Interactive AI Workspace</h3>
              <p class="av-portal-desc">Submit queries, orchestrate multi-agent workflows, access corporate RAG knowledge indices, and view step-by-step DAG execution plans.</p>

              <ul class="av-portal-checklist">
                <li>
                  <span class="av-check-icon">✓</span>
                  <span>Autonomous Multi-Agent Query Routing</span>
                </li>
                <li>
                  <span class="av-check-icon">✓</span>
                  <span>Enterprise RAG Context Retrieval & Citations</span>
                </li>
                <li>
                  <span class="av-check-icon">✓</span>
                  <span>Progressive Step Disclosure & Execution Drawer</span>
                </li>
              </ul>

              <div class="av-portal-actions">
                <a href="#employee" class="av-portal-link trigger-workspace">Enter Workspace</a>
                <button type="button" class="av-portal-btn blue-btn trigger-workspace">
                  <span>Launch Workspace</span>
                  <svg viewBox="0 0 9.5 8" fill="none" style="width: 10px; height: 9px; margin-left: 6px;">
                    <path d="M0.7 4H8.8M5.6 0.75 8.85 4 5.6 7.25" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>

    <!-- Persistent Floating Return-To-Home Button (available when inside the underlying workspace) -->
    <button type="button" class="av-nav-hero-return-btn" id="return-hero-btn" style="display: none;">
      <svg viewBox="0 0 26.9 16.6" style="width: 18px; height: 12px; fill: none;" aria-hidden="true">
        <ellipse cx="13.25" cy="8.4" rx="13.2" ry="2.9" transform="rotate(-25 13.25 8.4)" stroke="currentColor" stroke-width="1.25"/>
        <circle cx="13.25" cy="8.4" r="8.8" fill="#000"/>
        <circle cx="13.25" cy="8.4" r="8.1" fill="currentColor"/>
      </svg>
      <span>Return to Home</span>
    </button>
  `;

  // Inject into document body
  const container = document.createElement('div');
  container.id = 'agentverse-home-experience';
  container.innerHTML = template;
  document.body.prepend(container);

  // Grab element references
  const splashStage = document.getElementById('splash-stage');
  const mainFrame = document.getElementById('main-frame');
  const kineticTitle = document.getElementById('kinetic-title');
  const progressFill = document.getElementById('progress-fill');
  const progressCounter = document.getElementById('progress-counter');
  const enterBtn = document.getElementById('enter-btn');
  const bgVideo = document.getElementById('bg-video');
  const canvas = document.getElementById('stars-canvas');
  const heroBar = document.querySelector('.av-hero-bar');
  const menuBtn = document.getElementById('menu-btn');
  const brandHome = document.getElementById('brand-home');
  const returnHeroBtn = document.getElementById('return-hero-btn');

  // 1. Starfield Particle Background for Splash
  const ctx = canvas ? canvas.getContext('2d') : null;
  const stars = [];
  const numStars = 120;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  for (let s = 0; s < numStars; s++) {
    stars.push({
      x: Math.random() * (canvas ? canvas.width : 1000),
      y: Math.random() * (canvas ? canvas.height : 800),
      size: Math.random() * 1.8 + 0.4,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.7 + 0.2
    });
  }

  function drawStars() {
    if (!canvas || !ctx || splashStage.classList.contains('dismissed')) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      ctx.globalAlpha = star.opacity;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      star.y -= star.speed;
      if (star.y < 0) {
        star.y = canvas.height;
        star.x = Math.random() * canvas.width;
      }
    }
    requestAnimationFrame(drawStars);
  }

  // 2. Kinetic AGENTVERSE Letter Reveal
  const nameStr = 'AGENTVERSE';
  kineticTitle.innerHTML = '';
  for (let c = 0; c < nameStr.length; c++) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = nameStr[c];
    span.style.transitionDelay = (c * 50 + 120) + 'ms';
    kineticTitle.appendChild(span);
  }

  const glyphs = '01#@<>[]$%&*!ΔΩΨΞ';
  function scrambleLetters() {
    const chars = kineticTitle.querySelectorAll('.char');
    chars.forEach((el, idx) => {
      const original = nameStr[idx];
      let count = 0;
      const interval = setInterval(() => {
        if (count > 7) {
          clearInterval(interval);
          el.textContent = original;
        } else {
          el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
          count++;
        }
      }, 45 + idx * 8);
    });
  }

  // 3. Splash Progress & Launch Timeline
  let progress = 0;
  let splashTimer = null;
  let autoTransitionTimer = null;

  function startSplashSequence() {
    splashStage.classList.remove('dismissed');
    splashStage.classList.remove('active');
    enterBtn.classList.remove('ready');
    mainFrame.classList.remove('revealed');
    mainFrame.classList.remove('hidden-hero');
    document.documentElement.classList.remove('hero-intro', 'hero-play');
    returnHeroBtn.style.display = 'none';

    progress = 0;
    progressFill.style.width = '0%';
    progressCounter.textContent = 'SYS // 00%';

    void splashStage.offsetWidth;
    splashStage.classList.add('active');
    scrambleLetters();

    if (splashTimer) clearInterval(splashTimer);
    splashTimer = setInterval(() => {
      progress += Math.floor(Math.random() * 4) + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(splashTimer);
        enterBtn.classList.add('ready');
        autoTransitionTimer = setTimeout(() => {
          if (!splashStage.classList.contains('dismissed')) {
            transitionToHero();
          }
        }, 3600);
      }
      progressFill.style.width = progress + '%';
      progressCounter.textContent = 'SYS // ' + (progress < 10 ? '0' : '') + progress + '%';
    }, 32);

    drawStars();
  }

  function transitionToHero() {
    if (autoTransitionTimer) clearTimeout(autoTransitionTimer);
    splashStage.classList.add('dismissed');
    mainFrame.classList.add('revealed');
    mainFrame.classList.remove('hidden-hero');
    returnHeroBtn.style.display = 'none';

    if (bgVideo) {
      bgVideo.muted = true;
      const p = bgVideo.play();
      if (p && p.catch) p.catch(() => {});
    }

    triggerHeroEntrance();
  }

  function triggerUnderlyingReactLogin(role = 'employee', view = 'chat') {
    // 1. Try to find and trigger the native React Launch App button in the DOM
    const reactLaunchBtns = Array.from(document.querySelectorAll('#root button'));
    let matchedBtn = null;
    for (const b of reactLaunchBtns) {
      const txt = (b.textContent || '').trim();
      if (role === 'admin' && (txt.includes('Control Room') || txt.includes('Administrator'))) {
        matchedBtn = b;
        break;
      }
      if (role === 'employee' && (txt.includes('Launch App') || txt.includes('Launch Workspace') || txt.includes('Employee'))) {
        matchedBtn = b;
        break;
      }
      if (txt.includes('Launch App')) {
        matchedBtn = b;
      }
    }

    if (matchedBtn) {
      matchedBtn.click();
      return;
    }

    // 2. Fallback: Search for any internal React event handler on #root children
    try {
      const rootDiv = document.getElementById('root');
      if (rootDiv && rootDiv.children.length > 0) {
        const firstChild = rootDiv.children[0];
        const fiberKey = Object.keys(firstChild).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
        if (fiberKey) {
          let fiber = firstChild[fiberKey];
          while (fiber) {
            if (fiber.memoizedProps && typeof fiber.memoizedProps.onLogin === 'function') {
              fiber.memoizedProps.onLogin(role, view);
              return;
            }
            if (fiber.memoizedProps && typeof fiber.memoizedProps.onNavigate === 'function') {
              fiber.memoizedProps.onNavigate(view);
              return;
            }
            fiber = fiber.return;
          }
        }
      }
    } catch (err) {
      console.warn('[AgentVerse] React fiber trigger error:', err);
    }
  }

  function switchToWorkspace(role = 'employee', view = 'chat') {
    mainFrame.classList.add('hidden-hero');
    if (returnHeroBtn) returnHeroBtn.style.display = 'none';

    // Trigger navigation into Chat in the underlying React application
    triggerUnderlyingReactLogin(role, view);

    // Also dispatch custom event for any listeners
    window.dispatchEvent(new CustomEvent('agentverse:switch-role', { detail: { role, view } }));
  }

  enterBtn.addEventListener('click', transitionToHero);

  brandHome.addEventListener('click', (e) => {
    e.preventDefault();
    const scrollContainer = document.querySelector('.av-hero-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  if (returnHeroBtn) {
    returnHeroBtn.style.display = 'none';
  }

  // Switch to workspace triggers
  document.querySelectorAll('.trigger-workspace').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const href = el.getAttribute('href') || '';
      let role = 'employee';
      let view = 'chat';
      if (href.includes('admin') || el.classList.contains('purple-btn')) {
        role = 'admin';
        view = 'admin-overview';
      }
      switchToWorkspace(role, view);
    });
  });

  // Smooth scroll links within the home page
  document.querySelectorAll('.nav-scroll-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
          setMenu(false);
        }
      }
    });
  });

  // 4. Hero Stage 2 Entrance Sequence
  function triggerHeroEntrance() {
    const root = document.documentElement;
    root.classList.add('hero-intro');

    function fire() {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.add('hero-play');
        });
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fire);
    } else {
      setTimeout(fire, 350);
    }

    setTimeout(() => {
      root.classList.remove('hero-intro', 'hero-play');
    }, 2800);
  }

  // 5. Mobile Menu Controller
  function setMenu(open) {
    heroBar.dataset.open = open ? 'true' : 'false';
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  setMenu(false);
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu(heroBar.dataset.open !== 'true');
  });
  document.addEventListener('click', (e) => {
    if (!heroBar.contains(e.target)) setMenu(false);
  });

  // Dynamic cluster status in navbar badge
  async function fetchClusterInfo() {
    try {
      const res = await fetch('/api/v1/cluster');
      if (res.ok) {
        const data = await res.json();
        const topBadge = document.getElementById('top-nodes-count');
        const count = data.connected_count || (data.nodes ? data.nodes.length : 3);
        if (topBadge) topBadge.textContent = `${count} Nodes Active`;
      }
    } catch (e) {
      // Offline fallback
    }
  }
  fetchClusterInfo();

  // Auto-advance underlying React app from 'home' to 'chat' workspace so that landing page is never shown
  function ensureReactWorkspaceActive() {
    triggerUnderlyingReactLogin('employee', 'chat');
  }



  // Global click interceptor to make 'Home' and 'AgentVerse' header/sidebar buttons seamlessly open the Home page
  document.addEventListener('click', (e) => {
    // Check if clicked element or its parent is a button or link with Home/AgentVerse branding
    const target = e.target.closest('button, a');
    if (!target) return;

    // Ignore clicks inside the cinematic hero frame itself
    if (mainFrame && mainFrame.contains(target)) return;
    if (splashStage && splashStage.contains(target)) return;

    const title = (target.getAttribute('title') || '').toLowerCase();
    const text = (target.textContent || '').trim().toLowerCase();

    // Check if user clicked the Home button or AgentVerse brand in header or sidebar
    const isHomeBtn = text === 'home' || text === 'home overview' || title.includes('home') || title.includes('landing page');
    const isBrandBtn = (text === 'agentverse' && title.includes('home')) || title === 'return to home overview' || title === 'return to home landing page';

    if (isHomeBtn || isBrandBtn) {
      // Prevent broken/empty React landing state and open the full Cinematic Home Page
      e.preventDefault();
      e.stopPropagation();

      transitionToHero();

      // Scroll smoothly to top of the hero home frame
      const scrollContainer = document.querySelector('.av-hero-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, true); // Capture phase ensures prompt and reliable interception

  // Function to remove all Admin Control Room UI, Administrator switcher, and Restricted modal
  function removeAdminElements() {
    // 1. Remove Admin Control Room block in the sidebar
    document.querySelectorAll('span, div, h3').forEach((el) => {
      const text = (el.textContent || '').trim();

      // Sidebar Admin Control Room section
      if (text === 'Admin Control Room' || text.startsWith('ADMIN CONTROL ROOM')) {
        // Find the wrapper container in the sidebar (usually a div with mt-6 pt-5)
        const container = el.closest('div.mt-6, div.pt-5') || el.closest('div[class*="border-t"]') || el.parentElement;
        if (container) {
          container.style.display = 'none';
          container.setAttribute('aria-hidden', 'true');
        }
      }

      // Administrator card / button in user dropdown
      if (text === 'Administrator' && el.tagName === 'DIV' && el.closest('button')) {
        const btn = el.closest('button');
        if (btn) {
          btn.style.display = 'none';
          btn.setAttribute('aria-hidden', 'true');
        }
      }

      // 'SWITCH ACTIVE ROLE' header if only Employee is present
      if (text === 'SWITCH ACTIVE ROLE' || text === 'Switch Active Role') {
        el.style.display = 'none';
      }

      // Administrator Access Required modal
      if (text === 'Administrator Access Required') {
        const modalWrap = el.closest('div.fixed.inset-0') || el.closest('div[role="dialog"]');
        if (modalWrap) {
          modalWrap.style.display = 'none';
          modalWrap.setAttribute('aria-hidden', 'true');
        }
      }
    });

    // Also remove any sidebar buttons with Mission Control, Cluster Topology, Traffic Explorer, Trace Waterfall
    document.querySelectorAll('aside button, nav button').forEach((btn) => {
      const txt = (btn.textContent || '').trim();
      if (
        txt.includes('Mission Control') ||
        txt.includes('Cluster Topology') ||
        txt.includes('Traffic Explorer') ||
        txt.includes('Trace Waterfall')
      ) {
        btn.style.display = 'none';
      }
    });
  }

  // Run cleanup on load, on DOM mutations, and on clicks
  const adminCleanerObserver = new MutationObserver(() => {
    removeAdminElements();
  });
  adminCleanerObserver.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
  document.addEventListener('click', () => {
    setTimeout(removeAdminElements, 10);
    setTimeout(removeAdminElements, 100);
  });

  // Start initialization
  startSplashSequence();
  setTimeout(ensureReactWorkspaceActive, 200);
  setTimeout(ensureReactWorkspaceActive, 600);
  setTimeout(removeAdminElements, 300);
  setTimeout(removeAdminElements, 800);
})();
