/**
 * Quiz Host Logic (ใช่ หรือ มั่ว? พร้อมเครื่องตอบสแกน QR)
 * - สุ่มโจทย์ 50 ข้อ
 * - ตั้งเวลา 10, 15, 20, 30, 60 วิ
 * - กดเริ่ม -> เวลานับถอยหลัง
 * - เครื่องตอบกด "ใช่" หรือ "มั่ว" -> เวลาหยุดทันที แสดงผลคำตอบ
 * - ผู้คุมโจทย์กดเริ่มต่อ หรือกด "ข้อต่อไป" -> วนลูปเวลาต่อได้เรื่อยๆ
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

    function playTone(freq, dur = 0.12, type = 'sine', vol = 0.2) {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + dur);
        } catch(e) {}
    }

    function playCorrectSound() {
        playTone(523.25, 0.1, 'triangle', 0.25);
        setTimeout(() => playTone(659.25, 0.1, 'triangle', 0.25), 100);
        setTimeout(() => playTone(783.99, 0.25, 'triangle', 0.25), 200);
    }

    function playBuzzerSound() {
        playTone(320, 0.2, 'sawtooth', 0.3);
    }

    function playTickSound() {
        playTone(800, 0.04, 'square', 0.08);
    }

    function playAlarmSound() {
        playTone(250, 0.35, 'sawtooth', 0.35);
    }

    // Communication: Broadcast state to all connected devices
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
            if (c.open) c.send(payload);
        });

        if (bc) {
            bc.postMessage(payload);
        }
    }

    function handleClientMessage(data) {
        if (!data || !data.type) return;

        if (data.type === 'JOIN' || data.type === 'REQUEST_STATE') {
            updateConnectedCount();
            broadcastState();
        } else if (data.type === 'ANSWER_SUBMITTED') {
            // Player buzzed! Stop timer immediately!
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

    // Initialize PeerJS Host
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
    }

    // --- DOM Elements & Logic ---
    window.initQuizHost = function() {
        initHostPeer();

        const timeSelect = document.getElementById('quiz-time-select');
        const btnToggleQr = document.getElementById('quiz-btn-toggle-qr');
        const btnOpenBuzzer = document.getElementById('quiz-btn-open-buzzer');
        const qrDrawer = document.getElementById('quiz-qr-drawer');
        const qrCodeBox = document.getElementById('quiz-qrcode-box');
        const qrLinkText = document.getElementById('quiz-link-text');

        const timerDisplay = document.getElementById('quiz-timer-display');
        const timerBar = document.getElementById('quiz-timer-bar');
        const qNumEl = document.getElementById('quiz-q-num');
        const statusPill = document.getElementById('quiz-status-pill');
        const qTextEl = document.getElementById('quiz-question-text');

        const revealBox = document.getElementById('quiz-reveal-box');
        const playerAnsBadge = document.getElementById('quiz-player-ans-badge');
        const correctAnsBadge = document.getElementById('quiz-correct-ans-badge');
        const explanationText = document.getElementById('quiz-explanation-text');

        const btnRandomQ = document.getElementById('quiz-btn-random-q');
        const btnStartTimer = document.getElementById('quiz-btn-start-timer');
        const btnPauseTimer = document.getElementById('quiz-btn-pause-timer');
        const btnNextLoop = document.getElementById('quiz-btn-next-loop');

        // Setup Buzzer URL & QR Code
        const buzzerUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'buzzer.html?room=' + roomId;
        if (qrLinkText) qrLinkText.textContent = buzzerUrl;

        let qrGenerated = false;
        function generateQrCode() {
            if (qrGenerated || !qrCodeBox || typeof QRCode === 'undefined') return;
            qrCodeBox.innerHTML = '';
            new QRCode(qrCodeBox, {
                text: buzzerUrl,
                width: 160,
                height: 160,
                colorDark: '#0f172a',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            qrGenerated = true;
        }

        if (btnToggleQr) {
            btnToggleQr.addEventListener('click', () => {
                if (!qrDrawer) return;
                const isHidden = qrDrawer.style.display === 'none';
                qrDrawer.style.display = isHidden ? 'block' : 'none';
                if (isHidden) generateQrCode();
            });
        }

        if (btnOpenBuzzer) {
            btnOpenBuzzer.addEventListener('click', () => {
                window.open(buzzerUrl, '_blank');
            });
        }

        // Duration Select
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

        function renderTimer() {
            const sec = Math.max(0, Math.ceil(remainingMs / 1000));
            if (timerDisplay) {
                timerDisplay.textContent = sec;
                if (sec <= 3 && status === 'RUNNING') {
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

        function loadQuestion(idx) {
            if (typeof TRICKY_QUESTIONS === 'undefined' || TRICKY_QUESTIONS.length === 0) return;
            currentQIndex = (idx + TRICKY_QUESTIONS.length) % TRICKY_QUESTIONS.length;
            currentQuestion = TRICKY_QUESTIONS[currentQIndex];

            if (qNumEl) qNumEl.textContent = `ข้อที่ ${currentQIndex + 1} / ${TRICKY_QUESTIONS.length}`;
            if (qTextEl) qTextEl.textContent = currentQuestion.question;

            // Hide answer reveal
            if (revealBox) revealBox.style.display = 'none';

            // Reset player answer
            lastPlayerAnswer = null;

            // Reset timer
            remainingMs = durationSeconds * 1000;
            renderTimer();

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
                    if (currentSec <= 5) playTickSound();
                }

                renderTimer();
            }, 50);
        }

        function pauseTimerManual() {
            clearInterval(timerInterval);
            setStatus('PAUSED_MANUAL');
        }

        function pauseOnAnswer(ans) {
            clearInterval(timerInterval);
            lastPlayerAnswer = ans; // 'YES' or 'NO'
            playBuzzerSound();
            setStatus('PAUSED_ANSWERED');

            // Show Reveal Result Box
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
                loadQuestion(nextIdx);
            });
        }

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

        if (btnNextLoop) {
            btnNextLoop.addEventListener('click', () => {
                clearInterval(timerInterval);
                // Next question & start immediately (loop)
                loadQuestion(currentQIndex + 1);
                startTimer();
            });
        }

        // Initial Load
        loadQuestion(0);
        updateConnectedCount();
    };

    // Auto-init if quiz mode is active on load
    document.addEventListener('DOMContentLoaded', () => {
        const quizSec = document.getElementById('quiz-mode');
        if (quizSec && quizSec.classList.contains('active')) {
            window.initQuizHost();
        }
    });
})();
