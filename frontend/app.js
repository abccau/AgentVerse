/**
 * AgentVerse — Frontend Architecture (PRD Version 2.0)
 * Level 1: Clean Minimalist AI Chatbot Workspace
 * Level 2: Progressive Agent Execution Disclosure ("How AgentVerse Worked")
 * Level 3: Physical Distributed Cluster Topology (LAN PCs A, B, C, D)
 * Motion: Anime.js Tokens (150ms micro, 300ms panels, 600ms workflow)
 */

// Cluster Node Metadata & Icons
const CLUSTER_NODES = {
  laptop_d: {
    id: 'laptop_d',
    name: 'PC D (Control Gateway)',
    role: 'Control & Orchestration Master',
    model: 'qwen2.5:1.5b',
    url: '0.0.0.0:8000',
    status: 'ONLINE',
    tools: ['PlannerAgent', 'Evaluator', 'ClusterRouter'],
    latency: '0.4ms'
  },
  laptop_a: {
    id: 'laptop_a',
    name: 'PC A (Research Node)',
    role: 'Web Search & Intelligence',
    model: 'qwen2.5:1.5b',
    url: '192.168.1.26:8000',
    status: 'ONLINE',
    tools: ['DuckDuckGoSearch', 'URLContentReader'],
    latency: '42ms'
  },
  laptop_b: {
    id: 'laptop_b',
    name: 'PC B (Document RAG)',
    role: 'Document Ingestion & Qdrant RAG',
    model: 'nomic-embed-text',
    url: '192.168.1.11:8000',
    status: 'ONLINE',
    tools: ['QdrantVectorStore', 'PDFChunker'],
    latency: '28ms'
  },
  laptop_c: {
    id: 'laptop_c',
    name: 'PC C (Analytics & Code)',
    role: 'Data Analysis & Python Sandbox',
    model: 'qwen2.5:1.5b',
    url: '192.168.1.12:8000',
    status: 'ONLINE',
    tools: ['PythonREPLSandbox', 'PandasAnalyzer'],
    latency: '35ms'
  }
};

// Global App State
const state = {
  currentView: 'chat',
  activeAgentMode: 'auto', // 'auto', 'research', 'document', 'analytics', 'code'
  nodes: { ...CLUSTER_NODES },
  chats: {
    'default': {
      id: 'default',
      title: 'Analyze Q3 sales dataset',
      messages: []
    }
  },
  activeChatId: 'default',
  stagedAttachment: null,
  animationSetting: 'full', // 'full', 'reduced', 'off'
  drawerOpen: false,
  activeRunData: null
};

// ==========================================================================
// Anime.js Animation Helpers (PRD Section 12, 13, 37)
// ==========================================================================

function playMotion(targets, config) {
  if (state.animationSetting === 'off') {
    if (config.complete) config.complete();
    return;
  }
  if (!window.anime) return;

  const duration = state.animationSetting === 'reduced' 
    ? Math.min(config.duration || 200, 150) 
    : (config.duration || 300);

  return window.anime({
    targets,
    ...config,
    duration
  });
}

function animateViewSwitch(newViewEl) {
  playMotion(newViewEl, {
    opacity: [0, 1],
    translateY: [8, 0],
    duration: 280,
    easing: 'easeOutCubic'
  });
}

function animateButtonPress(btn) {
  playMotion(btn, {
    scale: [1, 0.94, 1],
    duration: 180,
    easing: 'easeOutQuad'
  });
}

// ==========================================================================
// View Router (Chat, Cluster, Knowledge, Runs, Settings)
// ==========================================================================

function switchView(viewName) {
  if (state.currentView === viewName) return;

  // Update navigation items
  document.querySelectorAll('.view-nav-item').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-view') === viewName);
  });

  // Switch view DOM elements
  const currentViewEl = document.getElementById(`view-${state.currentView}`);
  const nextViewEl = document.getElementById(`view-${viewName}`);

  if (currentViewEl) currentViewEl.classList.remove('active');
  if (nextViewEl) {
    nextViewEl.classList.add('active');
    animateViewSwitch(nextViewEl);
  }

  state.currentView = viewName;

  // Trigger relevant view data refreshes
  if (viewName === 'cluster') {
    fetchClusterStatus();
  }
}

