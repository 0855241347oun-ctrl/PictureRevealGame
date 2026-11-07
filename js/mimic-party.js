/**
 * Mimic Party - Mario Party Jamboree Edition
 * ระบบอัดเสียงไมค์สด + คลื่นเสียง Live Waveform + ซาวด์เอฟเฟกต์สไตล์ Mario Party + เวทีสรุปผล Superstar
 */
(function() {
    // Party Avatars (Click to cycle!)
    const PARTY_AVATARS = ["🍄", "👑", "🦖", "⭐", "🐢", "👻", "🐵", "🦊", "🐼", "🐸", "🦁", "🦄"];
    const PLAYER_COLORS = [
        "#ff2a4b", // 1P Mario Red
        "#0099ff", // 2P Toad Blue
        "#00c853", // 3P Luigi Green
        "#ffaa00", // 4P Wario Yellow
        "#ff4081", // 5P Peach Pink
        "#8e24aa", // 6P Waluigi Purple
        "#00acc1", // 7P Yoshi Cyan
        "#fb8c00"  // 8P Daisy Orange
    ];

    // Game State
    let currentPromptObj = { text: "ยายกินลำไย น้ำลายยายไหลย้อย", category: "ลิ้นพันกัน" };
    let isSecretMasked = false;
    let players = [
        { name: "น้องเอิร์ธ", avatarIdx: 0 },
        { name: "น้องมายด์", avatarIdx: 1 },
        { name: "น้องมาร์ค", avatarIdx: 2 },
        { name: "น้องฟ้า", avatarIdx: 3 }
    ];
    let currentTurnIndex = 0;
    let playerRecordings = [];
    let mvpWinnerIndex = -1;

    // Audio & MediaRecorder State
    let audioCtx = null;
    let mediaStream = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let currentTempAudioUrl = null;
    let isRecording = false;
    let recordTimer = null;
    let recordSeconds = 0;
    const MAX_RECORD_SECONDS = 7;

    // Live Waveform Visualizer State
    let analyserNode = null;
    let waveAnimId = null;
    let isSimulatingWave = false;

    // Chain Playback State
    let isChainPlaying = false;
    let chainAudioObj = null;

    // --- MARIO PARTY WEB AUDIO SFX SYNTHESIZER ---
    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playTone(freq, type = 'square', duration = 0.12, vol = 0.2, delay = 0) {
        try {
            const ctx = getAudioCtx();
            const startTime = ctx.currentTime + delay;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(vol, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        } catch (e) {}
    }

    function playCoinSound() {
        // Classic Mario Coin B5 -> E6
        playTone(987.77, 'square', 0.08, 0.18, 0);
        playTone(1318.51, 'square', 0.28, 0.18, 0.08);
    }

    function playDiceBlockSound() {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((n, idx) => {
            playTone(n, 'triangle', 0.09, 0.22, idx * 0.045);
        });
    }

    function playCountdownTone(isGo = false) {
        if (isGo) {
            playTone(880, 'square', 0.35, 0.25, 0);
            playTone(1174.66, 'triangle', 0.35, 0.25, 0.05);
        } else {
            playTone(440, 'triangle', 0.15, 0.22, 0);
        }
    }

    function playStarFanfare() {
        // Celebratory Mario Party Superstar Fanfare!
        const melody = [
            { f: 523.25, d: 0.12, t: 0.0 },
            { f: 659.25, d: 0.12, t: 0.12 },
            { f: 783.99, d: 0.12, t: 0.24 },
            { f: 1046.50, d: 0.22, t: 0.36 },
            { f: 783.99, d: 0.14, t: 0.60 },
            { f: 1046.50, d: 0.45, t: 0.75 }
        ];
        melody.forEach(n => playTone(n.f, 'triangle', n.d, 0.25, n.t));
    }

    // --- THAI SPEECH SYNTHESIS ---
    let thaiVoice = null;
    function loadVoices() {
        if (!('speechSynthesis' in window)) return;
        const voices = window.speechSynthesis.getVoices();
        thaiVoice = voices.find(v => v.lang.includes('th') || v.lang === 'th-TH') || null;
    }
    if ('speechSynthesis' in window) {
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    function speakOriginal(text, onEnded = null) {
        if (!('speechSynthesis' in window)) {
            if (onEnded) onEnded();
            return;
        }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'th-TH';
        if (thaiVoice) utter.voice = thaiVoice;
        utter.rate = 1.05;
        utter.pitch = 1.1;
        utter.onend = () => {
            stopSimulatedWave();
            if (onEnded) onEnded();
        };
        utter.onerror = () => {
            stopSimulatedWave();
            if (onEnded) onEnded();
        };
        startSimulatedWave();
        window.speechSynthesis.speak(utter);
    }

    // --- WAVEFORM VISUALIZER CANVAS ---
    let waveCanvas = null;
    let waveCtx = null;

    function drawIdleWave() {
        if (!waveCanvas || !waveCtx) return;
        const w = waveCanvas.width;
        const h = waveCanvas.height;
        waveCtx.clearRect(0, 0, w, h);

        const barCount = 28;
        const gap = 5;
        const barWidth = (w - gap * (barCount - 1)) / barCount;
        const colors = ["#ff2a4b", "#ffaa00", "#ffea00", "#00e676", "#00b4d8", "#b5179e"];

        for (let i = 0; i < barCount; i++) {
            const barH = 8 + Math.sin(i * 0.5) * 4;
            const x = i * (barWidth + gap);
            const y = (h - barH) / 2;
            waveCtx.fillStyle = colors[i % colors.length];
            waveCtx.beginPath();
            waveCtx.roundRect(x, y, barWidth, barH, 4);
            waveCtx.fill();
        }
    }

    function startLiveMicVisualizer(stream) {
        try {
            const ctx = getAudioCtx();
            const source = ctx.createMediaStreamSource(stream);
            analyserNode = ctx.createAnalyser();
            analyserNode.fftSize = 64;
            source.connect(analyserNode);

            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const colors = ["#ff2a4b", "#ffaa00", "#ffea00", "#00e676", "#00b4d8", "#b5179e"];

            function renderFrame() {
                if (!isRecording) {
                    drawIdleWave();
                    return;
                }
                waveAnimId = requestAnimationFrame(renderFrame);
                analyserNode.getByteFrequencyData(dataArray);

                if (!waveCanvas || !waveCtx) return;
                const w = waveCanvas.width;
                const h = waveCanvas.height;
                waveCtx.clearRect(0, 0, w, h);

                const barCount = 28;
                const gap = 5;
                const barWidth = (w - gap * (barCount - 1)) / barCount;

                for (let i = 0; i < barCount; i++) {
                    const val = dataArray[i % bufferLength] || 0;
                    const barH = Math.max(8, (val / 255) * (h - 6));
                    const x = i * (barWidth + gap);
                    const y = (h - barH) / 2;
                    waveCtx.fillStyle = colors[i % colors.length];
                    waveCtx.beginPath();
                    waveCtx.roundRect(x, y, barWidth, barH, 5);
                    waveCtx.fill();
                }
            }
            renderFrame();
        } catch (e) {
            startSimulatedWave();
        }
    }

    function startSimulatedWave() {
        isSimulatingWave = true;
        const colors = ["#ff2a4b", "#ffaa00", "#ffea00", "#00e676", "#00b4d8", "#b5179e"];
        let tick = 0;
        function simFrame() {
            if (!isSimulatingWave) {
                drawIdleWave();
                return;
            }
            waveAnimId = requestAnimationFrame(simFrame);
            tick += 0.22;
            if (!waveCanvas || !waveCtx) return;
            const w = waveCanvas.width;
            const h = waveCanvas.height;
            waveCtx.clearRect(0, 0, w, h);

            const barCount = 28;
            const gap = 5;
            const barWidth = (w - gap * (barCount - 1)) / barCount;

            for (let i = 0; i < barCount; i++) {
                const wave = Math.abs(Math.sin(tick + i * 0.45)) * Math.abs(Math.cos(tick * 0.7 - i * 0.2));
                const barH = Math.max(8, wave * (h - 8));
                const x = i * (barWidth + gap);
                const y = (h - barH) / 2;
                waveCtx.fillStyle = colors[i % colors.length];
                waveCtx.beginPath();
                waveCtx.roundRect(x, y, barWidth, barH, 5);
                waveCtx.fill();
            }
        }
        simFrame();
    }

    function stopSimulatedWave() {
        isSimulatingWave = false;
        if (waveAnimId) cancelAnimationFrame(waveAnimId);
        drawIdleWave();
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Views
        const viewSetup = document.getElementById('mimic-view-setup');
        const viewRecord = document.getElementById('mimic-view-record');
        const viewSummary = document.getElementById('mimic-view-summary');

        // Setup Elements
        const promptInput = document.getElementById('mimic-prompt-input');
        const promptCatBadge = document.getElementById('mimic-prompt-cat-badge');
        const btnToggleSecret = document.getElementById('mimic-btn-toggle-secret');
        const btnRandomPrompt = document.getElementById('mimic-btn-random-prompt');
        const playersListContainer = document.getElementById('mimic-players-list');
        const btnAddPlayer = document.getElementById('mimic-btn-add-player');
        const btnStartGame = document.getElementById('mimic-btn-start-game');

        // Record Elements
        const cdOverlay = document.getElementById('mimic-cd-overlay');
        const cdText = document.getElementById('mimic-cd-text');
        const turnBadge = document.getElementById('mimic-turn-badge');
        const btnBackSetup = document.getElementById('mimic-btn-back-setup');
        const currentPlayerNameDisplay = document.getElementById('mimic-player-name');
        const currentPlayerAvatar = document.getElementById('mimic-player-avatar');
        const missionHint = document.getElementById('mimic-mission-hint');
        const promptOriginalBox = document.getElementById('mimic-prompt-original-box');
        const promptOriginalText = document.getElementById('mimic-prompt-original-text');
        const btnListenPrompt = document.getElementById('mimic-btn-listen-prompt');
        const btnListenPrevious = document.getElementById('mimic-btn-listen-prev');
        const btnRecordToggle = document.getElementById('mimic-btn-record-toggle');
        const recordTimerDisplay = document.getElementById('mimic-record-timer');
        const recDot = document.getElementById('mimic-rec-dot');
        const monitorStatus = document.getElementById('mimic-monitor-status');
        const playbackReviewBox = document.getElementById('mimic-review-box');
        const btnReviewPlay = document.getElementById('mimic-btn-review-play');
        const btnReviewRerecord = document.getElementById('mimic-btn-review-rerecord');
        const btnNextTurn = document.getElementById('mimic-btn-next-turn');

        waveCanvas = document.getElementById('mimic-wave-canvas');
        if (waveCanvas) {
            waveCtx = waveCanvas.getContext('2d');
            drawIdleWave();
        }

        // Summary Elements
        const summaryChainContainer = document.getElementById('mimic-summary-chain');
        const btnPlayChain = document.getElementById('mimic-btn-play-chain');
        const btnRestartGame = document.getElementById('mimic-btn-restart');
        const promptSummaryText = document.getElementById('mimic-prompt-summary-text');
        const mvpBanner = document.getElementById('mimic-mvp-banner');
        const mvpNameSpan = document.getElementById('mimic-mvp-name');

        // --- SETUP VIEW ---
        function setRandomPrompt(playSfx = false) {
            if (!MIMIC_PROMPTS || MIMIC_PROMPTS.length === 0) return;
            if (playSfx) playDiceBlockSound();
            const rnd = MIMIC_PROMPTS[Math.floor(Math.random() * MIMIC_PROMPTS.length)];
            currentPromptObj = rnd;
            if (promptInput) promptInput.value = rnd.text;
            if (promptCatBadge) {
                promptCatBadge.textContent = `⭐ หมวด: ${rnd.category} (${rnd.difficulty})`;
            }
        }

        if (btnToggleSecret) {
            btnToggleSecret.addEventListener('click', () => {
                playCoinSound();
                isSecretMasked = !isSecretMasked;
                if (promptInput) {
                    promptInput.classList.toggle('secret-masked', isSecretMasked);
                }
                btnToggleSecret.innerHTML = isSecretMasked
                    ? '<span>🙈 ซ่อนอยู่ (คลิกเพื่อดู)</span>'
                    : '<span>👁️ ซ่อนโจทย์บนจอ</span>';
            });
        }

        function renderPlayersSetup() {
            if (!playersListContainer) return;
            playersListContainer.innerHTML = '';

            players.forEach((p, idx) => {
                const card = document.createElement('div');
                card.className = 'mp-char-card';
                card.setAttribute('data-pcolor', idx % 8);

                const avatarEmoji = PARTY_AVATARS[p.avatarIdx % PARTY_AVATARS.length];
                card.innerHTML = `
                    <span class="mp-pbadge">${idx + 1}P</span>
                    ${players.length > 2 ? `<button class="mp-char-del" data-del="${idx}" title="ลบผู้เล่น">×</button>` : ''}
                    <button type="button" class="mp-char-avatar-btn" data-avatar="${idx}" title="คลิกเพื่อเปลี่ยนตัวละคร!">
                        <span>${avatarEmoji}</span>
                        <span class="mp-char-avatar-hint">🔄</span>
                    </button>
                    <input type="text" class="mp-char-name-input" data-name="${idx}" value="${p.name}" placeholder="ชื่อผู้เล่น">
                `;
                playersListContainer.appendChild(card);
            });

            // Avatar click cycles character
            playersListContainer.querySelectorAll('[data-avatar]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    playCoinSound();
                    const idx = parseInt(e.currentTarget.getAttribute('data-avatar'), 10);
                    players[idx].avatarIdx = (players[idx].avatarIdx + 1) % PARTY_AVATARS.length;
                    renderPlayersSetup();
                });
            });

            // Name input change
            playersListContainer.querySelectorAll('[data-name]').forEach(inp => {
                inp.addEventListener('input', (e) => {
                    const idx = parseInt(e.target.getAttribute('data-name'), 10);
                    players[idx].name = e.target.value.trim() || `ผู้เล่น ${idx + 1}`;
                });
            });

            // Delete player
            playersListContainer.querySelectorAll('[data-del]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    playCoinSound();
                    const idx = parseInt(e.currentTarget.getAttribute('data-del'), 10);
                    if (players.length > 2) {
                        players.splice(idx, 1);
                        renderPlayersSetup();
                    }
                });
            });
        }

        if (btnRandomPrompt) {
            btnRandomPrompt.addEventListener('click', () => setRandomPrompt(true));
        }

        if (btnAddPlayer) {
            btnAddPlayer.addEventListener('click', () => {
                if (players.length >= 8) {
                    alert('รองรับผู้เล่นสูงสุด 8 คน (1P - 8P) ครับ!');
                    return;
                }
                playCoinSound();
                const defaultNames = ["น้องเอิร์ธ", "น้องมายด์", "น้องมาร์ค", "น้องฟ้า", "น้องโฟกัส", "น้องข้าวหอม", "น้องบอส", "น้องวิน"];
                const nextName = defaultNames[players.length % defaultNames.length] || `ผู้เล่น ${players.length + 1}`;
                players.push({
                    name: nextName,
                    avatarIdx: players.length % PARTY_AVATARS.length
                });
                renderPlayersSetup();
            });
        }

        if (btnStartGame) {
            btnStartGame.addEventListener('click', () => {
                playStarFanfare();
                const textVal = promptInput ? promptInput.value.trim() : "";
                currentPromptObj.text = textVal || "ยายกินลำไย น้ำลายยายไหลย้อย";
                startRecordingSession();
            });
        }

        if (btnBackSetup) {
            btnBackSetup.addEventListener('click', () => {
                stopRecording();
                stopSimulatedWave();
                if (viewRecord) viewRecord.style.display = 'none';
                if (viewSummary) viewSummary.style.display = 'none';
                if (viewSetup) viewSetup.style.display = 'flex';
            });
        }

        // --- STAGE 2: RECORDING SESSION ---
        function startRecordingSession() {
            currentTurnIndex = 0;
            playerRecordings = [];
            mvpWinnerIndex = -1;
            currentTempAudioUrl = null;

            if (viewSetup) viewSetup.style.display = 'none';
            if (viewSummary) viewSummary.style.display = 'none';
            if (viewRecord) viewRecord.style.display = 'flex';

            loadTurn(0);
        }

        function loadTurn(index) {
            currentTurnIndex = index;
            currentTempAudioUrl = null;
            stopSimulatedWave();
            drawIdleWave();

            if (playbackReviewBox) playbackReviewBox.style.display = 'none';
            if (btnRecordToggle) {
                btnRecordToggle.innerHTML = '<span>🎙️ กดเพื่อเริ่มอัดเสียง!</span>';
                btnRecordToggle.className = 'mp-btn mp-btn-red mp-btn-xl';
                btnRecordToggle.style.display = 'inline-flex';
            }
            if (recordTimerDisplay) recordTimerDisplay.textContent = `00:00 / 00:0${MAX_RECORD_SECONDS}`;
            if (recDot) recDot.classList.remove('live');
            if (monitorStatus) monitorStatus.textContent = 'READY TO RECORD';

            const p = players[currentTurnIndex];
            const pColor = PLAYER_COLORS[currentTurnIndex % PLAYER_COLORS.length];
            const avatarEmoji = PARTY_AVATARS[p.avatarIdx % PARTY_AVATARS.length];

            if (turnBadge) {
                turnBadge.textContent = `${currentTurnIndex + 1}P TURN • คนที่ ${currentTurnIndex + 1} / ${players.length}`;
                turnBadge.style.background = pColor;
            }
            if (currentPlayerNameDisplay) currentPlayerNameDisplay.textContent = p.name;
            if (currentPlayerAvatar) {
                currentPlayerAvatar.textContent = avatarEmoji;
                currentPlayerAvatar.style.background = `linear-gradient(180deg, #ffffff 0%, ${pColor}33 100%)`;
            }

            if (currentTurnIndex === 0) {
                if (missionHint) missionHint.textContent = '🎯 ภารกิจคนแรก (1P): ดูหรือฟังโจทย์ต้นฉบับ แล้วพากย์เสียงใส่ไมค์เลย!';
                if (promptOriginalBox) promptOriginalBox.style.display = 'block';
                if (promptOriginalText) promptOriginalText.textContent = `"${currentPromptObj.text}"`;
                if (btnListenPrompt) btnListenPrompt.style.display = 'inline-flex';
                if (btnListenPrevious) btnListenPrevious.style.display = 'none';
            } else {
                const prevPlayer = players[currentTurnIndex - 1];
                if (missionHint) missionHint.textContent = `🤫 ภารกิจคนที่ ${currentTurnIndex + 1}: ห้ามดูโจทย์! ฟังเสียงจาก "${prevPlayer.name}" แล้วพูดตาม!`;
                if (promptOriginalBox) promptOriginalBox.style.display = 'none';
                if (btnListenPrompt) btnListenPrompt.style.display = 'none';
                if (btnListenPrevious) {
                    btnListenPrevious.style.display = 'inline-flex';
                    btnListenPrevious.innerHTML = `<span>👂 ฟังเสียงจาก "${prevPlayer.name}" (${currentTurnIndex}P)</span>`;
                }
            }
        }

        // 3-2-1-GO! Countdown before recording starts
        function triggerCountdownAndRecord() {
            if (!cdOverlay || !cdText) {
                startActualRecording();
                return;
            }
            cdOverlay.style.display = 'flex';
            const steps = ['3', '2', '1', 'GO! 🎙️'];
            let sIdx = 0;

            function nextStep() {
                if (sIdx >= steps.length) {
                    cdOverlay.style.display = 'none';
                    startActualRecording();
                    return;
                }
                cdText.textContent = steps[sIdx];
                cdText.style.animation = 'none';
                void cdText.offsetWidth;
                cdText.style.animation = 'mpPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
                playCountdownTone(sIdx === steps.length - 1);
                sIdx++;
                setTimeout(nextStep, 480);
            }
            nextStep();
        }

        async function startActualRecording() {
            try {
                if (!mediaStream) {
                    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                }
                audioChunks = [];
                let mimeType = '';
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    mimeType = 'audio/webm;codecs=opus';
                } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                    mimeType = 'audio/ogg';
                }

                mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) audioChunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                    currentTempAudioUrl = URL.createObjectURL(blob);
                    showReviewUI();
                };

                mediaRecorder.start();
                isRecording = true;
                recordSeconds = 0;

                if (btnRecordToggle) {
                    btnRecordToggle.innerHTML = '<span>⏹️ พูดเสร็จแล้ว กดหยุด!</span>';
                    btnRecordToggle.className = 'mp-btn mp-btn-dark mp-btn-xl';
                }
                if (recDot) recDot.classList.add('live');
                if (monitorStatus) monitorStatus.textContent = '🔴 RECORDING LIVE VOICE...';

                startLiveMicVisualizer(mediaStream);

                clearInterval(recordTimer);
                recordTimer = setInterval(() => {
                    recordSeconds++;
                    const secs = recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds;
                    if (recordTimerDisplay) recordTimerDisplay.textContent = `00:${secs} / 00:0${MAX_RECORD_SECONDS}`;
                    if (recordSeconds >= MAX_RECORD_SECONDS) {
                        stopRecording();
                    }
                }, 1000);

            } catch (err) {
                console.warn('Mic access error:', err);
                alert('กรุณาอนุญาตการใช้ไมโครโฟน (Allow Microphone) บนเบราว์เซอร์เพื่ออัดเสียงครับ!');
            }
        }

        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            isRecording = false;
            clearInterval(recordTimer);
            if (recDot) recDot.classList.remove('live');
            if (monitorStatus) monitorStatus.textContent = 'VOICE CAPTURED!';
            drawIdleWave();
        }

        function showReviewUI() {
            playCoinSound();
            if (btnRecordToggle) btnRecordToggle.style.display = 'none';
            if (playbackReviewBox) playbackReviewBox.style.display = 'flex';
            if (btnNextTurn) {
                if (currentTurnIndex + 1 < players.length) {
                    const nextP = players[currentTurnIndex + 1];
                    btnNextTurn.innerHTML = `<span>ส่งไม้ต่อให้ "${nextP.name}" (${currentTurnIndex + 2}P) ➔</span>`;
                } else {
                    btnNextTurn.innerHTML = `<span>🎉 ครบทุกคนแล้ว! ไปหน้าสรุปผลกันเลย! 🏆</span>`;
                }
            }
        }

        if (btnRecordToggle) {
            btnRecordToggle.addEventListener('click', () => {
                if (!isRecording) {
                    // Request mic permission first before 3-2-1 countdown so countdown doesn't get interrupted
                    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                        mediaStream = stream;
                        triggerCountdownAndRecord();
                    }).catch(() => {
                        alert('กรุณาอนุญาตการใช้ไมโครโฟนในเบราว์เซอร์ก่อนเริ่มอัดเสียงครับ!');
                    });
                } else {
                    stopRecording();
                }
            });
        }

        if (btnReviewPlay) {
            btnReviewPlay.addEventListener('click', () => {
                if (!currentTempAudioUrl) return;
                const audio = new Audio(currentTempAudioUrl);
                btnReviewPlay.innerHTML = '<span>🔊 กำลังเล่นเสียง...</span>';
                startSimulatedWave();
                audio.play();
                audio.onended = () => {
                    stopSimulatedWave();
                    btnReviewPlay.innerHTML = '<span>▶️ ลองฟังเสียงตัวเอง</span>';
                };
            });
        }

        if (btnReviewRerecord) {
            btnReviewRerecord.addEventListener('click', () => {
                playCoinSound();
                currentTempAudioUrl = null;
                if (playbackReviewBox) playbackReviewBox.style.display = 'none';
                if (btnRecordToggle) {
                    btnRecordToggle.innerHTML = '<span>🎙️ กดเพื่อเริ่มอัดเสียง!</span>';
                    btnRecordToggle.className = 'mp-btn mp-btn-red mp-btn-xl';
                    btnRecordToggle.style.display = 'inline-flex';
                }
                if (recordTimerDisplay) recordTimerDisplay.textContent = `00:00 / 00:0${MAX_RECORD_SECONDS}`;
            });
        }

        if (btnListenPrompt) {
            btnListenPrompt.addEventListener('click', () => {
                btnListenPrompt.innerHTML = '<span>🔊 กำลังอ่านโจทย์...</span>';
                speakOriginal(currentPromptObj.text, () => {
                    btnListenPrompt.innerHTML = '<span>🔊 ฟังเสียงโจทย์ต้นฉบับ</span>';
                });
            });
        }

        if (btnListenPrevious) {
            btnListenPrevious.addEventListener('click', () => {
                if (currentTurnIndex <= 0) return;
                const prevRec = playerRecordings[currentTurnIndex - 1];
                if (prevRec && prevRec.audioUrl) {
                    const audio = new Audio(prevRec.audioUrl);
                    btnListenPrevious.innerHTML = '<span>🔊 กำลังฟังเสียงเพื่อน...</span>';
                    startSimulatedWave();
                    audio.play();
                    audio.onended = () => {
                        stopSimulatedWave();
                        const prevName = players[currentTurnIndex - 1].name;
                        btnListenPrevious.innerHTML = `<span>👂 ฟังเสียงจาก "${prevName}" อีกครั้ง</span>`;
                    };
                }
            });
        }

        if (btnNextTurn) {
            btnNextTurn.addEventListener('click', () => {
                if (!currentTempAudioUrl) return;
                playCoinSound();

                const p = players[currentTurnIndex];
                playerRecordings.push({
                    name: p.name,
                    avatar: PARTY_AVATARS[p.avatarIdx % PARTY_AVATARS.length],
                    color: PLAYER_COLORS[currentTurnIndex % PLAYER_COLORS.length],
                    audioUrl: currentTempAudioUrl,
                    turn: currentTurnIndex + 1
                });

                if (currentTurnIndex + 1 < players.length) {
                    loadTurn(currentTurnIndex + 1);
                } else {
                    finishAndShowSummary();
                }
            });
        }

        // --- STAGE 3: SUPER REVEAL & PODIUM STAGE ---
        function finishAndShowSummary() {
            playStarFanfare();
            if (viewRecord) viewRecord.style.display = 'none';
            if (viewSetup) viewSetup.style.display = 'none';
            if (viewSummary) viewSummary.style.display = 'flex';

            if (promptSummaryText) promptSummaryText.textContent = `"${currentPromptObj.text}"`;
            if (mvpBanner) mvpBanner.style.display = 'none';
            renderSummaryCards(-99);
        }

        function renderSummaryCards(highlightIndex = -99) {
            if (!summaryChainContainer) return;
            summaryChainContainer.innerHTML = '';

            // 1. Original Prompt Podium Card
            const origCard = document.createElement('div');
            origCard.className = 'mp-podium-card' + (highlightIndex === -1 ? ' active-playing' : '');
            origCard.innerHTML = `
                <div class="mp-star-pointer">⭐</div>
                <span class="mp-pbadge" style="background: #141229;">ORIGINAL</span>
                <div style="font-size: 2.8rem; margin: 0.4rem 0;">👑</div>
                <div style="font-size: 1.05rem; font-weight: 700; color: #141229; margin-bottom: 0.5rem;">เสียงต้นฉบับ</div>
                <button class="mp-btn mp-btn-blue" id="btn-play-orig-single" style="font-size: 0.85rem; padding: 0.4rem 0.9rem; width: 100%;">
                    🔊 ฟังต้นฉบับ
                </button>
            `;
            summaryChainContainer.appendChild(origCard);

            const btnPlayOrigSingle = origCard.querySelector('#btn-play-orig-single');
            if (btnPlayOrigSingle) {
                btnPlayOrigSingle.addEventListener('click', () => {
                    stopChainPlayback();
                    renderSummaryCards(-1);
                    speakOriginal(currentPromptObj.text, () => {
                        renderSummaryCards(-99);
                    });
                });
            }

            // Arrow
            const arrow0 = document.createElement('div');
            arrow0.className = 'mp-chain-arrow';
            arrow0.textContent = '➔';
            summaryChainContainer.appendChild(arrow0);

            // 2. Player Podium Cards
            playerRecordings.forEach((rec, idx) => {
                const isMvp = (mvpWinnerIndex === idx);
                const isPlayingNow = (highlightIndex === idx);

                const card = document.createElement('div');
                card.className = 'mp-podium-card'
                    + (isPlayingNow ? ' active-playing' : '')
                    + (isMvp ? ' mvp-winner' : '');

                card.innerHTML = `
                    <div class="mp-star-pointer">${isMvp ? '👑' : '⭐'}</div>
                    <span class="mp-pbadge" style="background: ${rec.color};">${rec.turn}P</span>
                    <div style="font-size: 2.8rem; margin: 0.3rem 0;">${rec.avatar}</div>
                    <div style="font-size: 1.05rem; font-weight: 700; color: #141229; margin-bottom: 0.4rem;">${rec.name}</div>
                    <button class="mp-btn mp-btn-yellow" data-play-idx="${idx}" style="font-size: 0.85rem; padding: 0.4rem 0.9rem; width: 100%;">
                        ▶️ ฟังเสียง ${rec.turn}P
                    </button>
                    <button class="mp-vote-btn" data-mvp-idx="${idx}">
                        ${isMvp ? '👑 SUPER STAR!' : '⭐ โหวต MVP ฮาสุด'}
                    </button>
                `;
                summaryChainContainer.appendChild(card);

                const btnPlaySingle = card.querySelector(`[data-play-idx="${idx}"]`);
                if (btnPlaySingle) {
                    btnPlaySingle.addEventListener('click', () => playSingleAudio(idx));
                }

                const btnVoteMvp = card.querySelector(`[data-mvp-idx="${idx}"]`);
                if (btnVoteMvp) {
                    btnVoteMvp.addEventListener('click', () => {
                        mvpWinnerIndex = idx;
                        playStarFanfare();
                        if (mvpBanner && mvpNameSpan) {
                            mvpNameSpan.textContent = `${rec.avatar} ${rec.name} (${rec.turn}P)`;
                            mvpBanner.style.display = 'inline-block';
                        }
                        renderSummaryCards(-99);
                    });
                }

                if (idx < playerRecordings.length - 1) {
                    const arrow = document.createElement('div');
                    arrow.className = 'mp-chain-arrow';
                    arrow.textContent = '➔';
                    summaryChainContainer.appendChild(arrow);
                }
            });
        }

        function playSingleAudio(idx) {
            stopChainPlayback();
            const rec = playerRecordings[idx];
            if (!rec || !rec.audioUrl) return;

            renderSummaryCards(idx);
            chainAudioObj = new Audio(rec.audioUrl);
            chainAudioObj.play();
            chainAudioObj.onended = () => {
                renderSummaryCards(-99);
            };
        }

        function stopChainPlayback() {
            if (chainAudioObj) {
                chainAudioObj.pause();
                chainAudioObj = null;
            }
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            isChainPlaying = false;
            if (btnPlayChain) {
                btnPlayChain.innerHTML = '<span>▶️ เปิดฟังเสียงทุกคนเรียงกัน! (PLAY ALL CHAIN)</span>';
                btnPlayChain.className = 'mp-btn mp-btn-green mp-btn-xl';
            }
        }

        function startChainPlayback() {
            if (isChainPlaying) {
                stopChainPlayback();
                renderSummaryCards(-99);
                return;
            }

            isChainPlaying = true;
            if (btnPlayChain) {
                btnPlayChain.innerHTML = '<span>⏹️ กำลังเล่นเสียงต่อเนื่อง... (คลิกเพื่อหยุด)</span>';
                btnPlayChain.className = 'mp-btn mp-btn-red mp-btn-xl';
            }

            renderSummaryCards(-1);
            speakOriginal(currentPromptObj.text, () => {
                if (!isChainPlaying) return;
                setTimeout(() => playChainStep(0), 400);
            });
        }

        function playChainStep(index) {
            if (!isChainPlaying) return;
            if (index >= playerRecordings.length) {
                stopChainPlayback();
                renderSummaryCards(-99);
                playStarFanfare();
                return;
            }

            renderSummaryCards(index);
            const rec = playerRecordings[index];
            chainAudioObj = new Audio(rec.audioUrl);
            chainAudioObj.play().catch(e => console.warn(e));

            chainAudioObj.onended = () => {
                if (!isChainPlaying) return;
                setTimeout(() => {
                    playChainStep(index + 1);
                }, 450);
            };
        }

        if (btnPlayChain) {
            btnPlayChain.addEventListener('click', startChainPlayback);
        }

        if (btnRestartGame) {
            btnRestartGame.addEventListener('click', () => {
                stopChainPlayback();
                playDiceBlockSound();
                if (viewSummary) viewSummary.style.display = 'none';
                if (viewRecord) viewRecord.style.display = 'none';
                if (viewSetup) viewSetup.style.display = 'flex';
                setRandomPrompt(false);
            });
        }

        // Init
        setRandomPrompt(false);
        renderPlayersSetup();
    });
})();
