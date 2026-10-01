// Node Icons Map
const NODE_ICONS = {
  laptop_a: '🌐',
  laptop_b: '📚',
  laptop_c: '⚡',
  laptop_d: '🪐'
};

async function fetchClusterStatus() {
  const grid = document.getElementById('cluster-grid');
  const summaryText = document.getElementById('cluster-summary-text');
  
  try {
    const res = await fetch('/api/v1/cluster');
    const data = await res.json();
    
    grid.innerHTML = '';
    const onlineCount = data.online_nodes || 0;
    const totalCount = data.total_nodes || 4;

    if (summaryText) {
      summaryText.textContent = `${onlineCount}/${totalCount} Nodes Active`;
    }

    for (const [key, node] of Object.entries(data.nodes)) {
      const card = document.createElement('div');
      card.className = 'node-card';
      card.id = `card-${key}`;

      const isOnline = node.status === 'ONLINE';
      const icon = NODE_ICONS[key] || '🖥️';

      card.innerHTML = `
        <div class="card-top">
          <div class="card-title-group">
            <div class="node-icon-box">${icon}</div>
            <div>
              <div class="node-name">${node.name}</div>
              <div class="node-role-tag">${node.role}</div>
            </div>
          </div>
          <span class="status-badge ${isOnline ? 'online' : 'offline'}">
            <span class="live-dot" style="background: ${isOnline ? 'var(--accent-green)' : 'var(--accent-red)'}"></span>
            ${node.status}
          </span>
        </div>

        <div class="node-meta-grid">
          <div class="meta-row">
            <span class="label">Endpoint</span>
            <span class="value">${node.url}</span>
          </div>
          <div class="meta-row">
            <span class="label">Architecture</span>
            <span class="value">x86_64 LAN</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="model-pill">🦙 ${node.model}</span>
          <span class="inspect-hint">Inspect ↗</span>
        </div>
      `;

      card.addEventListener('click', () => openNodeModal(key, node, icon));
      grid.appendChild(card);
    }
  } catch (err) {
    console.error('Failed to load cluster:', err);
    if (summaryText) summaryText.textContent = 'Cluster Offline';
  }
}

async function loadMyIP() {
  const text = document.getElementById('my-ip-text');
  try {
    const res = await fetch('/health');
    const data = await res.json();
    if (text) text.textContent = `Host: ${data.node_id} (0.0.0.0:${data.port})`;
  } catch (e) {
    if (text) text.textContent = 'Gateway Offline';
  }
}

// Preset Prompts Click Handler
document.querySelectorAll('.preset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const query = btn.getAttribute('data-query');
    const textarea = document.getElementById('query-input');
    if (textarea && query) {
      textarea.value = query;
      textarea.focus();
    }
  });
});

document.getElementById('refresh-cluster-btn').addEventListener('click', () => {
  const btn = document.getElementById('refresh-cluster-btn');
  btn.style.opacity = '0.5';
  fetchClusterStatus().finally(() => {
    setTimeout(() => { btn.style.opacity = '1'; }, 300);
  });
});

