/**
 * Mimic Party - Audio-Only Funny/Meme Sound Prompts & Custom Voice Prompt Creator
 * - โจทย์มีเฉพาะเสียง (ไม่มีข้อความให้อ่าน)
 * - สร้างโจทย์เองด้วยเสียงพูดตัวเอง + ตั้งชื่อโจทย์ได้
 * - อัดเสียงได้เทคเดียว (ไม่มีปุ่มอัดซ้ำ)
 */
(function () {
    const AVATARS = ["🐶", "🐱", "🐼", "🦊", "🐸", "🦁", "🐰", "🐨", "🐯", "🦄", "🐵", "🐧"];
    const CUSTOM_STORAGE_KEY = "mimic_custom_voice_prompts_v1";
    const MAX_RECORD_SECONDS = 6;

    // Load saved custom voice prompts from localStorage
    let customPrompts = [];
    try {
        const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) customPrompts = parsed;
        }
    } catch (e) {
        customPrompts = [];
    }

    function saveCustomPromptsToStorage() {
        try {
            localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customPrompts));
        } catch (e) {
            console.warn("Storage full or unavailable:", e);
        }
    }

    function getAllPrompts() {
        return [...customPrompts, ...(typeof MIMIC_PROMPTS !== "undefined" ? MIMIC_PROMPTS : [])];
    }

    // Active State
    let activePrompt = getAllPrompts()[0] || {
        id: "meme_1",
        title: "เสียงตดทะลุประตู 💨",
        category: "มีมสุดฮา",
        emoji: "💨",
        audioUrl: "https://actions.google.com/sounds/v1/cartoon/fart_long_through_door.ogg"
    };

    let players = [
        { name: "คนที่ 1", avatarIdx: 0 },
        { name: "คนที่ 2", avatarIdx: 1 },
        { name: "คนที่ 3", avatarIdx: 2 },
        { name: "คนที่ 4", avatarIdx: 3 }
    ];

    let currentTurnIndex = 0;
    let playerRecordings = [];
    let currentTurnAudioUrl = null;

    // Audio & Mic State
    let audioCtx = null;
    let activeAudioObj = null;
    let mediaStream = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let recordTimer = null;
    let recordSeconds = 0;

    // Custom Creator Recording State
    let isCustomRecording = false;
    let customRecorder = null;
    let customChunks = [];
    let customRecordedDataUrl = null;
    let customRecordTimer = null;
    let customRecordSeconds = 0;

    // Waveform State
    let waveCanvas = null;
    let waveCtx = null;
    let waveAnimId = null;
    let isSimulatingWave = false;

    // Chain Playback State
    let isChainPlaying = false;

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playBeep(freq = 660, duration = 0.12, type = "sine", vol = 0.18) {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    function stopCurrentAudio() {
        if (activeAudioObj) {
            activeAudioObj.pause();
            activeAudioObj.currentTime = 0;
            activeAudioObj = null;
        }
        stopSimulatedWave();
    }

    function playAudioUrl(url, onEndedCallback = null, withWave = false) {
        stopCurrentAudio();
        if (!url) {
            if (onEndedCallback) onEndedCallback();
            return;
        }
        const audio = new Audio(url);
        activeAudioObj = audio;
        if (withWave) startSimulatedWave();

        audio.onended = () => {
            if (withWave) stopSimulatedWave();
            activeAudioObj = null;
            if (onEndedCallback) onEndedCallback();
        };
        audio.onerror = () => {
            if (withWave) stopSimulatedWave();
            activeAudioObj = null;
            if (onEndedCallback) onEndedCallback();
        };
        audio.play().catch(() => {
            if (withWave) stopSimulatedWave();
            if (onEndedCallback) onEndedCallback();
        });
    }

    // --- WAVEFORM CANVAS ---
    function drawIdleWave() {
        if (!waveCanvas || !waveCtx) return;
        const w = waveCanvas.width;
        const h = waveCanvas.height;
        waveCtx.clearRect(0, 0, w, h);

        const barCount = 30;
        const gap = 5;
        const barWidth = (w - gap * (barCount - 1)) / barCount;

        for (let i = 0; i < barCount; i++) {
            const barH = 8 + Math.sin(i * 0.45) * 4;
            const x = i * (barWidth + gap);
            const y = (h - barH) / 2;
            waveCtx.fillStyle = "#cbd5e1";
            waveCtx.beginPath();
            waveCtx.roundRect(x, y, barWidth, barH, 4);
            waveCtx.fill();
        }
    }

    function startLiveMicVisualizer(stream) {
        try {
            const ctx = getAudioCtx();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function renderFrame() {
                if (!isRecording) {
                    drawIdleWave();
                    return;
                }
                waveAnimId = requestAnimationFrame(renderFrame);
                analyser.getByteFrequencyData(dataArray);

                if (!waveCanvas || !waveCtx) return;
                const w = waveCanvas.width;
                const h = waveCanvas.height;
                waveCtx.clearRect(0, 0, w, h);

                const barCount = 30;
                const gap = 5;
                const barWidth = (w - gap * (barCount - 1)) / barCount;

                for (let i = 0; i < barCount; i++) {
                    const val = dataArray[i % bufferLength] || 0;
                    const barH = Math.max(8, (val / 255) * (h - 6));
                    const x = i * (barWidth + gap);
                    const y = (h - barH) / 2;
                    waveCtx.fillStyle = i % 2 === 0 ? "#3b82f6" : "#8b5cf6";
                    waveCtx.beginPath();
                    waveCtx.roundRect(x, y, barWidth, barH, 4);
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
        let tick = 0;
        function simFrame() {
            if (!isSimulatingWave) {
                drawIdleWave();
                return;
            }
            waveAnimId = requestAnimationFrame(simFrame);
            tick += 0.2;
            if (!waveCanvas || !waveCtx) return;
            const w = waveCanvas.width;
            const h = waveCanvas.height;
            waveCtx.clearRect(0, 0, w, h);

            const barCount = 30;
            const gap = 5;
            const barWidth = (w - gap * (barCount - 1)) / barCount;

            for (let i = 0; i < barCount; i++) {
                const wave = Math.abs(Math.sin(tick + i * 0.4)) * Math.abs(Math.cos(tick * 0.6 - i * 0.2));
                const barH = Math.max(8, wave * (h - 8));
                const x = i * (barWidth + gap);
                const y = (h - barH) / 2;
                waveCtx.fillStyle = "#3b82f6";
                waveCtx.beginPath();
                waveCtx.roundRect(x, y, barWidth, barH, 4);
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

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        // Views
        const viewSetup = document.getElementById("mimic-view-setup");
        const viewRecord = document.getElementById("mimic-view-record");
        const viewSummary = document.getElementById("mimic-view-summary");

        // Setup Tabs & Prompt Selector
        const tabPreset = document.getElementById("mimic-tab-preset");
        const tabCustom = document.getElementById("mimic-tab-custom");
        const presetPane = document.getElementById("mimic-preset-pane");
        const customPane = document.getElementById("mimic-custom-pane");

        const activeEmojiEl = document.getElementById("mimic-active-emoji");
        const activeCatEl = document.getElementById("mimic-active-cat");
        const activeTitleEl = document.getElementById("mimic-active-title");
        const btnPreviewSound = document.getElementById("mimic-btn-preview-sound");
        const btnRandomSound = document.getElementById("mimic-btn-random-sound");
        const soundGridEl = document.getElementById("mimic-sound-grid");

        // Custom Voice Creator Elements
        const customTitleInput = document.getElementById("mimic-custom-title");
        const btnCustomRec = document.getElementById("mimic-btn-custom-rec");
        const customRecStatus = document.getElementById("mimic-custom-rec-status");
        const customPreviewRow = document.getElementById("mimic-custom-preview-row");
        const btnCustomPlay = document.getElementById("mimic-btn-custom-play");
        const btnCustomSave = document.getElementById("mimic-btn-custom-save");

        // Players Setup
        const playersListEl = document.getElementById("mimic-players-list");
        const btnAddPlayer = document.getElementById("mimic-btn-add-player");
        const btnStartGame = document.getElementById("mimic-btn-start-game");

        // Turn Recording Elements
        const cdOverlay = document.getElementById("mimic-cd-overlay");
        const cdText = document.getElementById("mimic-cd-text");
        const turnBadge = document.getElementById("mimic-turn-badge");
        const btnBackSetup = document.getElementById("mimic-btn-back-setup");
        const playerAvatarEl = document.getElementById("mimic-player-avatar");
        const playerNameEl = document.getElementById("mimic-player-name");
        const missionHintEl = document.getElementById("mimic-mission-hint");
        const btnListenRef = document.getElementById("mimic-btn-listen-ref");
        const monitorStatusEl = document.getElementById("mimic-monitor-status");
        const recordTimerEl = document.getElementById("mimic-record-timer");
        const recordActionArea = document.getElementById("mimic-record-action-area");
        const btnRecordToggle = document.getElementById("mimic-btn-record-toggle");
        const reviewBox = document.getElementById("mimic-review-box");
        const btnReviewPlay = document.getElementById("mimic-btn-review-play");
        const btnNextTurn = document.getElementById("mimic-btn-next-turn");

        waveCanvas = document.getElementById("mimic-wave-canvas");
        if (waveCanvas) {
            waveCtx = waveCanvas.getContext("2d");
            drawIdleWave();
        }

        // Summary Elements
        const summaryTitleEl = document.getElementById("mimic-summary-title");
        const btnPlayChain = document.getElementById("mimic-btn-play-chain");
        const summaryChainEl = document.getElementById("mimic-summary-chain");
        const btnRestart = document.getElementById("mimic-btn-restart");

        // --- TABS IN SETUP ---
        function switchSetupTab(mode) {
            stopCurrentAudio();
            if (mode === "custom") {
                tabPreset.classList.remove("active");
                tabCustom.classList.add("active");
                presetPane.style.display = "none";
                customPane.style.display = "block";
                // Reset custom creator for a fresh single-take recording
                customRecordedDataUrl = null;
                if (customPreviewRow) customPreviewRow.style.display = "none";
                if (btnCustomRec) {
                    btnCustomRec.disabled = false;
                    btnCustomRec.textContent = "🎙️ กดอัดเสียงต้นฉบับ (เทคเดียว)";
                }
                if (customRecStatus) customRecStatus.textContent = "ยังไม่ได้อัดเสียงต้นฉบับ";
            } else {
                tabCustom.classList.remove("active");
                tabPreset.classList.add("active");
                customPane.style.display = "none";
                presetPane.style.display = "block";
            }
        }

        if (tabPreset) tabPreset.addEventListener("click", () => switchSetupTab("preset"));
        if (tabCustom) tabCustom.addEventListener("click", () => switchSetupTab("custom"));

        // --- RENDER ACTIVE SOUND & SOUND GRID ---
        function updateActiveSoundUI() {
            if (!activePrompt) return;
            if (activeEmojiEl) activeEmojiEl.textContent = activePrompt.emoji || "🔊";
            if (activeCatEl) activeCatEl.textContent = activePrompt.category || "เสียงฮาๆ";
            if (activeTitleEl) activeTitleEl.textContent = activePrompt.title;
            renderSoundGrid();
        }

        function renderSoundGrid() {
            if (!soundGridEl) return;
            soundGridEl.innerHTML = "";
            const all = getAllPrompts();

            all.forEach((item) => {
                const btn = document.createElement("div");
                btn.className = "mimic-sound-item" + (activePrompt && activePrompt.id === item.id ? " selected" : "");

                const labelSpan = document.createElement("span");
                labelSpan.style.overflow = "hidden";
                labelSpan.style.textOverflow = "ellipsis";
                labelSpan.style.whiteSpace = "nowrap";
                labelSpan.textContent = `${item.emoji || "🎙️"} ${item.title}`;
                btn.appendChild(labelSpan);

                if (item.isCustom) {
                    const delBtn = document.createElement("button");
                    delBtn.type = "button";
                    delBtn.className = "mimic-sound-item-del";
                    delBtn.title = "ลบโจทย์เสียงนี้";
                    delBtn.textContent = "×";
                    delBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        customPrompts = customPrompts.filter((cp) => cp.id !== item.id);
                        saveCustomPromptsToStorage();
                        if (activePrompt && activePrompt.id === item.id) {
                            const remaining = getAllPrompts();
                            activePrompt = remaining[0];
                        }
                        updateActiveSoundUI();
                    });
                    btn.appendChild(delBtn);
                }

                btn.addEventListener("click", () => {
                    activePrompt = item;
                    updateActiveSoundUI();
                    playAudioUrl(activePrompt.audioUrl);
                });

                soundGridEl.appendChild(btn);
            });
        }

        function pickRandomSound(autoPlay = true) {
            const all = getAllPrompts();
            if (all.length === 0) return;
            let candidates = all.filter((p) => !activePrompt || p.id !== activePrompt.id);
            if (candidates.length === 0) candidates = all;
            activePrompt = candidates[Math.floor(Math.random() * candidates.length)];
            updateActiveSoundUI();
            if (autoPlay) {
                playAudioUrl(activePrompt.audioUrl);
            }
        }

        if (btnPreviewSound) {
            btnPreviewSound.addEventListener("click", () => {
                if (!activePrompt) return;
                btnPreviewSound.textContent = "🔊 กำลังเล่นเสียง...";
                playAudioUrl(activePrompt.audioUrl, () => {
                    btnPreviewSound.textContent = "🔊 ฟังเสียงโจทย์";
                });
            });
        }

        if (btnRandomSound) {
            btnRandomSound.addEventListener("click", () => pickRandomSound(true));
        }

        // --- CUSTOM VOICE PROMPT CREATOR (ONE-TAKE) ---
        if (btnCustomRec) {
            btnCustomRec.addEventListener("click", async () => {
                stopCurrentAudio();
                if (!isCustomRecording) {
                    // Single-take check: if already recorded in this session, don't allow re-record
                    if (customRecordedDataUrl) return;
                    try {
                        if (!mediaStream) {
                            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        }
                        customChunks = [];
                        customRecorder = new MediaRecorder(mediaStream);
                        customRecorder.ondataavailable = (e) => {
                            if (e.data && e.data.size > 0) customChunks.push(e.data);
                        };
                        customRecorder.onstop = async () => {
                            const blob = new Blob(customChunks, { type: customRecorder.mimeType || "audio/webm" });
                            customRecordedDataUrl = await blobToDataURL(blob);
                            isCustomRecording = false;
                            clearInterval(customRecordTimer);
                            btnCustomRec.textContent = "✅ อัดเสียงต้นฉบับแล้ว (เทคเดียว)";
                            btnCustomRec.disabled = true;
                            if (customRecStatus) customRecStatus.textContent = "อัดเสียงสำเร็จ! กดบันทึกเพื่อใช้เป็นโจทย์ได้เลย";
                            if (customPreviewRow) customPreviewRow.style.display = "flex";
                        };

                        customRecorder.start();
                        isCustomRecording = true;
                        customRecordSeconds = 0;
                        btnCustomRec.textContent = "⏹️ พูดเสร็จแล้ว กดหยุด!";
                        if (customRecStatus) customRecStatus.textContent = "🔴 กำลังอัดเสียงต้นฉบับ... (สูงสุด 6 วินาที)";

                        clearInterval(customRecordTimer);
                        customRecordTimer = setInterval(() => {
                            customRecordSeconds++;
                            if (customRecordSeconds >= MAX_RECORD_SECONDS) {
                                if (customRecorder && customRecorder.state !== "inactive") {
                                    customRecorder.stop();
                                }
                            }
                        }, 1000);
                    } catch (err) {
                        alert("กรุณาอนุญาตการใช้ไมโครโฟน (Allow Microphone) เพื่ออัดเสียงครับ");
                    }
                } else {
                    if (customRecorder && customRecorder.state !== "inactive") {
                        customRecorder.stop();
                    }
                }
            });
        }

        if (btnCustomPlay) {
            btnCustomPlay.addEventListener("click", () => {
                if (!customRecordedDataUrl) return;
                btnCustomPlay.textContent = "🔊 กำลังฟัง...";
                playAudioUrl(customRecordedDataUrl, () => {
                    btnCustomPlay.textContent = "▶️ ลองฟังเสียงที่อัด";
                });
            });
        }

        if (btnCustomSave) {
            btnCustomSave.addEventListener("click", () => {
                if (!customRecordedDataUrl) {
                    alert("กรุณากดอัดเสียงต้นฉบับก่อนครับ!");
                    return;
                }
                const titleVal = (customTitleInput ? customTitleInput.value.trim() : "") || `เสียงโจทย์สร้างเอง #${customPrompts.length + 1}`;
                const newCustomPrompt = {
                    id: "custom_" + Date.now(),
                    title: titleVal,
                    category: "โจทย์เสียงของคุณ",
                    emoji: "🎙️",
                    audioUrl: customRecordedDataUrl,
                    isCustom: true
                };
                customPrompts.unshift(newCustomPrompt);
                saveCustomPromptsToStorage();
                activePrompt = newCustomPrompt;
                if (customTitleInput) customTitleInput.value = "";
                updateActiveSoundUI();
                switchSetupTab("preset");
            });
        }

        // --- PLAYERS SETUP ---
        function renderPlayersSetup() {
            if (!playersListEl) return;
            playersListEl.innerHTML = "";

            players.forEach((p, idx) => {
                const card = document.createElement("div");
                card.className = "mimic-player-card";
                const emoji = AVATARS[p.avatarIdx % AVATARS.length];

                card.innerHTML = `
                    <span class="mimic-player-order">คิวที่ ${idx + 1}</span>
                    ${players.length > 2 ? `<button type="button" class="mimic-player-del" data-del="${idx}" title="ลบผู้เล่น">×</button>` : ""}
                    <button type="button" class="mimic-avatar-btn" data-avatar="${idx}" title="คลิกเพื่อเปลี่ยนไอคอน">${emoji}</button>
                    <input type="text" class="mimic-player-name-inp" data-name="${idx}" value="${p.name}" placeholder="ชื่อผู้เล่น">
                `;
                playersListEl.appendChild(card);
            });

            playersListEl.querySelectorAll("[data-avatar]").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute("data-avatar"), 10);
                    players[idx].avatarIdx = (players[idx].avatarIdx + 1) % AVATARS.length;
                    renderPlayersSetup();
                });
            });

            playersListEl.querySelectorAll("[data-name]").forEach((inp) => {
                inp.addEventListener("input", (e) => {
                    const idx = parseInt(e.target.getAttribute("data-name"), 10);
                    players[idx].name = e.target.value.trim() || `คนที่ ${idx + 1}`;
                });
            });

            playersListEl.querySelectorAll("[data-del]").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute("data-del"), 10);
                    if (players.length > 2) {
                        players.splice(idx, 1);
                        renderPlayersSetup();
                    }
                });
            });
        }

        if (btnAddPlayer) {
            btnAddPlayer.addEventListener("click", () => {
                if (players.length >= 8) {
                    alert("เพิ่มผู้เล่นได้สูงสุด 8 คนครับ");
                    return;
                }
                const nextNum = players.length + 1;
                players.push({
                    name: `คนที่ ${nextNum}`,
                    avatarIdx: (nextNum - 1) % AVATARS.length
                });
                renderPlayersSetup();
            });
        }

        // --- STAGE 2: SINGLE-TAKE TURN RECORDING ---
        if (btnStartGame) {
            btnStartGame.addEventListener("click", () => {
                stopCurrentAudio();
                currentTurnIndex = 0;
                playerRecordings = [];
                currentTurnAudioUrl = null;

                if (viewSetup) viewSetup.style.display = "none";
                if (viewSummary) viewSummary.style.display = "none";
                if (viewRecord) viewRecord.style.display = "flex";

                loadTurn(0);
            });
        }

        if (btnBackSetup) {
            btnBackSetup.addEventListener("click", () => {
                stopTurnRecording();
                stopCurrentAudio();
                if (viewRecord) viewRecord.style.display = "none";
                if (viewSummary) viewSummary.style.display = "none";
                if (viewSetup) viewSetup.style.display = "flex";
            });
        }

        function loadTurn(index) {
            currentTurnIndex = index;
            currentTurnAudioUrl = null;
            stopCurrentAudio();
            drawIdleWave();

            const p = players[currentTurnIndex];
            const emoji = AVATARS[p.avatarIdx % AVATARS.length];

            if (turnBadge) turnBadge.textContent = `คิวที่ ${currentTurnIndex + 1} / ${players.length}`;
            if (playerAvatarEl) playerAvatarEl.textContent = emoji;
            if (playerNameEl) playerNameEl.textContent = p.name;

            if (currentTurnIndex === 0) {
                if (missionHintEl) {
                    missionHintEl.textContent = "🎧 คิวคนแรก: กดฟังเสียงโจทย์ต้นฉบับ แล้วอัดเสียงพูดตาม (เทคเดียว!)";
                }
                if (btnListenRef) {
                    btnListenRef.textContent = "🔊 กดฟังเสียงโจทย์ต้นฉบับ";
                }
            } else {
                const prevPlayer = players[currentTurnIndex - 1];
                if (missionHintEl) {
                    missionHintEl.textContent = `🎧 ฟังเสียงจาก "${prevPlayer.name}" แล้วพูดตามในเทคเดียว!`;
                }
                if (btnListenRef) {
                    btnListenRef.textContent = `👂 กดฟังเสียงของ "${prevPlayer.name}"`;
                }
            }

            if (monitorStatusEl) monitorStatusEl.textContent = "พร้อมอัดเสียง (มีโอกาสอัดแค่เทคเดียว!)";
            if (recordTimerEl) recordTimerEl.textContent = `00:00 / 00:0${MAX_RECORD_SECONDS}`;

            if (recordActionArea) recordActionArea.style.display = "block";
            if (btnRecordToggle) {
                btnRecordToggle.disabled = false;
                btnRecordToggle.className = "btn danger mimic-btn-xl";
                btnRecordToggle.textContent = "🎙️ กดเพื่ออัดเสียง (เทคเดียว!)";
            }
            if (reviewBox) reviewBox.style.display = "none";
        }

        if (btnListenRef) {
            btnListenRef.addEventListener("click", () => {
                if (isRecording) return;
                if (currentTurnIndex === 0) {
                    btnListenRef.textContent = "🔊 กำลังเล่นเสียงต้นฉบับ...";
                    playAudioUrl(activePrompt.audioUrl, () => {
                        btnListenRef.textContent = "🔊 กดฟังเสียงโจทย์ต้นฉบับอีกครั้ง";
                    }, true);
                } else {
                    const prevRec = playerRecordings[currentTurnIndex - 1];
                    if (!prevRec) return;
                    btnListenRef.textContent = `🔊 กำลังเล่นเสียงของ "${prevRec.name}"...`;
                    playAudioUrl(prevRec.audioUrl, () => {
                        btnListenRef.textContent = `👂 กดฟังเสียงของ "${prevRec.name}" อีกครั้ง`;
                    }, true);
                }
            });
        }

        function triggerCountdownAndRecord() {
            if (!cdOverlay || !cdText) {
                startTurnRecording();
                return;
            }
            cdOverlay.style.display = "flex";
            const steps = ["3", "2", "1", "พูดเลย! 🎙️"];
            let idx = 0;

            function stepFn() {
                if (idx >= steps.length) {
                    cdOverlay.style.display = "none";
                    startTurnRecording();
                    return;
                }
                cdText.textContent = steps[idx];
                playBeep(idx === steps.length - 1 ? 880 : 440, 0.14);
                idx++;
                setTimeout(stepFn, 450);
            }
            stepFn();
        }

        async function startTurnRecording() {
            try {
                if (!mediaStream) {
                    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                }
                audioChunks = [];
                mediaRecorder = new MediaRecorder(mediaStream);
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) audioChunks.push(e.data);
                };
                mediaRecorder.onstop = () => {
                    const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
                    currentTurnAudioUrl = URL.createObjectURL(blob);
                    lockInSingleTake();
                };

                mediaRecorder.start();
                isRecording = true;
                recordSeconds = 0;

                if (btnRecordToggle) {
                    btnRecordToggle.className = "btn primary mimic-btn-xl";
                    btnRecordToggle.textContent = "⏹️ พูดเสร็จแล้ว กดหยุด!";
                }
                if (monitorStatusEl) monitorStatusEl.textContent = "🔴 กำลังอัดเสียงสด... (เทคเดียว!)";

                startLiveMicVisualizer(mediaStream);

                clearInterval(recordTimer);
                recordTimer = setInterval(() => {
                    recordSeconds++;
                    if (recordTimerEl) {
                        recordTimerEl.textContent = `00:0${recordSeconds} / 00:0${MAX_RECORD_SECONDS}`;
                    }
                    if (recordSeconds >= MAX_RECORD_SECONDS) {
                        stopTurnRecording();
                    }
                }, 1000);
            } catch (err) {
                alert("กรุณาอนุญาตการใช้ไมโครโฟนเพื่ออัดเสียงครับ");
            }
        }

        function stopTurnRecording() {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
            }
            isRecording = false;
            clearInterval(recordTimer);
            drawIdleWave();
        }

        function lockInSingleTake() {
            playBeep(784, 0.18);
            if (monitorStatusEl) monitorStatusEl.textContent = "✅ บันทึกเสียงเทคเดียวเรียบร้อย!";
            // Hide record button completely so player cannot re-record!
            if (recordActionArea) recordActionArea.style.display = "none";
            if (reviewBox) reviewBox.style.display = "flex";

            if (btnNextTurn) {
                if (currentTurnIndex + 1 < players.length) {
                    const nextP = players[currentTurnIndex + 1];
                    btnNextTurn.textContent = `ส่งต่อให้ "${nextP.name}" ➔`;
                } else {
                    btnNextTurn.textContent = "🎉 ครบทุกคนแล้ว! ไปดูสรุปเสียงกันเลย ➔";
                }
            }
        }

        if (btnRecordToggle) {
            btnRecordToggle.addEventListener("click", () => {
                stopCurrentAudio();
                if (!isRecording) {
                    // Single-take lock check
                    if (currentTurnAudioUrl) return;
                    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                        mediaStream = stream;
                        triggerCountdownAndRecord();
                    }).catch(() => {
                        alert("กรุณาอนุญาตการใช้ไมโครโฟนก่อนเริ่มอัดเสียงครับ");
                    });
                } else {
                    stopTurnRecording();
                }
            });
        }

        if (btnReviewPlay) {
            btnReviewPlay.addEventListener("click", () => {
                if (!currentTurnAudioUrl) return;
                btnReviewPlay.textContent = "🔊 กำลังฟัง...";
                playAudioUrl(currentTurnAudioUrl, () => {
                    btnReviewPlay.textContent = "▶️ ลองฟังเสียงที่อัดไป";
                }, true);
            });
        }

        if (btnNextTurn) {
            btnNextTurn.addEventListener("click", () => {
                if (!currentTurnAudioUrl) return;
                stopCurrentAudio();

                const p = players[currentTurnIndex];
                playerRecordings.push({
                    name: p.name,
                    avatar: AVATARS[p.avatarIdx % AVATARS.length],
                    audioUrl: currentTurnAudioUrl,
                    turn: currentTurnIndex + 1
                });

                if (currentTurnIndex + 1 < players.length) {
                    loadTurn(currentTurnIndex + 1);
                } else {
                    showSummaryView();
                }
            });
        }

        // --- STAGE 3: SUMMARY & PLAY ALL CHAIN ---
        function showSummaryView() {
            stopCurrentAudio();
            if (viewSetup) viewSetup.style.display = "none";
            if (viewRecord) viewRecord.style.display = "none";
            if (viewSummary) viewSummary.style.display = "flex";

            if (summaryTitleEl) {
                summaryTitleEl.textContent = `โจทย์เสียง: ${activePrompt.title}`;
            }
            renderSummaryChain(-99);
        }

        function renderSummaryChain(highlightIndex = -99) {
            if (!summaryChainEl) return;
            summaryChainEl.innerHTML = "";

            // 1. Original Sound Card
            const origCard = document.createElement("div");
            origCard.className = "mimic-chain-card" + (highlightIndex === -1 ? " active-playing" : "");
            origCard.innerHTML = `
                <span class="mimic-chain-step">ต้นฉบับ</span>
                <div class="mimic-chain-avatar">${activePrompt.emoji || "🔊"}</div>
                <div class="mimic-chain-name">${activePrompt.title}</div>
                <button type="button" class="btn secondary mimic-btn-sm" id="mimic-summary-play-orig" style="width: 100%; margin-top: 0.35rem;">
                    🔊 ฟังต้นฉบับ
                </button>
            `;
            summaryChainEl.appendChild(origCard);

            const btnPlayOrig = origCard.querySelector("#mimic-summary-play-orig");
            if (btnPlayOrig) {
                btnPlayOrig.addEventListener("click", () => {
                    stopChainPlayback();
                    renderSummaryChain(-1);
                    playAudioUrl(activePrompt.audioUrl, () => {
                        renderSummaryChain(-99);
                    });
                });
            }

            // 2. Player Recording Cards
            playerRecordings.forEach((rec, idx) => {
                const card = document.createElement("div");
                card.className = "mimic-chain-card" + (highlightIndex === idx ? " active-playing" : "");
                card.innerHTML = `
                    <span class="mimic-chain-step">คิวที่ ${rec.turn}</span>
                    <div class="mimic-chain-avatar">${rec.avatar}</div>
                    <div class="mimic-chain-name">${rec.name}</div>
                    <button type="button" class="btn primary mimic-btn-sm" data-play-rec="${idx}" style="width: 100%; margin-top: 0.35rem;">
                        ▶️ ฟังเสียง
                    </button>
                `;
                summaryChainEl.appendChild(card);

                const playBtn = card.querySelector(`[data-play-rec="${idx}"]`);
                if (playBtn) {
                    playBtn.addEventListener("click", () => {
                        stopChainPlayback();
                        renderSummaryChain(idx);
                        playAudioUrl(rec.audioUrl, () => {
                            renderSummaryChain(-99);
                        });
                    });
                }
            });
        }

        function stopChainPlayback() {
            isChainPlaying = false;
            stopCurrentAudio();
            if (btnPlayChain) {
                btnPlayChain.textContent = "▶️ เปิดฟังเสียงเรียงต่อกันตั้งแต่ต้นจนจบ!";
            }
        }

        function startChainPlayback() {
            if (isChainPlaying) {
                stopChainPlayback();
                renderSummaryChain(-99);
                return;
            }
            isChainPlaying = true;
            if (btnPlayChain) {
                btnPlayChain.textContent = "⏹️ หยุดเล่นเสียงต่อเนื่อง";
            }

            renderSummaryChain(-1);
            playAudioUrl(activePrompt.audioUrl, () => {
                if (!isChainPlaying) return;
                setTimeout(() => playChainStep(0), 400);
            });
        }

        function playChainStep(idx) {
            if (!isChainPlaying) return;
            if (idx >= playerRecordings.length) {
                stopChainPlayback();
                renderSummaryChain(-99);
                return;
            }
            renderSummaryChain(idx);
            const rec = playerRecordings[idx];
            playAudioUrl(rec.audioUrl, () => {
                if (!isChainPlaying) return;
                setTimeout(() => playChainStep(idx + 1), 400);
            });
        }

        if (btnPlayChain) {
            btnPlayChain.addEventListener("click", startChainPlayback);
        }

        if (btnRestart) {
            btnRestart.addEventListener("click", () => {
                stopChainPlayback();
                if (viewSummary) viewSummary.style.display = "none";
                if (viewRecord) viewRecord.style.display = "none";
                if (viewSetup) viewSetup.style.display = "flex";
                pickRandomSound(false);
            });
        }

        // Initialize Setup
        updateActiveSoundUI();
        renderPlayersSetup();
    });
})();
