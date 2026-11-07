/**
 * Quiz Host Logic (ใช่ หรือ มั่ว? พร้อมเครื่องตอบสแกน QR)
 * - สุ่มโจทย์ 50 ข้อ พร้อมเฉลยสำหรับผู้ถาม
 * - ตั้งเวลา 10, 15, 20, 30, 60 วินาที นับถอยหลังละเอียดระดับ .00 วินาที
 * - ซิงก์สถานะแบบ Real-Time 2 ทิศทาง (Host <-> Buzzer):
 *   1) EMQX MQTT over WSS (broker.emqx.io:8084/mqtt, mqttVersion: 4 + Retained State)
 *   2) HiveMQ MQTT over WSS (broker.hivemq.com:8884/mqtt, mqttVersion: 4 + Retained State)
 *   3) PeerJS WebRTC DataChannel (Direct P2P < 10ms)
 *   4) BroadcastChannel & LocalStorage 60ms Memory Watcher (สำหรับเปิดบนเครื่องเดียวกัน)
 * - เมื่อเวลาหยุดอยู่ (IDLE / PAUSED / TIME_UP) เครื่องตอบจะถูกบล็อกอัตโนมัติ
 * - เมื่อคนถามกด "เริ่มจับเวลา" เครื่องตอบจะปลดล็อกให้กดตอบได้ทันที (ตอบได้ครั้งเดียวต่อรอบ)
 * - เมื่อเครื่องตอบกดตอบ เวลาบนหน้าคนถามจะหยุดทันที แสดงคำตอบขนาดใหญ่ชัดเจน + กระพริบสีเขียว/แดง
 */
