/**
 * Quiz Host Logic (ใช่ หรือ มั่ว? พร้อมเครื่องตอบสแกน QR)
 * - 50 ข้อคำถามกวนๆ พร้อมเฉลย
 * - ตั้งเวลา 10, 15, 20, 30, 60 วินาที
 * - นับถอยหลังละเอียดระดับเศษวินาที (.00)
 * - ระบบรับสัญญาณคำตอบหลายช่องทางพร้อมกัน (Multi-Channel Redundancy):
 *   1) ntfy WebSocket (wss://ntfy.sh) - ไม่ติดบัฟเฟอร์ ส่งได้ทันที
 *   2) ntfy EventSource (SSE)
 *   3) Fast Polling Fail-Safe (ดึง REST API ทุก 150ms ระหว่างเวลากำลังเดิน ป้องกันการบล็อคสตรีมทุกรูปแบบ)
 *   4) MQTT over WebSocket (broker.emqx.io)
 *   5) BroadcastChannel & LocalStorage Event (สำหรับเปิดเทสบนเครื่องเดียวกัน)
 * - หยุดเวลาทันทีเมื่อได้รับคำตอบ (.00 ค้างไว้)
 * - แสดงชัดเจนในหน้าคนถามว่าเครื่องตอบกด "ใช่ ⭕" หรือ "มั่ว ❌"
 * - พร้อมเฉลยและคำอธิบายใต้โจทย์
 * - ป้องกันรหัสห้องหลุด: รหัสเริ่มต้นเป็น "1234" และเชื่อมต่อทั้งรหัสห้องปัจจุบันและ DEFAULT สำรอง
 */
