/**
 * Quiz Host Logic (ใช่ หรือ มั่ว? พร้อมเครื่องตอบสแกน QR)
 * - สุ่มโจทย์ 50 ข้อ
 * - ตั้งเวลา 10, 15, 20, 30, 60 วิ (หรือตามที่เลือก)
 * - แสดงเวลานับถอยหลังเป็น .00 วินาทีชัดเจน
 * - เมื่อเครื่องตอบกดส่งคำตอบ: เวลาหยุดทันที + ตัวการ์ดและปุ่มกระพริบตามสีคำตอบ (เขียว = ใช่, แดง = มั่ว)
 * - หากผู้ถามกดปุ่ม "▶️ เล่นต่อ (นับเวลาต่อ)": จับเวลาต่อจากเวลาเดิมที่ค้างไว้
 * - หากกด "ข้อต่อไป & ลูปเวลาต่อ": รีเซ็ตเวลาเต็มจำนวนของข้อใหม่เสมอ
 * - มีเฉลยตัวเล็กๆ ใต้คำถามให้ผู้ถามดูได้ล่วงหน้า
 */
(function() {
    let roomId = localStorage.getItem('prg_quiz_room_id');
    if (!roomId) {
        roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        localStorage.setItem('prg_quiz_room_id', roomId);
    }

    const hostPeerId = 'prg-quiz-' + roomId;
    let peer = null;
    let clientConns = [];
    const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('prg_quiz_' + roomId) : null;

    // Game State
    let currentQIndex = 0;
    let currentQuestion = null;
    let durationSeconds = 15;
    let remainingMs = 15000;
    let timerInterval = null;
    let lastTickTime = 0;
    let status = 'IDLE'; // 'IDLE', 'RUNNING', 'PAUSED_ANSWERED', 'PAUSED_MANUAL', 'TIME_UP'
    let lastPlayerAnswer = null; // 'YES', 'NO', null

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

    function broadcastState() {
        const payload = {
            type: 'STATE_UPDATE',
            status: status,
            questionText: currentQuestion ? currentQuestion.question : '',
            qIndex: currentQIndex,
            remainingMs: remainingMs,
            durationSeconds: durationSeconds,
            lastAnswer: lastPlayerAnswer
        };

        clientConns.forEach(c => {
            if (c.open) {
                try { c.send(payload); } catch(e) {}
            }
        });

        if (bc) {
            try { bc.postMessage(payload); } catch(e) {}
        }
        try {
            localStorage.setItem('prg_quiz_host_state_' + roomId, JSON.stringify(payload));
        } catch(e) {}
    }

    function handleClientMessage(data) {
        if (!data || !data.type) return;

        if (data.type === 'JOIN' || data.type === 'REQUEST_STATE') {
            updateConnectedCount();
            broadcastState();
        } else if (data.type === 'ANSWER_SUBMITTED') {
            if (status === 'RUNNING') {
                pauseOnAnswer(data.answer);
            }
        }
    }

    function updateConnectedCount() {
        const countEl = document.getElementById('quiz-conn-count');
        const dotEl = document.querySelector('.quiz-dot');
        const activeCount = clientConns.filter(c => c.open).length;
        if (countEl) {
            if (activeCount > 0) {
                countEl.textContent = `เชื่อมต่อแล้ว ${activeCount} เครื่อง 📱`;
                if (dotEl) dotEl.classList.add('active');
            } else {
                countEl.textContent = 'รอเครื่องตอบเชื่อมต่อ... (สแกน QR)';
                if (dotEl) dotEl.classList.remove('active');
            }
        }
    }

    function initHostPeer() {
        if (peer) return;
        try {
            peer = new Peer(hostPeerId);
            peer.on('open', () => {
                console.log('Quiz Host ready on PeerID:', hostPeerId);
            });

            peer.on('connection', (conn) => {
                clientConns.push(conn);
                conn.on('open', () => {
                    updateConnectedCount();
                    broadcastState();
                });
                conn.on('data', (data) => handleClientMessage(data));
                conn.on('close', () => {
                    clientConns = clientConns.filter(c => c !== conn);
                    updateConnectedCount();
                });
            });

            peer.on('error', (err) => {
                console.warn('Host Peer error:', err);
            });
        } catch(e) {
            console.warn(e);
        }

        if (bc) {
            bc.onmessage = (e) => handleClientMessage(e.data);
        }
        window.addEventListener('storage', (e) => {
            if (e.key === 'prg_quiz_action_' + roomId && e.newValue) {
                try {
                    handleClientMessage(JSON.parse(e.newValue));
                } catch(err) {}
            }
        });
    }

    window.initQuizHost = function() {
        initHostPeer();

        const timeSelect = document.getElementById('quiz-time-select');
        const btnToggleQr = document.getElementById('quiz-btn-toggle-qr');
        const btnOpenBuzzer = document.getElementById('quiz-btn-open-buzzer');
        const qrDrawer = document.getElementById('quiz-qr-drawer');
        const qrCodeBox = document.getElementById('quiz-qrcode-box');
        const qrLinkText = document.getElementById('quiz-link-text');
        const customUrlInput = document.getElementById('quiz-custom-url');

        const timerDisplay = document.getElementById('quiz-timer-display');
        const timerBar = document.getElementById('quiz-timer-bar');
        const qNumEl = document.getElementById('quiz-q-num');
        const statusPill = document.getElementById('quiz-status-pill');
        const qTextEl = document.getElementById('quiz-question-text');
        const qCard = document.getElementById('quiz-question-card');

        // Master Hint under question
        const masterHintAns = document.getElementById('quiz-master-hint-ans');
        const masterHintExp = document.getElementById('quiz-master-hint-exp');

        const revealBox = document.getElementById('quiz-reveal-box');
        const playerAnsBadge = document.getElementById('quiz-player-ans-badge');
        const correctAnsBadge = document.getElementById('quiz-correct-ans-badge');
        const explanationText = document.getElementById('quiz-explanation-text');

        const btnRandomQ = document.getElementById('quiz-btn-random-q');
        const btnStartTimer = document.getElementById('quiz-btn-start-timer');
        const btnPauseTimer = document.getElementById('quiz-btn-pause-timer');
        const btnNextLoop = document.getElementById('quiz-btn-next-loop');

        let baseUrl = window.location.href.split('?')[0].replace(/[^/]*$/, '');
        if (baseUrl.startsWith('file:///')) {
            baseUrl = 'http://localhost:8000/';
        }
        let buzzerUrl = baseUrl + 'buzzer.html?room=' + roomId;
        if (qrLinkText) qrLinkText.textContent = buzzerUrl;

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

        if (btnToggleQr) {
            btnToggleQr.addEventListener('click', () => {
                if (!qrDrawer) return;
                const isHidden = qrDrawer.style.display === 'none';
                qrDrawer.style.display = isHidden ? 'block' : 'none';
                if (isHidden) {
                    const targetUrl = (customUrlInput && customUrlInput.value.trim()) ? customUrlInput.value.trim() : buzzerUrl;
                    renderQrCode(targetUrl);
                }
            });
        }

        if (customUrlInput) {
            customUrlInput.value = buzzerUrl;
            customUrlInput.addEventListener('input', () => {
                const val = customUrlInput.value.trim() || buzzerUrl;
                renderQrCode(val);
            });
        }

        if (btnOpenBuzzer) {
            btnOpenBuzzer.addEventListener('click', () => {
                window.open(buzzerUrl, '_blank');
            });
        }

        if (timeSelect) {
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

        // Render Timer with .00 decimals
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

            // Master Hint (เฉลยสำหรับผู้ถาม)
            if (masterHintAns) {
                const isYes = currentQuestion.answer === true;
                masterHintAns.className = 'quiz-master-hint-badge ' + (isYes ? 'yes' : 'no');
                masterHintAns.textContent = isYes ? 'ใช่ (⭕)' : 'มั่ว (❌)';
            }
            if (masterHintExp) {
                masterHintExp.textContent = `— ${currentQuestion.explanation}`;
            }

            // Clear visual effects & answer
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
                statusPill.textContent = '🛑 ตอบแล้ว! เวลาหยุด';
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
            // If starting from 0, reset to duration
            if (remainingMs <= 0) {
                remainingMs = durationSeconds * 1000;
            }

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
            // STOP TIMER IMMEDIATELY! Keep remainingMs as is
            clearInterval(timerInterval);
            lastPlayerAnswer = ans; // 'YES' or 'NO'
            playBuzzerSound();
            setStatus('PAUSED_ANSWERED');

            // Flash effect according to answer (Green for YES, Red for NO)
            if (qCard) {
                clearAnswerFlash();
                if (ans === 'YES') {
                    qCard.classList.add('flash-yes');
                } else if (ans === 'NO') {
                    qCard.classList.add('flash-no');
                }
            }

            showAnswerReveal(ans);
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
                    playerAnsBadge.className = 'quiz-ans-badge yes';
                    playerAnsBadge.textContent = 'เครื่องตอบ: ใช่ (⭕)';
                } else if (playerAns === 'NO') {
                    playerAnsBadge.className = 'quiz-ans-badge no';
                    playerAnsBadge.textContent = 'เครื่องตอบ: มั่ว (❌)';
                } else {
                    playerAnsBadge.className = 'quiz-ans-badge no';
                    playerAnsBadge.textContent = 'เครื่องตอบ: ไม่ทัน (หมดเวลา)';
                }
            }

            if (correctAnsBadge) {
                const isPlayerCorrect = (playerAns === 'YES' && isYes) || (playerAns === 'NO' && !isYes);
                if (playerAns && isPlayerCorrect) {
                    correctAnsBadge.className = 'quiz-ans-badge yes';
                    correctAnsBadge.textContent = `เฉลย: ${correctText} (ถูกต้อง! 🎉)`;
                    playCorrectSound();
                } else {
                    correctAnsBadge.className = 'quiz-ans-badge correct';
                    correctAnsBadge.textContent = `เฉลย: ${correctText}`;
                }
            }

            if (explanationText) {
                explanationText.textContent = `💡 ${currentQuestion.explanation}`;
            }
        }

        // Button Event Handlers
        if (btnRandomQ) {
            btnRandomQ.addEventListener('click', () => {
                clearInterval(timerInterval);
                const nextIdx = Math.floor(Math.random() * (TRICKY_QUESTIONS.length || 1));
                loadQuestion(nextIdx, true);
            });
        }

        // เริ่มจับเวลา / นับเวลาต่อจากเดิม
        if (btnStartTimer) {
            btnStartTimer.addEventListener('click', () => {
                startTimer();
            });
        }

        if (btnPauseTimer) {
            btnPauseTimer.addEventListener('click', () => {
                pauseTimerManual();
            });
        }

        // ข้อต่อไป & ลูปเวลาต่อ (รีเซ็ตเวลาเต็มจำนวนของข้อใหม่เสมอ)
        if (btnNextLoop) {
            btnNextLoop.addEventListener('click', () => {
                clearInterval(timerInterval);
                loadQuestion(currentQIndex + 1, true);
                startTimer();
            });
        }

        // Initial Load
        loadQuestion(0, true);
        updateConnectedCount();
    };

    document.addEventListener('DOMContentLoaded', () => {
        const quizSec = document.getElementById('quiz-mode');
        if (quizSec && quizSec.classList.contains('active')) {
            window.initQuizHost();
        }
    });
})();