document.getElementById('query-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('query-input');
  const resultsSec = document.getElementById('results-section');
  const dispatchMap = document.getElementById('dispatch-map');
  const responseCard = document.getElementById('response-card');
  const submitBtn = document.getElementById('submit-btn');
  const canvasTitle = document.getElementById('canvas-status-title');
  const canvasSub = document.getElementById('canvas-status-subtitle');
  const metaBadge = document.getElementById('execution-meta-badge');

  const query = input.value.trim();
  if (!query) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-text">Orchestrating...</span> <span class="btn-icon">⏳</span>';
  resultsSec.style.display = 'flex';
  dispatchMap.innerHTML = '<div style="padding: 12px; color: #94a3b8; font-size: 0.85rem;">Decomposing task and dispatching across LAN cluster...</div>';
  responseCard.innerHTML = '';
  
  if (canvasTitle) canvasTitle.textContent = 'Cluster Pipeline Running';
  if (canvasSub) canvasSub.textContent = 'Query is being dispatched to cluster nodes...';

  try {
    const res = await fetch('/api/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    if (canvasTitle) canvasTitle.textContent = 'Cluster Execution Complete';
    if (canvasSub) canvasSub.textContent = `Completed across ${data.dispatched_nodes.length} cluster nodes`;
    if (metaBadge) metaBadge.textContent = `Session: ${data.session_id.substring(0, 8)}...`;

    dispatchMap.innerHTML = '';

    // Render task decomposition mapped to PCs
    data.cluster_plan.forEach((task) => {
      const item = document.createElement('div');
      item.className = 'task-item';
      const agentName = (task.agent || task.target_agent || 'AGENT').toUpperCase();
      const nodeUrl = task.node_url || 'Cluster Node Endpoint';
      
      item.innerHTML = `
        <div>
          <div class="task-desc"><strong>${agentName} TASK:</strong> ${task.instruction}</div>
          <div class="task-url">Endpoint: ${nodeUrl}</div>
        </div>
        <span class="assigned-badge">📍 ${task.assigned_pc || 'Cluster Node'}</span>
      `;
      dispatchMap.appendChild(item);
    });

    // Render node execution results
    let nodeOutputsHtml = '';
    if (data.cluster_results) {
      for (const [nodeName, nodeData] of Object.entries(data.cluster_results)) {
        nodeOutputsHtml += `
          <div style="margin-top: 10px; padding: 14px; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #00f2fe; font-size: 0.85rem;">📍 ${nodeData.pc || nodeName}</strong>
              <span style="font-size: 0.72rem; color: #00e676; font-family: monospace;">STATUS: SUCCESS</span>
            </div>
            <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.4;">${nodeData.brief || nodeData.sandbox_output || (nodeData.chunks ? nodeData.chunks[0] : '') || nodeData.execution_result || ''}</p>
            ${nodeData.code ? `<pre style="background: #080c14; padding: 10px; border-radius: 6px; font-size: 0.8rem; color: #a5b4fc; margin-top: 8px; overflow-x: auto; border: 1px solid rgba(255, 255, 255, 0.05); font-family: 'JetBrains Mono', monospace;"><code>${nodeData.code}</code></pre>` : ''}
          </div>
        `;
      }
    }

    responseCard.innerHTML = `
      <div style="padding: 20px; background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
        
        <!-- LLM Strategic Analysis -->
        <div style="padding: 14px; background: rgba(79, 172, 254, 0.08); border-left: 4px solid #4facfe; border-radius: 8px;">
          <strong style="color: #4facfe; font-size: 0.85rem; display: block; margin-bottom: 4px;">🦙 Local Ollama (qwen2.5:1.5b) Strategic Analysis:</strong>
          <p style="font-size: 0.9rem; color: #f0f4f8; line-height: 1.5;">${data.llm_analysis}</p>
        </div>

        <!-- Node Execution Results -->
        <div>
          <h5 style="color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Individual Node Execution Outputs:</h5>
          ${nodeOutputsHtml}
        </div>

        <!-- Final Synthesized Response -->
        <div style="padding: 16px; background: rgba(0, 230, 118, 0.08); border: 1px solid rgba(0, 230, 118, 0.25); border-radius: 10px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 1.1rem;">🎯</span>
            <strong style="color: #00e676; font-size: 0.95rem;">Final Synthesized Cluster Output:</strong>
          </div>
          <p style="font-size: 0.92rem; color: #f8fafc; line-height: 1.6; white-space: pre-wrap;">${data.final_synthesized_answer || 'Response successfully synthesized from all cluster nodes.'}</p>
        </div>
      </div>
    `;
  } catch (err) {
    alert('Query failed to dispatch: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-text">Execute on Cluster</span> <span class="btn-icon">🚀</span>';
  }
});

// Modal Functions
function openNodeModal(nodeKey, node, icon) {
  const modal = document.getElementById('node-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const modalIcon = document.getElementById('modal-icon');

  if (modalIcon) modalIcon.textContent = icon || '🖥️';
  title.textContent = node.name;
  
  const isOnline = node.status === 'ONLINE';

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span class="status-badge ${isOnline ? 'online' : 'offline'}">
        <span class="live-dot" style="background: ${isOnline ? 'var(--accent-green)' : 'var(--accent-red)'}"></span>
        ${node.status}
      </span>
      <span style="font-family: var(--font-mono); font-size: 0.76rem; color: #94a3b8;">NODE ID: ${nodeKey}</span>
    </div>

    <div class="modal-detail-card">
      <div class="detail-label">Domain Responsibility & Lead</div>
      <div class="detail-value">${node.role.toUpperCase()}</div>
    </div>

    <div class="modal-detail-card">
      <div class="detail-label">Active AI Model / Core</div>
      <div class="detail-value">🦙 ${node.model} (Ollama Base)</div>
    </div>

    <div class="modal-detail-card">
      <div class="detail-label">Network Location</div>
      <div class="detail-value" style="font-family: var(--font-mono);">${node.url}</div>
    </div>

    <div class="modal-detail-card">
      <div class="detail-label">Available Microservice Endpoints</div>
      <div style="font-family: var(--font-mono); font-size: 0.78rem; color: #94a3b8; margin-top: 4px; line-height: 1.6;">
        ${getAvailableEndpoints(nodeKey, node.url)}
      </div>
    </div>

    <div class="modal-actions">
      <a href="${getNodeHealthUrl(nodeKey, node.url)}" target="_blank" class="btn-modal-action btn-primary-action">Open /health Check ↗</a>
      <button class="btn-modal-action btn-secondary-action" onclick="closeNodeModal()">Close</button>
    </div>
  `;

  modal.style.display = 'flex';
}

function getNodeHealthUrl(key, url) {
  if (key === 'laptop_d') return '/health';
  if (key === 'laptop_a') return '/node_a/health';
  if (key === 'laptop_b') return '/node_b/health';
  if (key === 'laptop_c') return '/node_c/health';
  return `${url}/health`;
}

function getAvailableEndpoints(key, url) {
  if (key === 'laptop_a') return `<code>GET /node_a/health</code><br><code>POST /node_a/research/execute</code>`;
  if (key === 'laptop_b') return `<code>GET /node_b/health</code><br><code>POST /node_b/document/rag</code>`;
  if (key === 'laptop_c') return `<code>GET /node_c/health</code><br><code>POST /node_c/data/analyze</code>`;
  return `<code>GET /health</code><br><code>GET /api/v1/cluster</code><br><code>POST /api/v1/query</code>`;
}

function closeNodeModal() {
  const modal = document.getElementById('node-modal');
  modal.style.display = 'none';
}

document.getElementById('modal-close').addEventListener('click', closeNodeModal);
document.getElementById('node-modal').addEventListener('click', (e) => {
  if (e.target.id === 'node-modal') closeNodeModal();
});

// Initial boot
fetchClusterStatus();
loadMyIP();