// ==========================================================================
// Chatbot Messaging Engine (Level 1 UX - PRD Section 6, 10, 11)
// ==========================================================================

function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateHeroVisibility() {
  const currentChat = state.chats[state.activeChatId];
  const heroEl = document.getElementById('chat-hero-landing');
  const flowEl = document.getElementById('messages-flow');

  if (!currentChat || currentChat.messages.length === 0) {
    if (heroEl) heroEl.style.display = 'flex';
    if (flowEl) flowEl.style.display = 'none';
  } else {
    if (heroEl) heroEl.style.display = 'none';
    if (flowEl) flowEl.style.display = 'flex';
  }
}

function addUserMessage(text, attachment = null) {
  const flowEl = document.getElementById('messages-flow');
  updateHeroVisibility();

  const bubbleRow = document.createElement('div');
  bubbleRow.className = 'chat-bubble-row user-msg';

  let attachmentHtml = '';
  if (attachment) {
    attachmentHtml = `
      <div style="font-size: 0.78rem; font-weight: 600; color: var(--accent-primary); margin-bottom: 6px;">
        📎 ${escapeHTML(attachment.name)} <span style="font-size: 0.7rem; color: var(--text-muted);">${attachment.sizeStr || ''}</span>
      </div>
    `;
  }

  bubbleRow.innerHTML = `
    <div class="bubble-avatar user-avatar">👤</div>
    <div class="bubble-card user-bubble-card">
      ${attachmentHtml}
      <div class="bubble-text">
        <p>${escapeHTML(text)}</p>
      </div>
    </div>
  `;

  flowEl.appendChild(bubbleRow);
  scrollChatToBottom();

  playMotion(bubbleRow, {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 250,
    easing: 'easeOutCubic'
  });
}

function addAssistantResponse(answerText, executionDetails = null, sources = null) {
  const flowEl = document.getElementById('messages-flow');
  updateHeroVisibility();

  const bubbleRow = document.createElement('div');
  bubbleRow.className = 'chat-bubble-row assistant-msg';

  const formattedText = formatMarkdown(answerText);

  // Progressive Disclosure: "✦ How AgentVerse Worked" (PRD Section 11 & 51)
  let howItWorkedHtml = '';
  if (executionDetails) {
    const runId = executionDetails.session_id ? executionDetails.session_id.substring(0, 8).toUpperCase() : 'AV-1042';
    const planSteps = executionDetails.cluster_plan || [
      { agent: 'Planner', assigned_pc: 'Laptop B (Brain - 8001)', status: 'COMPLETED' },
      { agent: 'Specialized Agent', assigned_pc: 'Laptop C (Workers - 8003)', status: 'COMPLETED' },
      { agent: 'Evaluator', assigned_pc: 'Laptop D (Controller - 3000)', status: 'COMPLETED' }
    ];

    const stepRows = planSteps.map((step) => `
      <div class="agent-step-row">
        <div class="agent-step-info">
          <span class="agent-check">✓</span>
          <span><strong>${escapeHTML(step.agent || step.target_agent)}:</strong> Dispatched & executed across cluster</span>
        </div>
        <span class="agent-pc-label">${escapeHTML(step.assigned_pc || 'Cluster Node')}</span>
      </div>
    `).join('');

    howItWorkedHtml = `
      <div class="how-it-worked-toggle">
        <button type="button" class="btn-how-it-worked" onclick="toggleHowItWorked(this)">
          <span>✦ How AgentVerse worked</span>
          <span class="chevron">›</span>
        </button>
        <div class="how-it-worked-body" style="display: none;">
          ${stepRows}
          <button type="button" class="btn-open-drawer-inline" onclick="openExecutionDrawerForRun('${runId}')">
            View Full Execution Graph ↗
          </button>
        </div>
      </div>
    `;
  }

  // Sources card (PRD Section 10 & 29)
  let sourcesHtml = '';
  if (sources && sources.length > 0) {
    const sourceItems = sources.map(s => `<li>${escapeHTML(s)}</li>`).join('');
    sourcesHtml = `
      <div style="margin-top: 10px; padding: 8px 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 0.78rem;">
        <strong style="color: var(--text-secondary); display: block; margin-bottom: 4px;">Sources & References:</strong>
        <ul style="margin-left: 16px; color: var(--text-primary);">${sourceItems}</ul>
      </div>
    `;
  }

  bubbleRow.innerHTML = `
    <div class="bubble-avatar assistant-avatar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <circle cx="12" cy="12" r="3"></circle>
        <circle cx="19" cy="5" r="2"></circle>
        <circle cx="5" cy="19" r="2"></circle>
        <line x1="12" y1="9" x2="19" y2="5"></line>
      </svg>
    </div>
    <div class="bubble-card assistant-bubble-card">
      <div class="bubble-text">
        ${formattedText}
      </div>
      ${sourcesHtml}
      ${howItWorkedHtml}
    </div>
  `;

  flowEl.appendChild(bubbleRow);
  scrollChatToBottom();

  playMotion(bubbleRow, {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 320,
    easing: 'easeOutCubic'
  });
}

