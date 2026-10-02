document.addEventListener('DOMContentLoaded', () => {
    // Initial animations
    anime({
        targets: ['.sidebar', '.workspace'],
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 800,
        easing: 'easeOutExpo',
        delay: anime.stagger(200)
    });

    const sendBtn = document.getElementById('send-btn');
    const promptInput = document.getElementById('prompt-input');
    const messagesView = document.getElementById('messages-view');
    const heroState = document.getElementById('hero-state');
    const navCluster = document.getElementById('nav-cluster');
    const headerClusterStatus = document.getElementById('header-cluster-status');
    const clusterModal = document.getElementById('cluster-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Agent selection
    const agentModeBtn = document.getElementById('agent-mode-btn');
    const agentModal = document.getElementById('agent-modal');
    const agentOptions = document.querySelectorAll('.agent-option');
    let currentMode = "Auto";

    // Modals
    agentModeBtn.addEventListener('click', () => {
        agentModal.style.display = 'flex';
        anime({
            targets: agentModal.querySelector('.modal'),
            opacity: [0, 1],
            scale: [0.95, 1],
            duration: 300,
            easing: 'easeOutExpo'
        });
    });

    agentModal.addEventListener('click', (e) => {
        if (e.target === agentModal) agentModal.style.display = 'none';
    });

    agentOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            agentOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            currentMode = opt.dataset.agent;
            
            agentModeBtn.innerHTML = `
                <div class="status-dot ${currentMode === 'Auto' ? 'auto' : 'idle'}"></div>
                AgentVerse ${currentMode}
            `;
            
            setTimeout(() => { agentModal.style.display = 'none'; }, 200);
        });
    });

    // Cluster Modal
    const openClusterModal = () => {
        clusterModal.style.display = 'flex';
        anime({
            targets: clusterModal.querySelector('.modal'),
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 300,
            easing: 'easeOutExpo'
        });
        loadClusterTopology();
    };

    navCluster.addEventListener('click', openClusterModal);
    headerClusterStatus.addEventListener('click', openClusterModal);

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').style.display = 'none';
        });
    });
    
    clusterModal.addEventListener('click', (e) => {
        if (e.target === clusterModal) clusterModal.style.display = 'none';
    });

    // API calls
    async function loadClusterTopology() {
        const topology = document.getElementById('cluster-topology');
        topology.innerHTML = '<p>Loading cluster status...</p>';
        try {
            const res = await fetch('/api/cluster/status');
            const data = await res.json();
            
            document.getElementById('cluster-count').innerText = `${data.connected_count} PCs connected`;
            
            topology.innerHTML = '';
            data.nodes.forEach((node, i) => {
                const el = document.createElement('div');
                el.className = 'node-card';
                el.innerHTML = `
                    <div class="role">${node.agents.join(', ') || 'Gateway'} Node</div>
                    <div class="status"><div class="status-dot online pulse-anim"></div> ${node.url}</div>
                `;
                topology.appendChild(el);
                
                anime({
                    targets: el,
                    opacity: [0, 1],
                    translateY: [10, 0],
                    duration: 400,
                    delay: i * 100,
                    easing: 'easeOutQuad'
                });
            });
        } catch(e) {
            topology.innerHTML = '<p>Offline mode</p>';
        }
    }

    // Load initial cluster status
    loadClusterTopology();

    // Chat functionality
    sendBtn.addEventListener('click', sendMessage);
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    async function sendMessage() {
        const text = promptInput.value.trim();
        if (!text) return;
        
        promptInput.value = '';
        
        if (heroState.style.display !== 'none') {
            anime({
                targets: heroState,
                opacity: 0,
                duration: 300,
                easing: 'linear',
                complete: () => {
                    heroState.style.display = 'none';
                    messagesView.style.display = 'flex';
                }
            });
        }
        
        addMessage(text, 'user');
        
        // Add loading state
        const loadingId = 'msg-' + Date.now();
        addMessage('...', 'assistant', loadingId);
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text, mode: currentMode })
            });
            const data = await res.json();
            
            updateMessage(loadingId, data);
        } catch(e) {
            updateMessage(loadingId, { answer: "Failed to reach AgentVerse backend." });
        }
    }

    function addMessage(text, role, id = null) {
        messagesView.style.display = 'flex';
        const msg = document.createElement('div');
        msg.className = `message ${role}`;
        if (id) msg.id = id;
        
        const content = document.createElement('div');
        content.className = 'msg-content';
        // Simple Markdown bold / code block formatting
        let formatted = text.replace(/```python([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        formatted = formatted.replace(/\n/g, '<br>');
        
        content.innerHTML = formatted;
        msg.appendChild(content);
        messagesView.appendChild(msg);
        
        anime({
            targets: msg,
            opacity: [0, 1],
            translateY: [8, 0],
            duration: 400,
            easing: 'easeOutExpo'
        });
        
        messagesView.scrollTop = messagesView.scrollHeight;
    }

    function updateMessage(id, data) {
        const msg = document.getElementById(id);
        if (!msg) return;
        
        const content = msg.querySelector('.msg-content');
        let formatted = data.answer.replace(/```(python|json)([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        formatted = formatted.replace(/\n/g, '<br>');
        content.innerHTML = formatted;
        
        if (data.execution_path && data.execution_path.length > 0) {
            const howItWorked = document.createElement('div');
            howItWorked.className = 'how-it-worked';
            
            const header = document.createElement('div');
            header.className = 'how-it-worked-header';
            header.innerHTML = `✦ How AgentVerse worked <span style="margin-left:auto;">›</span>`;
            
            const details = document.createElement('div');
            details.className = 'how-it-worked-content';
            
            data.execution_path.forEach(step => {
                details.innerHTML += `<div>✓ ${step.agent}</div>`;
            });
            
            header.addEventListener('click', () => {
                const isOpen = details.style.display === 'block';
                if(isOpen) {
                    details.style.display = 'none';
                    header.querySelector('span').style.transform = 'rotate(0deg)';
                } else {
                    details.style.display = 'block';
                    header.querySelector('span').style.transform = 'rotate(90deg)';
                    anime({
                        targets: details,
                        opacity: [0, 1],
                        translateY: [-5, 0],
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                }
            });
            
            howItWorked.appendChild(header);
            howItWorked.appendChild(details);
            msg.appendChild(howItWorked);
        }
        
        messagesView.scrollTop = messagesView.scrollHeight;
    }
});