(function() {
    // Clean v3 room key (ignores any old random 5-char code from earlier versions)
    let roomId = localStorage.getItem('prg_quiz_room_v3') || '1234';
    roomId = roomId.toUpperCase().replace(/[^A-Z0-9]/g, '') || '1234';
    localStorage.setItem('prg_quiz_room_v3', roomId);

    // Game State (All in top-level scope so every handler can access directly)
    let currentQIndex = 0;
    let currentQuestion = null;
    let durationSeconds = 15;
    let remainingMs = 15000;
    let timerInterval = null;
    let heartbeatInterval = null;
    let lastTickTime = 0;
    let status = 'IDLE'; // 'IDLE', 'RUNNING', 'PAUSED_ANSWERED', 'PAUSED_MANUAL', 'TIME_UP'
    let lastPlayerAnswer = null; // 'YES', 'NO', null
    let currentRoundId = Date.now();
    let isInitialized = false;
    let buzzerConnected = false;
    const processedMsgIds = new Set();

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

    // --- DOM Element Lookup Helpers ---
    function el(id) {
        return document.getElementById(id);
    }

    // --- UI Rendering & Game Control Functions (Top-Level Scope!) ---
    function updateConnectedCount(isClientSeen = false) {
        if (isClientSeen) buzzerConnected = true;
        const countEl = el('quiz-conn-count');
        const dotEl = document.querySelector('.quiz-dot');
        const roomDisplay = el('quiz-room-display');

        if (roomDisplay) roomDisplay.textContent = roomId;

        const mqttReady = (emqxClient && emqxClient.isConnected()) || (hiveClient && hiveClient.isConnected());
        if (countEl) {
            if (buzzerConnected) {
                countEl.textContent = `เชื่อมต่อเครื่องตอบแล้ว 🟢 (ห้อง: ${roomId})`;
                if (dotEl) dotEl.classList.add('active');
            } else if (mqttReady) {
                countEl.textContent = `ออนไลน์ พร้อมเชื่อมเครื่องตอบ 📱 (ห้อง: ${roomId})`;
                if (dotEl) dotEl.classList.add('active');
            } else {
                countEl.textContent = `กำลังเตรียมสัญญาณ... (ห้อง: ${roomId})`;
                if (dotEl) dotEl.classList.remove('active');
            }
        }
    }

    function renderTimer() {
        const timerDisplay = el('quiz-timer-display');
        const timerBar = el('quiz-timer-bar');
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
        const qCard = el('quiz-question-card');
        if (qCard) {
            qCard.classList.remove('flash-yes', 'flash-no');
        }
    }

    function loadQuestion(idx, forceResetTimer = false) {
        if (typeof TRICKY_QUESTIONS === 'undefined' || TRICKY_QUESTIONS.length === 0) return;
        currentQIndex = (idx + TRICKY_QUESTIONS.length) % TRICKY_QUESTIONS.length;
        currentQuestion = TRICKY_QUESTIONS[currentQIndex];

        const qNumEl = el('quiz-q-num');
        const qTextEl = el('quiz-question-text');
        const masterHintAns = el('quiz-master-hint-ans');
        const masterHintExp = el('quiz-master-hint-exp');
        const revealBox = el('quiz-reveal-box');

        if (qNumEl) qNumEl.textContent = `ข้อที่ ${currentQIndex + 1} / ${TRICKY_QUESTIONS.length}`;
        if (qTextEl) {
            qTextEl.textContent = currentQuestion.question;
            qTextEl.style.animation = 'none';
            void qTextEl.offsetHeight; // trigger reflow
            qTextEl.style.animation = 'questionPopIn 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }

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
        currentRoundId = Date.now();

        if (forceResetTimer || remainingMs <= 0 || status === 'TIME_UP') {
            remainingMs = durationSeconds * 1000;
        }
        renderTimer();
        setStatus('IDLE');
    }

    function setStatus(newStatus) {
        status = newStatus;
        const statusPill = el('quiz-status-pill');
        const btnStartTimer = el('quiz-btn-start-timer');
        const btnPauseTimer = el('quiz-btn-pause-timer');

        if (statusPill) {
            statusPill.className = 'quiz-status-pill';
            if (status === 'IDLE') {
                statusPill.classList.add('ready');
                const isPartial = remainingMs > 0 && remainingMs < durationSeconds * 1000;
                statusPill.textContent = isPartial
                    ? `⏸️ รอกดเริ่มต่อ (${(remainingMs / 1000).toFixed(2)} วิ)`
                    : 'พร้อมเริ่ม (เครื่องตอบล็อกอยู่)';
                if (btnStartTimer) {
                    btnStartTimer.textContent = isPartial ? '▶️ เริ่มจับเวลาต่อ!' : '▶️ เริ่มจับเวลา!';
                    btnStartTimer.style.display = 'inline-flex';
                }
                if (btnPauseTimer) btnPauseTimer.style.display = 'none';
            } else if (status === 'RUNNING') {
                statusPill.classList.add('running');
                statusPill.textContent = '⏳ กำลังจับเวลา... (เครื่องตอบกดได้!)';
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
                statusPill.textContent = '⏸️ หยุดเวลาชั่วคราว (เครื่องตอบล็อกอยู่)';
                if (btnStartTimer) {
                    btnStartTimer.textContent = '▶️ จับเวลาต่อ';
                    btnStartTimer.style.display = 'inline-flex';
                }
                if (btnPauseTimer) btnPauseTimer.style.display = 'none';
            } else if (status === 'TIME_UP') {
                statusPill.classList.add('timeout');
                statusPill.textContent = '⏰ หมดเวลา!';
                if (btnStartTimer) {
                    btnStartTimer.textContent = '🔄 เริ่มจับเวลารอบใหม่';
                    btnStartTimer.style.display = 'inline-flex';
                }
                if (btnPauseTimer) btnPauseTimer.style.display = 'none';
            }
        }
        broadcastState();
    }

    function startTimer() {
        if (status === 'RUNNING') return;

        // If resuming after an answer or time up, hide previous answer reveal & flash
        const revealBox = el('quiz-reveal-box');
        if (status === 'PAUSED_ANSWERED' || status === 'TIME_UP') {
            if (revealBox) revealBox.style.display = 'none';
            clearAnswerFlash();
            lastPlayerAnswer = null;
        }

        if (remainingMs <= 0) {
            remainingMs = durationSeconds * 1000;
        }

        // New round ID so buzzer unlocks cleanly for this countdown
        currentRoundId = Date.now();
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
    }

    function pauseTimerManual() {
        clearInterval(timerInterval);
        setStatus('PAUSED_MANUAL');
    }

    function pauseOnAnswer(ans) {
        // Only accept answer when timer is RUNNING (or prevent duplicate trigger)
        if (status !== 'RUNNING') return;

        // STOP TIMER IMMEDIATELY!
        clearInterval(timerInterval);
        lastPlayerAnswer = ans;
        playBuzzerSound();
        setStatus('PAUSED_ANSWERED');

        const qCard = el('quiz-question-card');
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
        clearInterval(timerInterval);
        playAlarmSound();
        setStatus('TIME_UP');
        showAnswerReveal(null);
    }

    function showAnswerReveal(playerAns) {
        const revealBox = el('quiz-reveal-box');
        const playerAnsBadge = el('quiz-player-ans-badge');
        const correctAnsBadge = el('quiz-correct-ans-badge');
        const explanationText = el('quiz-explanation-text');

        if (!revealBox || !currentQuestion) return;
        revealBox.style.display = 'flex';

        const isYes = currentQuestion.answer === true;
        const correctText = isYes ? 'ใช่ (⭕)' : 'มั่ว (❌)';

        if (playerAnsBadge) {
            if (playerAns === 'YES') {
                playerAnsBadge.className = 'quiz-player-ans-banner yes';
                playerAnsBadge.innerHTML = '📱 เครื่องตอบกด: <strong style="font-size: 1.65rem; margin-left: 6px;">ใช่ (⭕)</strong>';
            } else if (playerAns === 'NO') {
                playerAnsBadge.className = 'quiz-player-ans-banner no';
                playerAnsBadge.innerHTML = '📱 เครื่องตอบกด: <strong style="font-size: 1.65rem; margin-left: 6px;">มั่ว (❌)</strong>';
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

    // --- Multi-Channel Real-Time Sync Engine ---
    let emqxClient = null;
    let hiveClient = null;
    let hostPeer = null;
    let peerConnections = [];
    let bcRoom = null;
    let bcGlobal = null;

    function getStatePayload() {
        return {
            type: 'STATE_UPDATE',
            status: status,
            roundId: currentRoundId,
            questionText: currentQuestion ? `ข้อที่ ${currentQIndex + 1}: ${currentQuestion.question}` : '',
            qIndex: currentQIndex,
            remainingMs: Math.round(remainingMs),
            durationSeconds: durationSeconds,
            lastAnswer: lastPlayerAnswer,
            roomId: roomId,
            _t: Date.now()
        };
    }

    function broadcastState() {
        const payload = getStatePayload();
        const str = JSON.stringify(payload);

        // 1. EMQX MQTT (with retained = true so new buzzers get state immediately!)
        if (emqxClient && emqxClient.isConnected()) {
            try {
                const m1 = new Paho.MQTT.Message(str);
                m1.destinationName = 'prg/quiz/' + roomId + '/host';
                m1.retained = true;
                emqxClient.send(m1);

                const m2 = new Paho.MQTT.Message(str);
                m2.destinationName = 'prg/quiz/GLOBAL/host';
                m2.retained = true;
                emqxClient.send(m2);
            } catch(e) {}
        }

        // 2. HiveMQ MQTT (hot-standby broker)
        if (hiveClient && hiveClient.isConnected()) {
            try {
                const m1 = new Paho.MQTT.Message(str);
                m1.destinationName = 'prg/quiz/' + roomId + '/host';
                m1.retained = true;
                hiveClient.send(m1);

                const m2 = new Paho.MQTT.Message(str);
                m2.destinationName = 'prg/quiz/GLOBAL/host';
                m2.retained = true;
                hiveClient.send(m2);
            } catch(e) {}
        }

        // 3. PeerJS WebRTC DataChannels
        peerConnections.forEach(conn => {
            try {
                if (conn && conn.open) conn.send(payload);
            } catch(e) {}
        });

        // 4. BroadcastChannel (Same browser tabs)
        try {
            if (bcRoom) bcRoom.postMessage(payload);
            if (bcGlobal) bcGlobal.postMessage(payload);
        } catch(e) {}

        // 5. LocalStorage (Same browser fallback)
        try {
            localStorage.setItem('prg_quiz_ls_host_v3_' + roomId, str);
            localStorage.setItem('prg_quiz_ls_host_v3_GLOBAL', str);
        } catch(e) {}
    }

    function handleClientMessage(data) {
        if (!data || !data.type) return;

        // Deduplicate by msgId if present
        if (data.msgId) {
            if (processedMsgIds.has(data.msgId)) return;
            processedMsgIds.add(data.msgId);
        }

        if (data.type === 'JOIN' || data.type === 'REQUEST_STATE' || data.type === 'PING') {
            updateConnectedCount(true);
            broadcastState();
        } else if (data.type === 'ANSWER_SUBMITTED') {
            updateConnectedCount(true);
            pauseOnAnswer(data.answer);
        }
    }

    // Channel 1: EMQX MQTT Broker (mqttVersion: 4)
    function initEmqx() {
        if (typeof Paho === 'undefined') return;
        try {
            if (emqxClient && emqxClient.isConnected()) {
                try { emqxClient.disconnect(); } catch(e) {}
            }
            const cid = 'prg_hst_emqx_' + Math.random().toString(36).substring(2, 9);
            emqxClient = new Paho.MQTT.Client('broker.emqx.io', 8084, '/mqtt', cid);
            emqxClient.onMessageArrived = (m) => {
                try { handleClientMessage(JSON.parse(m.payloadString)); } catch(e) {}
            };
            emqxClient.onConnectionLost = () => {
                updateConnectedCount();
                setTimeout(initEmqx, 2500);
            };
            emqxClient.connect({
                useSSL: true,
                mqttVersion: 4,
                timeout: 5,
                keepAliveInterval: 30,
                onSuccess: () => {
                    try {
                        emqxClient.subscribe('prg/quiz/' + roomId + '/client');
                        emqxClient.subscribe('prg/quiz/GLOBAL/client');
                        emqxClient.subscribe('prg/quiz/1234/client');
                    } catch(e) {}
                    updateConnectedCount();
                    broadcastState();
                },
                onFailure: () => {
                    setTimeout(initEmqx, 3000);
                }
            });
        } catch(e) {}
    }

    // Channel 2: HiveMQ MQTT Broker (mqttVersion: 4)
    function initHiveMq() {
        if (typeof Paho === 'undefined') return;
        try {
            if (hiveClient && hiveClient.isConnected()) {
                try { hiveClient.disconnect(); } catch(e) {}
            }
            const cid = 'prg_hst_hive_' + Math.random().toString(36).substring(2, 9);
            hiveClient = new Paho.MQTT.Client('broker.hivemq.com', 8884, '/mqtt', cid);
            hiveClient.onMessageArrived = (m) => {
                try { handleClientMessage(JSON.parse(m.payloadString)); } catch(e) {}
            };
            hiveClient.onConnectionLost = () => {
                updateConnectedCount();
                setTimeout(initHiveMq, 3000);
            };
            hiveClient.connect({
                useSSL: true,
                mqttVersion: 4,
                timeout: 5,
                keepAliveInterval: 30,
                onSuccess: () => {
                    try {
                        hiveClient.subscribe('prg/quiz/' + roomId + '/client');
                        hiveClient.subscribe('prg/quiz/GLOBAL/client');
                        hiveClient.subscribe('prg/quiz/1234/client');
                    } catch(e) {}
                    updateConnectedCount();
                    broadcastState();
                },
                onFailure: () => {
                    setTimeout(initHiveMq, 4000);
                }
            });
        } catch(e) {}
    }

    // Channel 3: PeerJS WebRTC DataChannel
    function initPeerJs() {
        if (typeof Peer === 'undefined') return;
        try {
            if (hostPeer) {
                try { hostPeer.destroy(); } catch(e) {}
            }
            peerConnections = [];
            const peerId = 'prg-quiz-host-v3-' + roomId.toLowerCase();
            hostPeer = new Peer(peerId);
            hostPeer.on('open', () => {
                updateConnectedCount();
            });
            hostPeer.on('connection', (conn) => {
                peerConnections.push(conn);
                updateConnectedCount(true);
                conn.on('open', () => {
                    updateConnectedCount(true);
                    conn.send(getStatePayload());
                });
                conn.on('data', (data) => {
                    handleClientMessage(data);
                });
            });
            hostPeer.on('error', () => {
                // Ignore ID-taken or network errors gracefully; MQTT is active
            });
        } catch(e) {}
    }

    // Channel 4 & 5: BroadcastChannel + LocalStorage 60ms Watcher
    let lastSeenClientLs = '';
    function initLocalChannels() {
        try {
            if ('BroadcastChannel' in window) {
                if (bcRoom) bcRoom.close();
                if (bcGlobal) bcGlobal.close();
                bcRoom = new BroadcastChannel('prg_quiz_bc_v3_' + roomId);
                bcGlobal = new BroadcastChannel('prg_quiz_bc_v3_GLOBAL');
                bcRoom.onmessage = (e) => handleClientMessage(e.data);
                bcGlobal.onmessage = (e) => handleClientMessage(e.data);
            }
        } catch(e) {}
    }

    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('prg_quiz_ls_client_v3_') && e.newValue) {
            try { handleClientMessage(JSON.parse(e.newValue)); } catch(err) {}
        }
    });

    // 60ms LocalStorage memory watcher (0 network cost, instant same-machine sync even on file:///)
    setInterval(() => {
        try {
            const raw = localStorage.getItem('prg_quiz_ls_client_v3_GLOBAL') || localStorage.getItem('prg_quiz_ls_client_v3_' + roomId);
            if (raw && raw !== lastSeenClientLs) {
                lastSeenClientLs = raw;
                handleClientMessage(JSON.parse(raw));
            }
        } catch(e) {}
    }, 60);

    // Periodic 1s heartbeat so any buzzer stays in sync with timer & status
    heartbeatInterval = setInterval(() => {
        broadcastState();
    }, 1000);

    function startAllTransports() {
        initLocalChannels();
        initEmqx();
        initHiveMq();
        initPeerJs();
    }

    startAllTransports();

    // --- DOM Elements & Host Controller Binding ---
    window.initQuizHost = function() {
        const timeSelect = el('quiz-time-select');
        const btnToggleQr = el('quiz-btn-toggle-qr');
        const btnOpenBuzzer = el('quiz-btn-open-buzzer');
        const qrDrawer = el('quiz-qr-drawer');
        const qrCodeBox = el('quiz-qrcode-box');
        const qrLinkText = el('quiz-link-text');
        const customUrlInput = el('quiz-custom-url');
        const hostRoomBadge = el('quiz-host-room-badge');
        const btnRandomQ = el('quiz-btn-random-q');
        const btnStartTimer = el('quiz-btn-start-timer');
        const btnPauseTimer = el('quiz-btn-pause-timer');

        function buildBuzzerUrl(targetBase) {
            let base = targetBase || window.location.href.split('?')[0].replace(/[^/]*$/, '');
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

        if (hostRoomBadge && !hostRoomBadge.dataset.bound) {
            hostRoomBadge.dataset.bound = 'true';
            hostRoomBadge.addEventListener('click', () => {
                const newCode = prompt('ใส่รหัสห้องที่ต้องการ (เช่น 1234):', roomId);
                if (newCode && newCode.trim()) {
                    const sanitized = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (sanitized) {
                        roomId = sanitized;
                        localStorage.setItem('prg_quiz_room_v3', roomId);
                        buzzerConnected = false;
                        currentBuzzerUrl = buildBuzzerUrl();
                        if (customUrlInput) customUrlInput.value = currentBuzzerUrl;
                        startAllTransports();
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
                    setStatus('IDLE');
                }
            });
        }

        if (btnRandomQ && !btnRandomQ.dataset.bound) {
            btnRandomQ.dataset.bound = 'true';
            btnRandomQ.addEventListener('click', () => {
                clearInterval(timerInterval);
                let nextIdx = Math.floor(Math.random() * (TRICKY_QUESTIONS.length || 1));
                if (TRICKY_QUESTIONS.length > 1 && nextIdx === currentQIndex) {
                    nextIdx = (nextIdx + 1) % TRICKY_QUESTIONS.length;
                }
                // Keep remaining time if paused mid-countdown; only reset if time was up or full
                loadQuestion(nextIdx, false);
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
        } else {
            broadcastState();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const quizSec = el('quiz-mode');
        if (quizSec && quizSec.classList.contains('active')) {
            window.initQuizHost();
        }
    });
})();