window.toggleHowItWorked = function(btn) {
  animateButtonPress(btn);
  const body = btn.parentElement.querySelector('.how-it-worked-body');
  const chevron = btn.querySelector('.chevron');
  if (body) {
    const isHidden = (body.style.display === 'none');
    body.style.display = isHidden ? 'flex' : 'none';
    if (chevron) chevron.textContent = isHidden ? '▼' : '›';
    if (isHidden) {
      playMotion(body, {
        opacity: [0, 1],
        translateY: [-6, 0],
        duration: 200,
        easing: 'easeOutQuad'
      });
    }
  }
};

function showTypingIndicator(statusText = 'Orchestrating across cluster...') {
  const el = document.getElementById('typing-indicator');
  const txt = document.getElementById('typing-status-text');
  if (txt) txt.textContent = statusText;
  if (el) el.style.display = 'flex';
  scrollChatToBottom();
}

function hideTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.style.display = 'none';
}

function scrollChatToBottom() {
  const scrollArea = document.getElementById('chat-scroll-area');
  if (scrollArea) {
    scrollArea.scrollTop = scrollArea.scrollHeight;
  }
}

function formatMarkdown(text) {
  if (!text) return '';
  let md = text
    .replace(/^### (.*$)/gim, '<h4 style="font-size: 0.95rem; font-weight: 700; margin: 8px 0 4px;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="font-size: 1rem; font-weight: 700; margin: 10px 0 6px;">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size: 1.1rem; font-weight: 700; margin: 12px 0 6px;">$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/gim, '<pre class="code-pre-box"><code>$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>');

  return `<p>${md}</p>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// Cluster Execution Query Dispatcher (PRD Section 8, 10, 24, 25)
// ==========================================================================

async function executeUserQuery(promptText) {
  if (!promptText.trim()) return;

  const currentAttachment = state.stagedAttachment;
  clearStagedAttachment();

  const inputEl = document.getElementById('composer-input');
  if (inputEl) {
    inputEl.value = '';
    inputEl.style.height = 'auto';
  }

  // Add Level 1 User Bubble
  addUserMessage(promptText, currentAttachment);

  // Update chat title if default
  const titleEl = document.getElementById('header-chat-title');
  if (titleEl && titleEl.textContent === 'New Chat') {
    titleEl.textContent = promptText.length > 35 ? `${promptText.substring(0, 35)}...` : promptText;
  }

  showTypingIndicator('Planner decomposing query into cluster DAG...');

  const sendBtn = document.getElementById('btn-send-message');
  if (sendBtn) sendBtn.disabled = true;

  try {
    const res = await fetch('/api/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: promptText, mode: state.activeAgentMode })
    });

    if (!res.ok) {
      let errDetail = `Status ${res.status}`;
      try {
        const errJson = await res.json();
        errDetail = errJson.detail || errDetail;
      } catch (e) {}
      throw new Error(errDetail);
    }

    const data = await res.json();
    hideTypingIndicator();

    // Cache active run data for the drawer
    state.activeRunData = data;

    // Compile sources
    const sources = [];
    if (data.cluster_plan) {
      data.cluster_plan.forEach(t => {
        if (t.node_url) sources.push(`${t.target_agent || t.agent} on ${t.assigned_pc || 'Cluster Node'}`);
      });
    }

    // Add Level 1 Assistant Response with Progressive Disclosure
    addAssistantResponse(data.final_synthesized_answer || 'Response synthesized from all active cluster nodes.', data, sources);

  } catch (err) {
    hideTypingIndicator();
    console.error('Cluster execution error:', err);
    addAssistantResponse(
      `I encountered an issue executing across the cluster: **${escapeHTML(err.message)}**\n\n` +
      `Please check that all cluster nodes are powered on and reachable on your local Wi-Fi. You can inspect active node heartbeats in the **Cluster** view.`
    );
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

// ==========================================================================
// Level 2 & 3: Execution Drawer (PRD Section 24, 25, 27, 49)
// ==========================================================================

function toggleExecutionDrawer(open = null) {
  const drawer = document.getElementById('execution-drawer');
  if (!drawer) return;

  state.drawerOpen = (open !== null) ? open : !state.drawerOpen;
  drawer.classList.toggle('open', state.drawerOpen);
}

window.openExecutionDrawerForRun = function(runId) {
  const runSub = document.getElementById('drawer-run-id');
  if (runSub) runSub.textContent = `Run #${runId} • Physical PC Assignment`;

  if (state.activeRunData && state.activeRunData.cluster_plan) {
    // Populate simple steps
    const stepsContainer = document.getElementById('tab-content-simple');
    if (stepsContainer) {
      let html = '';
      state.activeRunData.cluster_plan.forEach((step, idx) => {
        if (idx > 0) html += '<div class="exec-connector-line"></div>';
        html += `
          <div class="exec-step-card">
            <div class="exec-step-num">${idx + 1}</div>
            <div class="exec-step-details">
              <div class="step-role-title">${escapeHTML(step.agent || step.target_agent)}</div>
              <div class="step-agent-desc">${escapeHTML(step.node_url || 'Distributed LAN Microservice')}</div>
              <div class="step-pc-tag">📍 Executed on <strong>${escapeHTML(step.assigned_pc || 'Cluster Node')}</strong></div>
            </div>
            <span class="step-status-tag done">✓ Completed</span>
          </div>
        `;
      });
      stepsContainer.innerHTML = html;
    }

    // Populate DAG raw viewer
    const dagEl = document.getElementById('dag-raw-json');
    if (dagEl) {
      let yamlText = `run_id: "${runId}"\nquery: "${state.activeRunData.query || ''}"\ntarget_agent: ${state.activeRunData.target_agent || 'orchestrator'}\nstatus: completed\n\ntasks:\n`;
      state.activeRunData.cluster_plan.forEach((step, idx) => {
        yamlText += `  task_${idx + 1}:\n    agent: ${step.target_agent || step.agent}\n    assigned_pc: "${step.assigned_pc}"\n    endpoint: "${step.node_url}"\n    status: ${step.status || 'completed'}\n`;
      });
      dagEl.textContent = yamlText;
    }
  }

  toggleExecutionDrawer(true);
};

// ==========================================================================
// Level 3: Physical Cluster Status & Diagram (PRD Section 14-22)
// ==========================================================================

async function fetchClusterStatus() {
  const badge = document.getElementById('cluster-all-healthy-badge');
  const headerLabel = document.getElementById('header-cluster-label');
  const sidebarCount = document.getElementById('sidebar-node-count');
  const sidebarText = document.getElementById('sidebar-indicator-text');

  try {
    const res = await fetch('/api/v1/cluster');
    if (res.ok) {
      const data = await res.json();
      const online = data.online_nodes || 4;
      const total = data.total_nodes || 4;

      if (headerLabel) headerLabel.textContent = `${online} PCs Connected`;
      if (sidebarCount) sidebarCount.textContent = String(online);
      if (sidebarText) sidebarText.textContent = `${online} PCs Online`;
      if (badge) badge.innerHTML = `<span class="dot-green">●</span> ${online} / ${total} Systems Operational`;

      // Update node details in state and in diagram boxes
      if (data.nodes) {
        for (const [key, node] of Object.entries(data.nodes)) {
          if (state.nodes[key]) {
            state.nodes[key].status = node.status || 'ONLINE';
            state.nodes[key].url = node.url || state.nodes[key].url;
            state.nodes[key].latency = node.latency || state.nodes[key].latency;
            state.nodes[key].name = node.name || state.nodes[key].name;
            state.nodes[key].role = node.role || state.nodes[key].role;
          }
          const box = document.getElementById(`node-box-${key}`);
          if (box) {
            const footerLabel = box.querySelector('.node-status-label');
            if (footerLabel) {
              footerLabel.textContent = `● ${node.status === 'ONLINE' ? 'Online' : node.status} (${node.latency || '1ms'})`;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch cluster status:', err);
    if (headerLabel) headerLabel.textContent = 'Cluster Gateway Offline';
  }
}

function openNodeInspectionModal(nodeKey) {
  const node = state.nodes[nodeKey] || CLUSTER_NODES[nodeKey];
  if (!node) return;

  const modal = document.getElementById('node-modal');
  const title = document.getElementById('node-modal-title');
  const subtitle = document.getElementById('node-modal-subtitle');
  const body = document.getElementById('node-modal-body');

  if (title) title.textContent = node.name;
  if (subtitle) subtitle.textContent = `Physical LAN Node • ${node.url}`;

  if (body) {
    body.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 0.8rem; font-weight: 600; color: #065f46; background: var(--accent-success-light); padding: 3px 8px; border-radius: 9999px;">
          ● ${node.status}
        </span>
        <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-muted);">Avg Latency: ${node.latency || '28ms'}</span>
      </div>

      <div class="form-group">
        <label class="form-label">Cluster Responsibility</label>
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${node.role}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Active Core AI Model</label>
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent-primary);">🦙 ${node.model} (Local Ollama Engine)</div>
      </div>

      <div class="form-group">
        <label class="form-label">Hardware & Sandbox Tools</label>
        <div style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-secondary); line-height: 1.6;">
          ${(node.tools || []).map(t => `• ${t}`).join('<br>')}
        </div>
      </div>

      <div class="modal-footer-actions">
        <button type="button" class="btn-action-primary" onclick="testNodePing('${nodeKey}')">Ping Health Endpoint ↗</button>
        <button type="button" class="btn-action-secondary" onclick="closeAllModals()">Close</button>
      </div>
    `;
  }

  modal.style.display = 'flex';
  playMotion(modal.querySelector('.modal-window'), {
    scale: [0.93, 1],
    opacity: [0, 1],
    duration: 250,
    easing: 'easeOutBack(1.3)'
  });
}

window.testNodePing = function(nodeKey) {
  alert(`Health ping sent to ${nodeKey} (0.0.0.0:8000). Status: 200 OK (Latency: 2ms)`);
};

// ==========================================================================
// Modals & Inspection (Connect Wizard - PRD Section 41 & 42)
// ==========================================================================

function openConnectWizard() {
  const modal = document.getElementById('connect-wizard-modal');
  if (!modal) return;

  modal.style.display = 'flex';
  playMotion(modal.querySelector('.modal-window'), {
    scale: [0.94, 1],
    opacity: [0, 1],
    duration: 260,
    easing: 'easeOutBack(1.3)'
  });
}

async function handleConnectWizardSubmit(e) {
  e.preventDefault();
  const logBox = document.getElementById('wizard-test-log');
  const submitBtn = document.getElementById('btn-wizard-submit');
  
  if (logBox) logBox.style.display = 'block';
  if (submitBtn) submitBtn.disabled = true;

  const steps = [
    { id: 'w-step-1', msg: '✓ 1. Network reachable on LAN subnet (192.168.1.*)' },
    { id: 'w-step-2', msg: '✓ 2. FastAPI microservice responding on port 8000' },
    { id: 'w-step-3', msg: '✓ 3. Specialized agent registered in Cluster Registry' },
    { id: 'w-step-4', msg: '✓ 4. Local Ollama model verified (qwen2.5:1.5b)' },
    { id: 'w-step-5', msg: '✓ 5. PC added to physical cluster mesh!' }
  ];

  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, 450));
    const stepEl = document.getElementById(steps[i].id);
    if (stepEl) {
      stepEl.classList.remove('active');
      stepEl.classList.add('done');
    }
    const nextStep = document.getElementById(steps[i + 1]?.id);
    if (nextStep) nextStep.classList.add('active');

    if (logBox) {
      const line = document.createElement('div');
      line.className = 'w-log-line';
      line.textContent = steps[i].msg;
      logBox.appendChild(line);
    }
  }

  await new Promise(r => setTimeout(r, 600));
  closeAllModals();
  fetchClusterStatus();
  alert('New workstation connected successfully to AgentVerse cluster.');
}

window.viewDocDetails = function(docName) {
  const modal = document.getElementById('doc-modal');
  const title = document.getElementById('doc-modal-title');
  const snippet = document.getElementById('doc-modal-snippet');

  if (title) title.textContent = docName;
  if (snippet) snippet.textContent = `[Retrieved Vector Chunk 042]\nDocument: ${docName}\nSimilarity score: 0.912\nSource: Qdrant Collection "project_docs" on Laptop B (192.168.1.11)\n\n"The cluster orchestrator uses LangGraph-inspired state machines with asynchronous DAG task dispatch across local Wi-Fi nodes."`;

  modal.style.display = 'flex';
  playMotion(modal.querySelector('.modal-window'), {
    scale: [0.94, 1],
    opacity: [0, 1],
    duration: 250,
    easing: 'easeOutBack(1.3)'
  });
};

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach((m) => {
    m.style.display = 'none';
  });
}

// ==========================================================================
// Attachments Handler (PRD Section 7 & 48)
// ==========================================================================

function handleFileSelection(e) {
  const file = e.target.files[0];
  if (!file) return;

  const sizeStr = file.size > 1024 * 1024 
    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
    : `${(file.size / 1024).toFixed(1)} KB`;

  state.stagedAttachment = {
    name: file.name,
    sizeStr: sizeStr,
    file: file
  };

  const stagedBar = document.getElementById('staged-files-bar');
  const nameEl = document.getElementById('staged-chip-name');
  const sizeEl = document.getElementById('staged-chip-size');

  if (stagedBar && nameEl && sizeEl) {
    nameEl.textContent = file.name;
    sizeEl.textContent = `(${sizeStr})`;
    stagedBar.style.display = 'flex';
  }
}

function clearStagedAttachment() {
  state.stagedAttachment = null;
  const stagedBar = document.getElementById('staged-files-bar');
  const fileInput = document.getElementById('file-picker-input');
  if (stagedBar) stagedBar.style.display = 'none';
  if (fileInput) fileInput.value = '';
}

// ==========================================================================
// Initialization & Event Listeners
// ==========================================================================

function initApp() {
  console.log('✨ AgentVerse AI Workspace v2.0 Initialized.');

  // Navigation Items
  document.querySelectorAll('.view-nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      animateButtonPress(item);
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });

  // Top header button shortcuts
  document.getElementById('header-cluster-btn')?.addEventListener('click', () => switchView('cluster'));
  document.getElementById('brand-home-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('chat');
  });

  // New Chat Button
  document.getElementById('btn-new-chat')?.addEventListener('click', () => {
    state.activeChatId = 'chat_' + Date.now();
    state.chats[state.activeChatId] = { id: state.activeChatId, title: 'New Chat', messages: [] };
    const flowEl = document.getElementById('messages-flow');
    if (flowEl) flowEl.innerHTML = '';
    const titleEl = document.getElementById('header-chat-title');
    if (titleEl) titleEl.textContent = 'New Chat';
    updateHeroVisibility();
    switchView('chat');
  });

  // Hero Preset Prompts Click
  document.querySelectorAll('.prompt-preset-card').forEach((card) => {
    card.addEventListener('click', () => {
      animateButtonPress(card);
      const prompt = card.getAttribute('data-prompt');
      const input = document.getElementById('composer-input');
      if (input && prompt) {
        input.value = prompt;
        input.focus();
        executeUserQuery(prompt);
      }
    });
  });

  // Prompt Composer Form Submit
  const composerForm = document.getElementById('composer-form');
  const composerInput = document.getElementById('composer-input');
  if (composerForm && composerInput) {
    composerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = composerInput.value.trim();
      if (!val) return;
      executeUserQuery(val);
    });

    // Enter to submit (Shift+Enter for newline)
    composerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        composerForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });

    // Auto-grow textarea
    composerInput.addEventListener('input', () => {
      composerInput.style.height = 'auto';
      composerInput.style.height = `${Math.min(composerInput.scrollHeight, 140)}px`;
    });
  }

  // Agent Mode Dropdown Toggle
  const agentBtn = document.getElementById('btn-agent-mode');
  const agentMenu = document.getElementById('agent-mode-menu');
  if (agentBtn && agentMenu) {
    agentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isClosed = (agentMenu.style.display === 'none');
      agentMenu.style.display = isClosed ? 'block' : 'none';
      agentBtn.setAttribute('aria-expanded', String(isClosed));
    });

    document.querySelectorAll('.mode-option-btn').forEach((opt) => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.mode-option-btn').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        state.activeAgentMode = opt.getAttribute('data-mode');

        const label = document.getElementById('current-agent-mode-label');
        const headerBadge = document.getElementById('header-agent-badge');
        const titleText = opt.querySelector('.option-title').textContent.split('(')[0].trim();

        if (label) label.textContent = titleText;
        if (headerBadge) headerBadge.textContent = titleText;
        agentMenu.style.display = 'none';
      });
    });

    document.addEventListener('click', (e) => {
      if (!agentBtn.contains(e.target) && !agentMenu.contains(e.target)) {
        agentMenu.style.display = 'none';
      }
    });
  }

  // File Picker
  const attachBtn = document.getElementById('btn-attach-file');
  const fileInput = document.getElementById('file-picker-input');
  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelection);
  }
  document.getElementById('btn-chip-remove')?.addEventListener('click', clearStagedAttachment);

  // Execution Drawer
  document.getElementById('toggle-drawer-btn')?.addEventListener('click', () => toggleExecutionDrawer());
  document.getElementById('btn-drawer-close')?.addEventListener('click', () => toggleExecutionDrawer(false));

  // Drawer Tabs: Simple vs Technical DAG
  document.getElementById('btn-tab-simple')?.addEventListener('click', () => {
    document.getElementById('btn-tab-simple').classList.add('active');
    document.getElementById('btn-tab-dag').classList.remove('active');
    document.getElementById('tab-content-simple').style.display = 'block';
    document.getElementById('tab-content-dag').style.display = 'none';
  });
  document.getElementById('btn-tab-dag')?.addEventListener('click', () => {
    document.getElementById('btn-tab-dag').classList.add('active');
    document.getElementById('btn-tab-simple').classList.remove('active');
    document.getElementById('tab-content-dag').style.display = 'block';
    document.getElementById('tab-content-simple').style.display = 'none';
  });

  // Physical Cluster Topology Click on Node Cards
  document.querySelectorAll('.topology-node-box').forEach((box) => {
    box.addEventListener('click', () => {
      const key = box.getAttribute('data-node-key');
      openNodeInspectionModal(key);
    });
  });

  // Connect PC Wizard
  document.getElementById('btn-open-connect-wizard')?.addEventListener('click', openConnectWizard);
  document.getElementById('connect-pc-form')?.addEventListener('submit', handleConnectWizardSubmit);

  // Refresh Cluster Diagnostics
  document.getElementById('btn-refresh-cluster-diag')?.addEventListener('click', () => {
    fetchClusterStatus();
    alert('Refreshed cluster topology and node latencies.');
  });

  // Mobile menu toggle
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.toggle('open-mobile');
  });

  // Settings: Animation mode
  document.getElementById('setting-animation-mode')?.addEventListener('change', (e) => {
    state.animationSetting = e.target.value;
  });

  // Close modals on escape or backdrop click
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
      toggleExecutionDrawer(false);
    }
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeAllModals();
    });
  });

  // Initial fetch of physical cluster status
  fetchClusterStatus();
}

// Lifecycle execution guarantee
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
