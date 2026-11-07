/**
 * Mimic Party - Game Engine
 * จัดการอัดเสียงไมโครโฟนสดทีละคน ส่งต่อเสียง และสรุปฟังเสียงทุกคนตอนท้าย
 */
(function() {
    // Game State
    let currentPromptText = "";
    let players = ["น้องเอิร์ธ", "น้องมายด์", "น้องมาร์ค"];
    let currentStep = "setup"; // "setup" | "record" | "summary"
    let currentTurnIndex = 0;
    
    // Audio Recordings: [{ name: "ต้นฉบับ", isOriginal: true, text: "..." }, { name: "น้องเอิร์ธ", audioUrl: "...", blob: ... }]
    let playerRecordings = [];

    // MediaRecorder handles
    let mediaStream = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let currentTempAudioUrl = null;
    let isRecording = false;
    let recordTimer = null;
    let recordSeconds = 0;
    const MAX_RECORD_SECONDS = 7;

    // Chain playback state
    let isChainPlaying = false;
    let chainAudioObj = null;

    // Web Speech Synthesis for Original Prompt Audio
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
        if (onEnded) {
            utter.onend = onEnded;
            utter.onerror = onEnded;
        }
        window.speechSynthesis.speak(utter);
    }

    // Default Avatar Emojis
    const AVATARS = ["👧", "👦", "🧒", "👶", "🐱", "🐶", "🐰", "🦊", "🐼", "🐻"];

    document.addEventListener('DOMContentLoaded', () => {
        // Containers
        const viewSetup = document.getElementById('mimic-view-setup');
        const viewRecord = document.getElementById('mimic-view-record');
        const viewSummary = document.getElementById('mimic-view-summary');

        // Setup Elements
        const promptInput = document.getElementById('mimic-prompt-input');
        const btnRandomPrompt = document.getElementById('mimic-btn-random-prompt');
        const playersListContainer = document.getElementById('mimic-players-list');
        const btnAddPlayer = document.getElementById('mimic-btn-add-player');
        const btnStartGame = document.getElementById('mimic-btn-start-game');

        // Record Elements
        const turnBadge = document.getElementById('mimic-turn-badge');
        const currentPlayerNameDisplay = document.getElementById('mimic-player-name');
        const currentPlayerAvatar = document.getElementById('mimic-player-avatar');
        const promptOriginalBox = document.getElementById('mimic-prompt-original-box');
        const promptOriginalText = document.getElementById('mimic-prompt-original-text');
        const btnListenPrompt = document.getElementById('mimic-btn-listen-prompt');
        const btnListenPrevious = document.getElementById('mimic-btn-listen-prev');
        const btnRecordToggle = document.getElementById('mimic-btn-record-toggle');
        const recordTimerDisplay = document.getElementById('mimic-record-timer');
        const recordPulseRing = document.getElementById('mimic-record-pulse');
        const playbackReviewBox = document.getElementById('mimic-review-box');
        const btnReviewPlay = document.getElementById('mimic-btn-review-play');
        const btnReviewRerecord = document.getElementById('mimic-btn-review-rerecord');
        const btnNextTurn = document.getElementById('mimic-btn-next-turn');

        // Summary Elements
        const summaryChainContainer = document.getElementById('mimic-summary-chain');
        const btnPlayChain = document.getElementById('mimic-btn-play-chain');
        const btnRestartGame = document.getElementById('mimic-btn-restart');
        const promptSummaryText = document.getElementById('mimic-prompt-summary-text');

        // --- SETUP VIEW LOGIC ---
        function setRandomPrompt() {
            if (!MIMIC_PROMPTS || MIMIC_PROMPTS.length === 0) return;
            const rnd = MIMIC_PROMPTS[Math.floor(Math.random() * MIMIC_PROMPTS.length)];
            currentPromptText = rnd.text;
            if (promptInput) promptInput.value = currentPromptText;
        }

        function renderPlayersSetup() {
            if (!playersListContainer) return;
            playersListContainer.innerHTML = '';
            players.forEach((pName, idx) => {
                const row = document.createElement('div');
                row.className = 'mimic-player-chip';
                row.innerHTML = `
                    <span style="font-size: 1.3rem;">${AVATARS[idx % AVATARS.length]}</span>
                    <input type="text" value="${pName}" class="mimic-chip-input" data-index="${idx}" placeholder="ชื่อผู้เล่น">
                    ${players.length > 2 ? `<button class="mimic-chip-del" data-index="${idx}" title="ลบคนนี้">×</button>` : ''}
                `;
                playersListContainer.appendChild(row);
            });

            // Bind input change
            playersListContainer.querySelectorAll('.mimic-chip-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const idx = parseInt(e.target.dataset.index, 10);
                    players[idx] = e.target.value.trim() || `ผู้เล่น ${idx + 1}`;
                });
            });

            // Bind delete button
            playersListContainer.querySelectorAll('.mimic-chip-del').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.index, 10);
                    if (players.length > 2) {
                        players.splice(idx, 1);
                        renderPlayersSetup();
                    }
                });
            });
        }

        if (btnRandomPrompt) {
            btnRandomPrompt.addEventListener('click', setRandomPrompt);
        }

        if (btnAddPlayer) {
            btnAddPlayer.addEventListener('click', () => {
                if (players.length >= 8) {
                    alert('ใส่ผู้เล่นได้สูงสุด 8 คนครับ');
                    return;
                }
                const defaultNames = ["น้องโฟกัส", "น้องข้าวหอม", "น้องบอส", "น้องน้ำ", "น้องวิน", "น้องพีช"];
                const nextName = defaultNames[players.length % defaultNames.length] || `ผู้เล่น ${players.length + 1}`;
                players.push(nextName);
                renderPlayersSetup();
            });
        }

        if (btnStartGame) {
            btnStartGame.addEventListener('click', () => {
                currentPromptText = (promptInput ? promptInput.value.trim() : "") || "ยายกินลำไย น้ำลายยายไหลย้อย";
                if (players.length < 2) {
                    alert('ต้องมีผู้เล่นอย่างน้อย 2 คนครับ');
                    return;
                }
                startRecordingSession();
            });
        }

        // --- RECORDING SESSION LOGIC ---
        function startRecordingSession() {
            currentStep = "record";
            currentTurnIndex = 0;
            playerRecordings = [];
            currentTempAudioUrl = null;

            if (viewSetup) viewSetup.style.display = 'none';
            if (viewSummary) viewSummary.style.display = 'none';
            if (viewRecord) viewRecord.style.display = 'flex';

            loadTurn(0);
        }

        function loadTurn(index) {
            currentTurnIndex = index;
            currentTempAudioUrl = null;
            if (playbackReviewBox) playbackReviewBox.style.display = 'none';
            if (btnRecordToggle) {
                btnRecordToggle.innerHTML = '<span>🎙️ กดเพื่อเริ่มอัดเสียง</span>';
                btnRecordToggle.classList.remove('recording');
                btnRecordToggle.style.display = 'inline-flex';
            }
            if (recordTimerDisplay) recordTimerDisplay.textContent = '00:00';
            if (recordPulseRing) recordPulseRing.classList.remove('active');

            const pName = players[currentTurnIndex];
            if (turnBadge) turnBadge.textContent = `คนที่ ${currentTurnIndex + 1} / ${players.length}`;
            if (currentPlayerNameDisplay) currentPlayerNameDisplay.textContent = pName;
            if (currentPlayerAvatar) currentPlayerAvatar.textContent = AVATARS[currentTurnIndex % AVATARS.length];

            // Player 1 vs Next Players
            if (currentTurnIndex === 0) {
                // First player sees and hears the original prompt
                if (promptOriginalBox) promptOriginalBox.style.display = 'block';
                if (promptOriginalText) promptOriginalText.textContent = `"${currentPromptText}"`;
                if (btnListenPrompt) btnListenPrompt.style.display = 'inline-flex';
                if (btnListenPrevious) btnListenPrevious.style.display = 'none';
            } else {
                // Later players DO NOT see the prompt! They only listen to the previous player
                if (promptOriginalBox) promptOriginalBox.style.display = 'none';
                if (btnListenPrompt) btnListenPrompt.style.display = 'none';
                if (btnListenPrevious) {
                    btnListenPrevious.style.display = 'inline-flex';
                    const prevPlayerName = players[currentTurnIndex - 1];
                    btnListenPrevious.innerHTML = `<span>👂 ฟังเสียงจาก "${prevPlayerName}"</span>`;
                }
            }
        }

        // Audio Recording Functions
        async function startRecording() {
            try {
                if (!mediaStream) {
                    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                }
                audioChunks = [];
                let mimeType = 'audio/webm';
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    mimeType = 'audio/webm;codecs=opus';
                } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                    mimeType = 'audio/ogg';
                }

                mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: mimeType });
                    currentTempAudioUrl = URL.createObjectURL(audioBlob);
                    showReviewUI();
                };

                mediaRecorder.start();
                isRecording = true;
                recordSeconds = 0;
                if (btnRecordToggle) {
                    btnRecordToggle.innerHTML = '<span>⏹️ กดเพื่อหยุดอัด</span>';
                    btnRecordToggle.classList.add('recording');
                }
                if (recordPulseRing) recordPulseRing.classList.add('active');

                // Timer
                clearInterval(recordTimer);
                recordTimer = setInterval(() => {
                    recordSeconds++;
                    const secs = recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds;
                    if (recordTimerDisplay) recordTimerDisplay.textContent = `00:${secs}`;
                    if (recordSeconds >= MAX_RECORD_SECONDS) {
                        stopRecording();
                    }
                }, 1000);

            } catch (err) {
                console.warn('Microphone error:', err);
                alert('ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาอนุญาตการใช้ไมโครโฟนในเบราว์เซอร์ครับ');
            }
        }

        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            isRecording = false;
            clearInterval(recordTimer);
            if (recordPulseRing) recordPulseRing.classList.remove('active');
        }

        function showReviewUI() {
            if (btnRecordToggle) btnRecordToggle.style.display = 'none';
            if (playbackReviewBox) playbackReviewBox.style.display = 'flex';
        }

        if (btnRecordToggle) {
            btnRecordToggle.addEventListener('click', () => {
                if (!isRecording) startRecording();
                else stopRecording();
            });
        }

        // Review Actions
        if (btnReviewPlay) {
            btnReviewPlay.addEventListener('click', () => {
                if (!currentTempAudioUrl) return;
                const audio = new Audio(currentTempAudioUrl);
                btnReviewPlay.innerHTML = '<span>🔊 กำลังเล่น...</span>';
                audio.play();
                audio.onended = () => {
                    btnReviewPlay.innerHTML = '<span>▶️ ลองฟังเสียงตัวเอง</span>';
                };
            });
        }

        if (btnReviewRerecord) {
            btnReviewRerecord.addEventListener('click', () => {
                currentTempAudioUrl = null;
                if (playbackReviewBox) playbackReviewBox.style.display = 'none';
                if (btnRecordToggle) {
                    btnRecordToggle.innerHTML = '<span>🎙️ กดเพื่อเริ่มอัดเสียง</span>';
                    btnRecordToggle.classList.remove('recording');
                    btnRecordToggle.style.display = 'inline-flex';
                }
                if (recordTimerDisplay) recordTimerDisplay.textContent = '00:00';
            });
        }

        if (btnListenPrompt) {
            btnListenPrompt.addEventListener('click', () => {
                btnListenPrompt.innerHTML = '<span>🔊 กำลังอ่านโจทย์...</span>';
                speakOriginal(currentPromptText, () => {
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
                    btnListenPrevious.innerHTML = '<span>🔊 กำลังฟัง...</span>';
                    audio.play();
                    audio.onended = () => {
                        const prevName = players[currentTurnIndex - 1];
                        btnListenPrevious.innerHTML = `<span>👂 ฟังเสียงจาก "${prevName}" อีกครั้ง</span>`;
                    };
                }
            });
        }

        if (btnNextTurn) {
            btnNextTurn.addEventListener('click', () => {
                if (!currentTempAudioUrl) return;
                
                // Save current player's recording
                playerRecordings.push({
                    name: players[currentTurnIndex],
                    avatar: AVATARS[currentTurnIndex % AVATARS.length],
                    audioUrl: currentTempAudioUrl,
                    turn: currentTurnIndex + 1
                });

                // Next player or Finish
                if (currentTurnIndex + 1 < players.length) {
                    loadTurn(currentTurnIndex + 1);
                } else {
                    finishAndShowSummary();
                }
            });
        }

        // --- SUMMARY & CHAIN REVEAL LOGIC ---
        function finishAndShowSummary() {
            currentStep = "summary";
            if (viewRecord) viewRecord.style.display = 'none';
            if (viewSetup) viewSetup.style.display = 'none';
            if (viewSummary) viewSummary.style.display = 'flex';

            if (promptSummaryText) promptSummaryText.textContent = `"${currentPromptText}"`;
            renderSummaryCards();
        }

        function renderSummaryCards(highlightIndex = -1) {
            if (!summaryChainContainer) return;
            summaryChainContainer.innerHTML = '';

            // 1. Original Card
            const origCard = document.createElement('div');
            origCard.className = 'mimic-summary-card' + (highlightIndex === -1 && isChainPlaying ? ' active-playing' : '');
            origCard.innerHTML = `
                <div class="mimic-sc-avatar">👑</div>
                <div class="mimic-sc-name">เสียงต้นฉบับ</div>
                <button class="btn mimic-sc-play-btn" id="btn-play-orig-single">🔊 ฟังเสียง</button>
            `;
            summaryChainContainer.appendChild(origCard);

            const btnPlayOrigSingle = origCard.querySelector('#btn-play-orig-single');
            if (btnPlayOrigSingle) {
                btnPlayOrigSingle.addEventListener('click', () => {
                    speakOriginal(currentPromptText);
                });
            }

            // Arrow
            const arrow1 = document.createElement('div');
            arrow1.className = 'mimic-sc-arrow';
            arrow1.textContent = '➔';
            summaryChainContainer.appendChild(arrow1);

            // 2. Players Cards in Order
            playerRecordings.forEach((rec, idx) => {
                const card = document.createElement('div');
                card.className = 'mimic-summary-card' + (highlightIndex === idx ? ' active-playing' : '');
                card.id = `mimic-card-${idx}`;
                card.innerHTML = `
                    <div class="mimic-sc-avatar">${rec.avatar}</div>
                    <div class="mimic-sc-name">${rec.name}</div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">คนที่ ${rec.turn}</div>
                    <button class="btn mimic-sc-play-btn" data-index="${idx}">▶️ ฟังเสียง</button>
                `;
                summaryChainContainer.appendChild(card);

                // Individual play button
                const btnSingle = card.querySelector(`[data-index="${idx}"]`);
                if (btnSingle) {
                    btnSingle.addEventListener('click', () => {
                        playSingleAudio(idx);
                    });
                }

                // Arrow between cards
                if (idx < playerRecordings.length - 1) {
                    const arrow = document.createElement('div');
                    arrow.className = 'mimic-sc-arrow';
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
                btnPlayChain.innerHTML = '<span>▶️ ฟังเสียงทุกคนเรียงกัน (Play Chain)</span>';
                btnPlayChain.classList.remove('playing');
            }
        }

        // Play entire chain sequentially: Original -> P1 -> P2 -> P3 ...
        function startChainPlayback() {
            if (isChainPlaying) {
                stopChainPlayback();
                renderSummaryCards(-99);
                return;
            }

            isChainPlaying = true;
            if (btnPlayChain) {
                btnPlayChain.innerHTML = '<span>⏹️ กำลังเล่นเสียงต่อเนื่อง... (คลิกเพื่อหยุด)</span>';
                btnPlayChain.classList.add('playing');
            }

            // Step 0: Play Original speech
            renderSummaryCards(-1); // Highlight Original
            speakOriginal(currentPromptText, () => {
                if (!isChainPlaying) return;
                playChainStep(0);
            });
        }

        function playChainStep(index) {
            if (!isChainPlaying) return;
            if (index >= playerRecordings.length) {
                // Done!
                stopChainPlayback();
                renderSummaryCards(-99);
                return;
            }

            renderSummaryCards(index); // Highlight current player card
            const rec = playerRecordings[index];
            chainAudioObj = new Audio(rec.audioUrl);
            chainAudioObj.play().catch(e => console.warn(e));

            chainAudioObj.onended = () => {
                if (!isChainPlaying) return;
                setTimeout(() => {
                    playChainStep(index + 1);
                }, 500); // 0.5s pause between players
            };
        }

        if (btnPlayChain) {
            btnPlayChain.addEventListener('click', startChainPlayback);
        }

        if (btnRestartGame) {
            btnRestartGame.addEventListener('click', () => {
                stopChainPlayback();
                if (viewSummary) viewSummary.style.display = 'none';
                if (viewRecord) viewRecord.style.display = 'none';
                if (viewSetup) viewSetup.style.display = 'flex';
                setRandomPrompt();
            });
        }

        // Initialize setup
        setRandomPrompt();
        renderPlayersSetup();
    });
})();