(function() {
    let roomId = localStorage.getItem('prg_quiz_room_id') || '1234';
    roomId = roomId.toUpperCase().replace(/[^A-Z0-9]/g, '') || '1234';
    localStorage.setItem('prg_quiz_room_id', roomId);

    // Game State
    let currentQIndex = 0;
    let currentQuestion = null;
    let durationSeconds = 15;
    let remainingMs = 15000;
    let timerInterval = null;
    let pollTimer = null;
    let lastTickTime = 0;
    let status = 'IDLE'; // 'IDLE', 'RUNNING', 'PAUSED_ANSWERED', 'PAUSED_MANUAL', 'TIME_UP'
    let lastPlayerAnswer = null; // 'YES', 'NO', null
    let currentRoundStartTime = 0;
    let isInitialized = false;

    // Audio SFX Synthesis
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playTickSound(isUrgent = false) {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = isUrgent ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(isUrgent ? 880 : 520, ctx.currentTime);
            gain.gain.setValueAtTime(isUrgent ? 0.35 : 0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isUrgent ? 0.08 : 0.05));
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + (isUrgent ? 0.08 : 0.05));
        } catch(e) {}
    }

    function playBuzzerSound() {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch(e) {}
    }

    function playCorrectSound() {
        try {
            const ctx = getAudioCtx();
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = ctx.currentTime + idx * 0.08;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.3, start);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.2);
            });
        } catch(e) {}
    }

    function playAlarmSound() {
        try {
            const ctx = getAudioCtx();
            for (let i = 0; i < 3; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = ctx.currentTime + i * 0.14;
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, start);
                gain.gain.setValueAtTime(0.35, start);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.12);
            }
        } catch(e) {}
    }

    // Communication Setup
    let ntfyWs = null;
    let sseSource = null;
    let mqttClient = null;
    let bc = null;

    function initConnections() {
        const ntfyClientTopic = 'prg_quiz_' + roomId + '_client';
        const LS_KEY = 'prg_quiz_action_' + roomId;

        // 1. WebSocket to ntfy.sh (Fastest, zero-buffer)
        try {
            if (ntfyWs) ntfyWs.close();
            ntfyWs = new WebSocket('wss://ntfy.sh/' + ntfyClientTopic + '/ws');
            ntfyWs.onopen = () => {
                updateConnectedCount(true);
            };
            ntfyWs.onmessage = (event) => {
                try {
                    const ntfyMsg = JSON.parse(event.data);
                    if (ntfyMsg.id && !handledMessageIds.has(ntfyMsg.id)) {
                        handledMessageIds.add(ntfyMsg.id);
                        if (ntfyMsg.event === 'message' && ntfyMsg.message) {
                            const payload = JSON.parse(ntfyMsg.message);
                            handleClientMessage(payload);
                        }
                    }
                } catch(e) {}
            };
            ntfyWs.onclose = () => {
                setTimeout(() => { if (roomId) initConnections(); }, 3000);
            };
        } catch(e) {}

        // 2. EventSource (SSE)
        try {
            if (sseSource) sseSource.close();
            sseSource = new EventSource('https://ntfy.sh/' + ntfyClientTopic + '/sse');
            sseSource.onopen = () => {
                updateConnectedCount(true);
            };
            sseSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.id && !handledMessageIds.has(data.id)) {
                        handledMessageIds.add(data.id);
                        if (data.event === 'message' && data.message) {
                            const payload = JSON.parse(data.message);
                            handleClientMessage(payload);
                        }
                    }
                } catch(e) {}
            };
        } catch(e) {}

        // 3. MQTT
        try {
            if (typeof Paho !== 'undefined') {
                const cid = 'hst_' + Math.random().toString(36).substring(2, 8);
                mqttClient = new Paho.MQTT.Client('broker.emqx.io', 8084, cid);
                mqttClient.onMessageArrived = (m) => {
                    try { handleClientMessage(JSON.parse(m.payloadString)); } catch(e) {}
                };
                mqttClient.connect({
                    useSSL: true,
                    timeout: 4,
                    onSuccess: () => {
                        mqttClient.subscribe('prg/quiz/' + roomId + '/client');
                        if (roomId !== 'DEFAULT') {
                            mqttClient.subscribe('prg/quiz/DEFAULT/client');
                        }
                        updateConnectedCount(true);
                    }
                });
            }
        } catch(e) {}

        // 4. BroadcastChannel
        try {
            if ('BroadcastChannel' in window) {
                if (bc) bc.close();
                bc = new BroadcastChannel('prg_quiz_' + roomId);
                bc.onmessage = (e) => handleClientMessage(e.data);
            }
        } catch(e) {}

        // 5. LocalStorage Storage Listener
        window.addEventListener('storage', (e) => {
            if ((e.key === LS_KEY || e.key === 'prg_quiz_action_DEFAULT') && e.newValue) {
                try {
                    handleClientMessage(JSON.parse(e.newValue));
                } catch(err) {}
            }
        });
    }

    const handledMessageIds = new Set();

    // Pre-seed old message IDs so past session messages are ignored
    async function seedOldMessageIds() {
        try {
            const clientTopic = 'prg_quiz_' + roomId + '_client';
            const res = await fetch(`https://ntfy.sh/${clientTopic}/json?poll=1&since=all`, { cache: 'no-store' });
            if (res.ok) {
                const text = await res.text();
                const lines = text.trim().split('\n');
                lines.forEach(l => {
                    try {
                        const item = JSON.parse(l);
                        if (item.id) handledMessageIds.add(item.id);
                    } catch(e) {}
                });
            }
        } catch(e) {}
    }
    seedOldMessageIds();

    initConnections();

    // 6. Fast Polling Fail-Safe (Fires every 150ms during RUNNING countdown)
    function startFastPolling() {
        if (pollTimer) clearInterval(pollTimer);
        const clientTopic = 'prg_quiz_' + roomId + '_client';

        pollTimer = setInterval(async () => {
            if (status !== 'RUNNING') {
                clearInterval(pollTimer);
                return;
            }

            // Poll Primary Topic
            try {
                const res = await fetch(`https://ntfy.sh/${clientTopic}/json?poll=1&since=all`, { cache: 'no-store' });
                if (res.ok) {
                    const text = await res.text();
                    processPollText(text);
                }
            } catch(e) {}

            // Poll Backup DEFAULT Topic
            if (roomId !== 'DEFAULT' && status === 'RUNNING') {
                try {
                    const resDef = await fetch(`https://ntfy.sh/prg_quiz_DEFAULT_client/json?poll=1&since=all`, { cache: 'no-store' });
                    if (resDef.ok) {
                        const textDef = await resDef.text();
                        processPollText(textDef);
                    }
                } catch(e) {}
            }
        }, 150);
    }

    function processPollText(text) {
        if (!text || status !== 'RUNNING') return;
        const lines = text.trim().split('\n');
        for (let i = 0; i < lines.length; i++) {
            try {
                const item = JSON.parse(lines[i]);
                if (item.id && !handledMessageIds.has(item.id)) {
                    handledMessageIds.add(item.id);
                    if (item.event === 'message' && item.message) {
                        const payload = JSON.parse(item.message);
                        handleClientMessage(payload);
                    }
                }
            } catch(e) {}
        }
    }

    function broadcastState() {
        const ntfyHostTopic = 'prg_quiz_' + roomId + '_host';
        const payload = {
            type: 'STATE_UPDATE',
            status: status,
            questionText: currentQuestion ? currentQuestion.question : '',
            qIndex: currentQIndex,
            remainingMs: remainingMs,
            durationSeconds: durationSeconds,
            lastAnswer: lastPlayerAnswer
        };
        const str = JSON.stringify(payload);

        // A. Send via ntfy POST
        try {
            fetch('https://ntfy.sh/' + ntfyHostTopic, {
                method: 'POST',
                body: str,
                headers: { 'Content-Type': 'application/json' }
            }).catch(() => {});
        } catch(e) {}

        // B. Send via MQTT
        if (mqttClient && mqttClient.isConnected()) {
            try {
                const m = new Paho.MQTT.Message(str);
                m.destinationName = 'prg/quiz/' + roomId + '/host';
                mqttClient.send(m);
            } catch(e) {}
        }

        // C. Send via BroadcastChannel
        if (bc) {
            try { bc.postMessage(payload); } catch(e) {}
        }

        // D. LocalStorage
        try {
            localStorage.setItem('prg_quiz_host_state_' + roomId, str);
        } catch(e) {}
    }

    function handleClientMessage(data) {
        if (!data || !data.type) return;

        if (data.type === 'JOIN' || data.type === 'REQUEST_STATE') {
            updateConnectedCount(true);
            broadcastState();
        } else if (data.type === 'ANSWER_SUBMITTED') {
            // STOP TIMER IMMEDIATELY! Regardless of current state
            pauseOnAnswer(data.answer);
        }
    }

    function updateConnectedCount(hasConnection = false) {
        const countEl = document.getElementById('quiz-conn-count');
        const dotEl = document.querySelector('.quiz-dot');
        const roomDisplay = document.getElementById('quiz-room-display');

        if (roomDisplay) roomDisplay.textContent = roomId;

        if (countEl) {
            if (hasConnection || (mqttClient && mqttClient.isConnected()) || (ntfyWs && ntfyWs.readyState === WebSocket.OPEN)) {
                countEl.textContent = `พร้อมตอบ 📱 (ห้อง: ${roomId})`;
                if (dotEl) dotEl.classList.add('active');
            } else {
                countEl.textContent = `รอเครื่องตอบ... (ห้อง: ${roomId})`;
                if (dotEl) dotEl.classList.remove('active');
            }
        }
    }

    // --- DOM Elements & Host Controller ---
    window.initQuizHost = function() {
        const timeSelect = document.getElementById('quiz-time-select');
        const btnToggleQr = document.getElementById('quiz-btn-toggle-qr');
        const btnOpenBuzzer = document.getElementById('quiz-btn-open-buzzer');
        const qrDrawer = document.getElementById('quiz-qr-drawer');
        const qrCodeBox = document.getElementById('quiz-qrcode-box');
        const qrLinkText = document.getElementById('quiz-link-text');
        const customUrlInput = document.getElementById('quiz-custom-url');
        const hostRoomBadge = document.getElementById('quiz-host-room-badge');

        const timerDisplay = document.getElementById('quiz-timer-display');
        const timerBar = document.getElementById('quiz-timer-bar');
        const qNumEl = document.getElementById('quiz-q-num');
        const statusPill = document.getElementById('quiz-status-pill');
        const qTextEl = document.getElementById('quiz-question-text');
        const qCard = document.getElementById('quiz-question-card');

        const masterHintAns = document.getElementById('quiz-master-hint-ans');
        const masterHintExp = document.getElementById('quiz-master-hint-exp');

        const revealBox = document.getElementById('quiz-reveal-box');
        const playerAnsBadge = document.getElementById('quiz-player-ans-badge');
        const correctAnsBadge = document.getElementById('quiz-correct-ans-badge');
        const explanationText = document.getElementById('quiz-explanation-text');

        const btnRandomQ = document.getElementById('quiz-btn-random-q');
        const btnStartTimer = document.getElementById('quiz-btn-start-timer');
        const btnPauseTimer = document.getElementById('quiz-btn-pause-timer');

        function buildBuzzerUrl(targetBase) {
            let base = targetBase || window.location.href.split('?')[0].replace(/[^/]*$/, '');
            if (base.startsWith('file:///')) {
                base = 'http://localhost:8000/';
            }
            if (!base.endsWith('/')) {
                const parts = base.split('/');
                if (parts[parts.length - 1].includes('.')) {
                    parts.pop();
                    base = parts.join('/') + '/';
                }
            }
            return base + 'buzzer.html?room=' + roomId;
        }

        let currentBuzzerUrl = buildBuzzerUrl();
        if (qrLinkText) qrLinkText.textContent = currentBuzzerUrl;
        if (customUrlInput && !customUrlInput.value) {
            customUrlInput.value = currentBuzzerUrl;
        }

        function getEffectiveBuzzerUrl(rawVal) {
            let val = (rawVal && rawVal.trim()) ? rawVal.trim() : currentBuzzerUrl;
            // Ensure room parameter exists
            if (!val.includes('room=')) {
                const sep = val.includes('?') ? '&' : '?';
                val = val + sep + 'room=' + roomId;
            }
            return val;
        }

        function renderQrCode(urlToEncode) {
            if (!qrCodeBox || typeof QRCode === 'undefined') return;
            qrCodeBox.innerHTML = '';
            new QRCode(qrCodeBox, {
                text: urlToEncode,
                width: 180,
                height: 180,
                colorDark: '#0f172a',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            if (qrLinkText) qrLinkText.textContent = urlToEncode;
        }

        // Quick Room Code edit on Host
        if (hostRoomBadge && !hostRoomBadge.dataset.bound) {
            hostRoomBadge.dataset.bound = 'true';
            hostRoomBadge.addEventListener('click', () => {
                const newCode = prompt('ใส่รหัสห้องที่ต้องการ (เช่น 1234 หรือ 999):', roomId);
                if (newCode && newCode.trim()) {
                    const sanitized = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (sanitized) {
                        roomId = sanitized;
                        localStorage.setItem('prg_quiz_room_id', roomId);
                        currentBuzzerUrl = buildBuzzerUrl();
                        if (customUrlInput) customUrlInput.value = currentBuzzerUrl;
                        initConnections();
                        updateConnectedCount();
                        renderQrCode(currentBuzzerUrl);
                    }
                }
            });
        }

        if (btnToggleQr && !btnToggleQr.dataset.bound) {
            btnToggleQr.dataset.bound = 'true';
            btnToggleQr.addEventListener('click', () => {
                if (!qrDrawer) return;
                const isHidden = qrDrawer.style.display === 'none';
                qrDrawer.style.display = isHidden ? 'block' : 'none';
                if (isHidden) {
                    const targetUrl = getEffectiveBuzzerUrl(customUrlInput ? customUrlInput.value : '');
                    renderQrCode(targetUrl);
                }
            });
        }

        if (customUrlInput && !customUrlInput.dataset.bound) {
            customUrlInput.dataset.bound = 'true';
            customUrlInput.addEventListener('input', () => {
                const targetUrl = getEffectiveBuzzerUrl(customUrlInput.value);
                renderQrCode(targetUrl);
            });
        }

        if (btnOpenBuzzer && !btnOpenBuzzer.dataset.bound) {
            btnOpenBuzzer.dataset.bound = 'true';
            btnOpenBuzzer.addEventListener('click', () => {
                const targetUrl = getEffectiveBuzzerUrl(customUrlInput ? customUrlInput.value : '');
                window.open(targetUrl, '_blank');
            });
        }

        if (timeSelect && !timeSelect.dataset.bound) {
            timeSelect.dataset.bound = 'true';
            durationSeconds = parseInt(timeSelect.value, 10) || 15;
            remainingMs = durationSeconds * 1000;
            timeSelect.addEventListener('change', () => {
                durationSeconds = parseInt(timeSelect.value, 10) || 15;
                if (status !== 'RUNNING') {
                    remainingMs = durationSeconds * 1000;
                    renderTimer();
                    broadcastState();
                }
            });
        }

        function renderTimer() {
            const totalSec = Math.max(0, remainingMs / 1000);
            if (timerDisplay) {
                timerDisplay.textContent = totalSec.toFixed(2);
                if (totalSec <= 4.0 && status === 'RUNNING') {
                    timerDisplay.classList.add('warning');
                } else {
                    timerDisplay.classList.remove('warning');
                }
            }
            if (timerBar) {
                const totalMs = durationSeconds * 1000;
                const pct = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));
                timerBar.style.width = pct + '%';
            }
        }

        function clearAnswerFlash() {
            if (qCard) {
                qCard.classList.remove('flash-yes', 'flash-no');
            }
        }

        function loadQuestion(idx, autoResetTimer = true) {
            if (typeof TRICKY_QUESTIONS === 'undefined' || TRICKY_QUESTIONS.length === 0) return;
            currentQIndex = (idx + TRICKY_QUESTIONS.length) % TRICKY_QUESTIONS.length;
            currentQuestion = TRICKY_QUESTIONS[currentQIndex];

            if (qNumEl) qNumEl.textContent = `ข้อที่ ${currentQIndex + 1} / ${TRICKY_QUESTIONS.length}`;
            if (qTextEl) qTextEl.textContent = currentQuestion.question;

            if (masterHintAns) {
                const isYes = currentQuestion.answer === true;
                masterHintAns.className = 'quiz-master-hint-badge ' + (isYes ? 'yes' : 'no');
                masterHintAns.textContent = isYes ? 'ใช่ (⭕)' : 'มั่ว (❌)';
            }
            if (masterHintExp) {
                masterHintExp.textContent = `— ${currentQuestion.explanation}`;
            }

            clearAnswerFlash();
            if (revealBox) revealBox.style.display = 'none';
            lastPlayerAnswer = null;

            if (autoResetTimer) {
                remainingMs = durationSeconds * 1000;
                renderTimer();
            }

            setStatus('IDLE');
        }

        function setStatus(newStatus) {
            status = newStatus;
            if (!statusPill) return;

            statusPill.className = 'quiz-status-pill';
            if (status === 'IDLE') {
                statusPill.classList.add('ready');
                statusPill.textContent = 'พร้อมเริ่ม';
                if (btnStartTimer) {
                    btnStartTimer.textContent = '▶️ เริ่มจับเวลา!';
                    btnStartTimer.style.display = 'inline-flex';
                }
                if (btnPauseTimer) btnPauseTimer.style.display = 'none';
            } else if (status === 'RUNNING') {
                statusPill.classList.add('running');
                statusPill.textContent = '⏳ กำลังจับเวลา...';
                if (btnStartTimer) btnStartTimer.style.display = 'none';
                if (btnPauseTimer) btnPauseTimer.style.display = 'inline-flex';
                clearAnswerFlash();
            } else if (status === 'PAUSED_ANSWERED') {
                statusPill.classList.add('answered');
                const sec = (Math.max(0, remainingMs) / 1000).toFixed(2);
                statusPill.textContent = `🛑 เครื่องตอบแล้ว! หยุดที่ ${sec} วิ`;
                if (btnStartTimer) {
                    btnStartTimer.textContent = '▶️ เล่นต่อ (นับเวลาต่อ)';
                    btnStartTimer.style.display = 'inline-flex';
                }
                if (btnPauseTimer) btnPauseTimer.style.display = 'none';
            } else if (status === 'PAUSED_MANUAL') {
                statusPill.classList.add('answered');
                statusPill.textContent = '⏸️ หยุดเวลาชั่วคราว';
                if (btnStartTimer) {
                    btnStartTimer.textContent = '▶️ จับเวลาต่อ';
                    btnStartTimer.style.display = 'inline-flex';
                }
                if (btnPauseTimer) btnPauseTimer.style.display = 'none';
            } else if (status === 'TIME_UP') {
                statusPill.classList.add('timeout');
                statusPill.textContent = '⏰ หมดเวลา!';
                if (btnStartTimer) btnStartTimer.style.display = 'none';
                if (btnPauseTimer) btnPauseTimer.style.display = 'none';
            }
            broadcastState();
        }

        function startTimer() {
            if (status === 'RUNNING') return;
            if (remainingMs <= 0) {
                remainingMs = durationSeconds * 1000;
            }

            currentRoundStartTime = Date.now() - 300;
            setStatus('RUNNING');
            lastTickTime = performance.now();
            let lastSecTicked = Math.ceil(remainingMs / 1000);

            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                const now = performance.now();
                const delta = now - lastTickTime;
                lastTickTime = now;

                remainingMs -= delta;
                if (remainingMs <= 0) {
                    remainingMs = 0;
                    renderTimer();
                    clearInterval(timerInterval);
                    if (pollTimer) clearInterval(pollTimer);
                    onTimeUp();
                    return;
                }

                const currentSec = Math.ceil(remainingMs / 1000);
                if (currentSec !== lastSecTicked) {
                    lastSecTicked = currentSec;
                    playTickSound(currentSec <= 4);
                }

                renderTimer();
            }, 30);

            startFastPolling();
        }

        function pauseTimerManual() {
            clearInterval(timerInterval);
            if (pollTimer) clearInterval(pollTimer);
            setStatus('PAUSED_MANUAL');
        }

        function pauseOnAnswer(ans) {
            if (status === 'PAUSED_ANSWERED') return;

            // STOP TIMER IMMEDIATELY!
            clearInterval(timerInterval);
            if (pollTimer) clearInterval(pollTimer);

            lastPlayerAnswer = ans;
            playBuzzerSound();
            setStatus('PAUSED_ANSWERED');

            if (qCard) {
                clearAnswerFlash();
                if (ans === 'YES') {
                    qCard.classList.add('flash-yes');
                } else if (ans === 'NO') {
                    qCard.classList.add('flash-no');
                }
            }

            showAnswerReveal(ans);
            broadcastState();
        }

        function onTimeUp() {
            playAlarmSound();
            setStatus('TIME_UP');
            showAnswerReveal(null);
        }

        function showAnswerReveal(playerAns) {
            if (!revealBox || !currentQuestion) return;
            revealBox.style.display = 'flex';

            const isYes = currentQuestion.answer === true;
            const correctText = isYes ? 'ใช่ (⭕)' : 'มั่ว (❌)';

            if (playerAnsBadge) {
                if (playerAns === 'YES') {
                    playerAnsBadge.className = 'quiz-player-ans-banner yes';
                    playerAnsBadge.innerHTML = '📱 เครื่องตอบกด: <strong style="font-size: 1.6rem; margin-left: 6px;">ใช่ (⭕)</strong>';
                } else if (playerAns === 'NO') {
                    playerAnsBadge.className = 'quiz-player-ans-banner no';
                    playerAnsBadge.innerHTML = '📱 เครื่องตอบกด: <strong style="font-size: 1.6rem; margin-left: 6px;">มั่ว (❌)</strong>';
                } else {
                    playerAnsBadge.className = 'quiz-player-ans-banner no';
                    playerAnsBadge.innerHTML = '📱 เครื่องตอบ: <strong style="margin-left: 6px;">ไม่ทัน (หมดเวลา) ⏰</strong>';
                }
            }

            if (correctAnsBadge) {
                const isPlayerCorrect = (playerAns === 'YES' && isYes) || (playerAns === 'NO' && !isYes);
                if (playerAns && isPlayerCorrect) {
                    correctAnsBadge.className = 'quiz-ans-badge yes';
                    correctAnsBadge.textContent = `เฉลย: ${correctText} (ตอบถูก! 🎉)`;
                    playCorrectSound();
                } else if (playerAns && !isPlayerCorrect) {
                    correctAnsBadge.className = 'quiz-ans-badge no';
                    correctAnsBadge.textContent = `เฉลย: ${correctText} (ตอบผิด! ❌)`;
                } else {
                    correctAnsBadge.className = 'quiz-ans-badge correct';
                    correctAnsBadge.textContent = `เฉลย: ${correctText}`;
                }
            }

            if (explanationText) {
                explanationText.textContent = `💡 ${currentQuestion.explanation}`;
            }
        }

        if (btnRandomQ && !btnRandomQ.dataset.bound) {
            btnRandomQ.dataset.bound = 'true';
            btnRandomQ.addEventListener('click', () => {
                clearInterval(timerInterval);
                if (pollTimer) clearInterval(pollTimer);
                const nextIdx = Math.floor(Math.random() * (TRICKY_QUESTIONS.length || 1));
                loadQuestion(nextIdx, true);
            });
        }

        if (btnStartTimer && !btnStartTimer.dataset.bound) {
            btnStartTimer.dataset.bound = 'true';
            btnStartTimer.addEventListener('click', () => {
                startTimer();
            });
        }

        if (btnPauseTimer && !btnPauseTimer.dataset.bound) {
            btnPauseTimer.dataset.bound = 'true';
            btnPauseTimer.addEventListener('click', () => {
                pauseTimerManual();
            });
        }

        if (!isInitialized) {
            isInitialized = true;
            loadQuestion(0, true);
            updateConnectedCount();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const quizSec = document.getElementById('quiz-mode');
        if (quizSec && quizSec.classList.contains('active')) {
            window.initQuizHost();
        }
    });
})();