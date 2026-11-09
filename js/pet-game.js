/**
 * pet-game.js - ระบบการทำงานของเกม "วัดใจแต้มสัตว์เลี้ยง" (Offline Host Controlled)
 * ผู้คุมเกมกดสลับมุมมอง หันจอให้ทีม A ดู, หันจอให้ทีม B ดู, จอผู้คุมแอบดู, และเปิดเฉลยพร้อมกัน
 */

(function () {
    // Web Audio API Synthesizer for rich SFX (ไม่ต้องดาวน์โหลดไฟล์เสียงภายนอก)
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // เสียง Flip การ์ด
    function playSfxFlip() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) { }
    }

    // เสียงเปิดเฉลยปะทะ Clash Showdown
    function playSfxClash() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            // Bass boom
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);

            // High shimmer
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(520, now);
            osc2.frequency.exponentialRampToValueAtTime(880, now + 0.3);
            gain2.gain.setValueAtTime(0.2, now);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now);
            osc2.stop(now + 0.3);
        } catch (e) { }
    }

    // เสียงชนะ Victory Fanfare
    function playSfxVictory() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const notes = [440, 554, 659, 880];
            notes.forEach((freq, idx) => {
                const now = ctx.currentTime + idx * 0.1;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            });
        } catch (e) { }
    }

    // เสียง Tick ถอยหลัง
    function playSfxTick(isUrgent = false) {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const now = ctx.currentTime;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isUrgent ? 900 : 500, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) { }
    }

    // Game State
    const state = {
        scoreA: 0,
        scoreB: 0,
        round: 1,
        viewMode: 'host', // 'host' | 'teamA' | 'teamB' | 'reveal'
        cardA: null, // { pet, special, action: 'none'|'fight'|'fold' }
        cardB: null,
        timerVal: 15,
        timerMax: 15,
        timerTimer: null,
        isTimerRunning: false
    };

    // Helper Format Number (e.g. 6,850)
    function fmtNum(n) {
        return Number(n).toLocaleString('en-US');
    }

    // เริ่มสุ่มรอบใหม่
    function newRound() {
        const petA = getRandomPetCard();
        const petB = getRandomPetCard(petA.id);
        const specA = getRandomSpecialCard();
        const specB = getRandomSpecialCard();

        state.cardA = { pet: petA, special: specA, action: 'none' };
        state.cardB = { pet: petB, special: specB, action: 'none' };
        state.viewMode = 'host';
        stopTimer();
        state.timerVal = state.timerMax;

        playSfxFlip();
        render();
    }

    // สุ่มเฉพาะการ์ดพิเศษใหม่
    function rerollSpecialCards() {
        if (!state.cardA || !state.cardB) return;
        state.cardA.special = getRandomSpecialCard();
        state.cardB.special = getRandomSpecialCard();
        playSfxFlip();
        render();
    }

    // สลับโหมดมุมมอง
    function setViewMode(mode) {
        state.viewMode = mode;
        if (mode === 'reveal') {
            playSfxClash();
            setTimeout(() => {
                const totalA = (state.cardA?.pet?.power || 0) + (state.cardA?.special?.val || 0);
                const totalB = (state.cardB?.pet?.power || 0) + (state.cardB?.special?.val || 0);
                if (totalA !== totalB) {
                    playSfxVictory();
                }
            }, 350);
        } else {
            playSfxFlip();
        }
        render();
    }

    // ตั้งค่า Action (สู้ หรือ หมอบ) ของแต่ละทีม
    function setTeamAction(team, action) {
        if (team === 'A' && state.cardA) {
            state.cardA.action = state.cardA.action === action ? 'none' : action;
        } else if (team === 'B' && state.cardB) {
            state.cardB.action = state.cardB.action === action ? 'none' : action;
        }
        render();
    }

    // ปรับคะแนน
    function changeScore(team, delta) {
        if (team === 'A') {
            state.scoreA = Math.max(0, state.scoreA + delta);
        } else if (team === 'B') {
            state.scoreB = Math.max(0, state.scoreB + delta);
        }
        renderScores();
    }

    function resetScores() {
        if (confirm('คุณต้องการรีเซ็ตคะแนนและรอบแข่งขันทั้งหมดใช่หรือไม่?')) {
            state.scoreA = 0;
            state.scoreB = 0;
            state.round = 1;
            renderScores();
        }
    }

    // ระบบจับเวลา
    function startTimer() {
        stopTimer();
        state.isTimerRunning = true;
        updateTimerDisplay();
        state.timerTimer = setInterval(() => {
            state.timerVal--;
            if (state.timerVal <= 0) {
                state.timerVal = 0;
                stopTimer();
                playSfxClash();
            } else {
                playSfxTick(state.timerVal <= 5);
            }
            updateTimerDisplay();
        }, 1000);
        updateTimerButtons();
    }

    function stopTimer() {
        if (state.timerTimer) {
            clearInterval(state.timerTimer);
            state.timerTimer = null;
        }
        state.isTimerRunning = false;
        updateTimerButtons();
    }

    function resetTimer() {
        stopTimer();
        const sel = document.getElementById('pet-timer-select');
        if (sel) state.timerMax = parseInt(sel.value, 10) || 15;
        state.timerVal = state.timerMax;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const timerNum = document.getElementById('pet-timer-num');
        const timerBar = document.getElementById('pet-timer-bar');
        if (timerNum) timerNum.textContent = state.timerVal;
        if (timerBar) {
            const pct = Math.max(0, (state.timerVal / state.timerMax) * 100);
            timerBar.style.width = pct + '%';
            if (state.timerVal <= 5) {
                timerBar.style.backgroundColor = '#ef4444';
            } else {
                timerBar.style.backgroundColor = '#f59e0b';
            }
        }
    }

    function updateTimerButtons() {
        const btnStart = document.getElementById('pet-btn-start-timer');
        const btnPause = document.getElementById('pet-btn-pause-timer');
        if (btnStart && btnPause) {
            if (state.isTimerRunning) {
                btnStart.style.display = 'none';
                btnPause.style.display = 'inline-flex';
            } else {
                btnStart.style.display = 'inline-flex';
                btnPause.style.display = 'none';
            }
        }
    }

    // Render สกอร์บอร์ด
    function renderScores() {
        const scoreAEl = document.getElementById('pet-score-a');
        const scoreBEl = document.getElementById('pet-score-b');
        const roundEl = document.getElementById('pet-round-display');
        if (scoreAEl) scoreAEl.textContent = state.scoreA;
        if (scoreBEl) scoreBEl.textContent = state.scoreB;
        if (roundEl) roundEl.textContent = `รอบที่ ${state.round}`;
    }

    // Render หลัก
    function render() {
        renderScores();
        updateTimerDisplay();
        updateTimerButtons();

        // 1. ปรับ View Banner & Active View Buttons
        const viewTitle = document.getElementById('pet-view-mode-title');
        const viewSub = document.getElementById('pet-view-mode-sub');
        const banner = document.getElementById('pet-banner-container');

        const btnViewA = document.getElementById('pet-btn-view-a');
        const btnViewB = document.getElementById('pet-btn-view-b');
        const btnViewHost = document.getElementById('pet-btn-view-host');
        const btnViewReveal = document.getElementById('pet-btn-view-reveal');

        [btnViewA, btnViewB, btnViewHost, btnViewReveal].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        if (state.viewMode === 'teamA') {
            if (btnViewA) btnViewA.classList.add('active');
            if (banner) banner.className = 'pet-banner-card mode-team-a';
            if (viewTitle) viewTitle.innerHTML = '👀 หันจอให้ <strong>"ทีม A"</strong> ดู! <span style="font-size: 0.9rem; font-weight: normal;">(ห้ามทีม B แอบมองเด็ดขาด)</span>';
            if (viewSub) viewSub.textContent = 'ทีม A: เห็นการ์ดทีม B เต็มตา แต่ไม่เห็นการ์ดตัวเอง (อ่านเฉพาะคำใบ้ของตัวเอง)';
        } else if (state.viewMode === 'teamB') {
            if (btnViewB) btnViewB.classList.add('active');
            if (banner) banner.className = 'pet-banner-card mode-team-b';
            if (viewTitle) viewTitle.innerHTML = '👀 หันจอให้ <strong>"ทีม B"</strong> ดู! <span style="font-size: 0.9rem; font-weight: normal;">(ห้ามทีม A แอบมองเด็ดขาด)</span>';
            if (viewSub) viewSub.textContent = 'ทีม B: เห็นการ์ดทีม A เต็มตา แต่ไม่เห็นการ์ดตัวเอง (อ่านเฉพาะคำใบ้ของตัวเอง)';
        } else if (state.viewMode === 'host') {
            if (btnViewHost) btnViewHost.classList.add('active');
            if (banner) banner.className = 'pet-banner-card mode-host';
            if (viewTitle) viewTitle.innerHTML = '👑 <strong>จอผู้คุมเกม (Host Master)</strong> - แอบดูคนเดียว';
            if (viewSub) viewSub.textContent = 'ผู้คุมเกมเห็นการ์ดและคะแนนของทั้ง 2 ฝั่งอย่างชัดเจน เพื่อพากย์หรือควบคุมเกม';
        } else if (state.viewMode === 'reveal') {
            if (btnViewReveal) btnViewReveal.classList.add('active');
            if (banner) banner.className = 'pet-banner-card mode-reveal';
            if (viewTitle) viewTitle.innerHTML = '💥 <strong>หันจอตรงกลาง: เปิดเฉลยพร้อมกัน! (SHOWDOWN)</strong>';
            if (viewSub) viewSub.textContent = 'เปิดการ์ดสัตว์ทั้งสองทีม พร้อมคำนวณแต้มสุทธิรวมการ์ดพิเศษ!';
        }

        // 2. Render Cards Team A and Team B
        renderTeamSide('A', state.cardA, state.cardB);
        renderTeamSide('B', state.cardB, state.cardA);
    }

    // Render แต่ละฝั่ง
    function renderTeamSide(teamKey, myData, oppData) {
        if (!myData) return;
        const isTeamA = teamKey === 'A';
        const cardBox = document.getElementById(isTeamA ? 'pet-card-box-a' : 'pet-card-box-b');
        const specialBox = document.getElementById(isTeamA ? 'pet-special-box-a' : 'pet-special-box-b');
        const totalBox = document.getElementById(isTeamA ? 'pet-total-box-a' : 'pet-total-box-b');
        const actionStatus = document.getElementById(isTeamA ? 'pet-action-status-a' : 'pet-action-status-b');
        const btnFight = document.getElementById(isTeamA ? 'pet-btn-fight-a' : 'pet-btn-fight-b');
        const btnFold = document.getElementById(isTeamA ? 'pet-btn-fold-a' : 'pet-btn-fold-b');

        // Action Buttons Active State
        if (btnFight) btnFight.classList.toggle('active-action', myData.action === 'fight');
        if (btnFold) btnFold.classList.toggle('active-action', myData.action === 'fold');

        if (actionStatus) {
            if (myData.action === 'fight') {
                actionStatus.innerHTML = '<span class="pet-badge-fight">⚔️ สู้ใจเด็ด!</span>';
            } else if (myData.action === 'fold') {
                actionStatus.innerHTML = '<span class="pet-badge-fold">🏳️ ขอยอมหมอบ</span>';
            } else {
                actionStatus.innerHTML = '<span class="pet-badge-wait">⏳ ยังไม่เลือก</span>';
            }
        }

        // Determine if my card is visible
        // Invisible when:
        // - In mode teamA and this is Team A
        // - In mode teamB and this is Team B
        // Visible when:
        // - In mode host (Host sees all)
        // - In mode reveal (Both reveal)
        // - In mode teamA and this is Team B (Team A sees Team B!)
        // - In mode teamB and this is Team A (Team B sees Team A!)
        let isMyCardRevealed = false;
        if (state.viewMode === 'host' || state.viewMode === 'reveal') {
            isMyCardRevealed = true;
        } else if (state.viewMode === 'teamA') {
            isMyCardRevealed = !isTeamA; // A is hidden, B is revealed
        } else if (state.viewMode === 'teamB') {
            isMyCardRevealed = isTeamA; // B is hidden, A is revealed
        }

        // Render Pet Card Inside
        if (cardBox) {
            if (isMyCardRevealed) {
                // Front of Card (Visible)
                cardBox.className = `pet-card pet-card-front ${isTeamA ? 'theme-team-a' : 'theme-team-b'}`;
                cardBox.innerHTML = `
                    <div class="pet-card-header">
                        <span class="pet-clue-pill">💡 คำใบ้: "${myData.pet.clue}"</span>
                        <span class="pet-id-pill">#${myData.pet.id}</span>
                    </div>
                    <div class="pet-card-emoji-wrap">
                        <div class="pet-card-emoji">${myData.pet.emoji}</div>
                    </div>
                    <div class="pet-card-name">${myData.pet.name}</div>
                    <div class="pet-card-power-wrap">
                        <span class="pet-power-label">⚡ แต้มความเก่ง</span>
                        <div class="pet-power-val">${fmtNum(myData.pet.power)}</div>
                    </div>
                `;
            } else {
                // Back of Card (Hidden Mystery)
                cardBox.className = `pet-card pet-card-back ${isTeamA ? 'theme-team-a' : 'theme-team-b'}`;
                cardBox.innerHTML = `
                    <div class="pet-card-back-badge">🔒 การ์ดถูกคว่ำไว้</div>
                    <div class="pet-card-back-icon">❓</div>
                    <div class="pet-card-back-title">สัตว์เลี้ยงปริศนา</div>
                    <div class="pet-card-my-clue-box">
                        <div class="pet-clue-title">💡 คำใบ้ของคุณ:</div>
                        <div class="pet-clue-content">"${myData.pet.clue}"</div>
                        <div class="pet-clue-hint">(อาจเป็นตัวกาก หรือตัวบอสแต้ม 6,000+ ก็ได้!)</div>
                    </div>
                `;
            }
        }

        // Render Special Modifier Card
        if (specialBox && myData.special) {
            const spec = myData.special;
            const isPos = spec.val >= 0;
            specialBox.className = `pet-special-card tier-${spec.tier}`;
            specialBox.innerHTML = `
                <div class="pet-special-tier-label">${getTierLabel(spec.tier)}</div>
                <div class="pet-special-content">
                    <span class="pet-special-icon">${spec.icon}</span>
                    <span class="pet-special-name">${spec.name}</span>
                    <span class="pet-special-val ${isPos ? 'pos' : 'neg'}">${spec.text}</span>
                </div>
            `;
        }

        // Render Net Power Calculation (Shown in Reveal or Host mode)
        if (totalBox) {
            const petPow = myData.pet ? myData.pet.power : 0;
            const specVal = myData.special ? myData.special.val : 0;
            const netTotal = petPow + specVal;

            if (state.viewMode === 'reveal') {
                totalBox.style.display = 'block';

                // Check winner
                const oppPetPow = oppData.pet ? oppData.pet.power : 0;
                const oppSpecVal = oppData.special ? oppData.special.val : 0;
                const oppNetTotal = oppPetPow + oppSpecVal;

                let badgeHtml = '';
                if (myData.action === 'fold' && oppData.action === 'fight') {
                    badgeHtml = '<div class="pet-win-badge defeat">🏳️ หมอบยอมแพ้</div>';
                } else if (oppData.action === 'fold' && myData.action === 'fight') {
                    badgeHtml = '<div class="pet-win-badge victory">👑 ชนะเพราะคู่แข่งหมอบ!</div>';
                } else if (netTotal > oppNetTotal) {
                    badgeHtml = '<div class="pet-win-badge victory">🏆 ผู้ชนะรอบนี้!</div>';
                } else if (netTotal < oppNetTotal) {
                    badgeHtml = '<div class="pet-win-badge defeat">💀 พ่ายแพ้</div>';
                } else {
                    badgeHtml = '<div class="pet-win-badge draw">🤝 เสมอกัน!</div>';
                }

                totalBox.innerHTML = `
                    <div class="pet-calc-breakdown">
                        <span>พลังสัตว์ <strong>${fmtNum(petPow)}</strong></span>
                        <span>${specVal >= 0 ? '+' : ''}${fmtNum(specVal)}</span>
                    </div>
                    <div class="pet-calc-total">
                        <span class="pet-calc-total-label">แต้มสุทธิรวม:</span>
                        <span class="pet-calc-total-val">${fmtNum(netTotal)}</span>
                    </div>
                    ${badgeHtml}
                `;
            } else if (state.viewMode === 'host') {
                totalBox.style.display = 'block';
                totalBox.innerHTML = `
                    <div class="pet-calc-host-preview">
                        👑 ผู้คุมมองเห็น: <strong>${fmtNum(petPow)}</strong> ${specVal >= 0 ? '+' : ''}${fmtNum(specVal)} = <strong>${fmtNum(netTotal)}</strong>
                    </div>
                `;
            } else {
                totalBox.style.display = 'none';
            }
        }
    }

    function getTierLabel(tier) {
        switch (tier) {
            case 'white': return '⚪ การ์ดสีขาว (Common)';
            case 'green': return '🟢 การ์ดสีเขียว (Uncommon)';
            case 'blue': return '🔵 การ์ดสีน้ำเงิน (Rare)';
            case 'gold': return '🟡 การ์ดสีทอง (Legendary)';
            default: return 'การ์ดพิเศษ';
        }
    }

    // ผูก Event Listeners ทั้งหมด
    function initEvents() {
        // ปุ่มสลับโหมดมุมมอง 4 ปุ่ม
        const btnViewA = document.getElementById('pet-btn-view-a');
        const btnViewB = document.getElementById('pet-btn-view-b');
        const btnViewHost = document.getElementById('pet-btn-view-host');
        const btnViewReveal = document.getElementById('pet-btn-view-reveal');

        if (btnViewA) btnViewA.addEventListener('click', () => setViewMode('teamA'));
        if (btnViewB) btnViewB.addEventListener('click', () => setViewMode('teamB'));
        if (btnViewHost) btnViewHost.addEventListener('click', () => setViewMode('host'));
        if (btnViewReveal) btnViewReveal.addEventListener('click', () => setViewMode('reveal'));

        // Action Buttons
        const btnFightA = document.getElementById('pet-btn-fight-a');
        const btnFoldA = document.getElementById('pet-btn-fold-a');
        const btnFightB = document.getElementById('pet-btn-fight-b');
        const btnFoldB = document.getElementById('pet-btn-fold-b');

        if (btnFightA) btnFightA.addEventListener('click', () => setTeamAction('A', 'fight'));
        if (btnFoldA) btnFoldA.addEventListener('click', () => setTeamAction('A', 'fold'));
        if (btnFightB) btnFightB.addEventListener('click', () => setTeamAction('B', 'fight'));
        if (btnFoldB) btnFoldB.addEventListener('click', () => setTeamAction('B', 'fold'));

        // Score Adjust Buttons
        const btnPlusA = document.getElementById('pet-score-plus-a');
        const btnMinusA = document.getElementById('pet-score-minus-a');
        const btnPlusB = document.getElementById('pet-score-plus-b');
        const btnMinusB = document.getElementById('pet-score-minus-b');

        if (btnPlusA) btnPlusA.addEventListener('click', () => changeScore('A', 1));
        if (btnMinusA) btnMinusA.addEventListener('click', () => changeScore('A', -1));
        if (btnPlusB) btnPlusB.addEventListener('click', () => changeScore('B', 1));
        if (btnMinusB) btnMinusB.addEventListener('click', () => changeScore('B', -1));

        // Game Control Buttons
        const btnNewRound = document.getElementById('pet-btn-new-round');
        const btnRerollSpecial = document.getElementById('pet-btn-reroll-special');
        const btnResetScore = document.getElementById('pet-btn-reset-score');

        if (btnNewRound) {
            btnNewRound.addEventListener('click', () => {
                state.round++;
                newRound();
            });
        }
        if (btnRerollSpecial) btnRerollSpecial.addEventListener('click', rerollSpecialCards);
        if (btnResetScore) btnResetScore.addEventListener('click', resetScores);

        // Timer Controls
        const btnStartTimer = document.getElementById('pet-btn-start-timer');
        const btnPauseTimer = document.getElementById('pet-btn-pause-timer');
        const btnResetTimer = document.getElementById('pet-btn-reset-timer');
        const selTimer = document.getElementById('pet-timer-select');

        if (btnStartTimer) btnStartTimer.addEventListener('click', startTimer);
        if (btnPauseTimer) btnPauseTimer.addEventListener('click', stopTimer);
        if (btnResetTimer) btnResetTimer.addEventListener('click', resetTimer);
        if (selTimer) {
            selTimer.addEventListener('change', () => {
                resetTimer();
            });
        }

        // Keyboard Shortcuts เพื่อความคล่องตัวของผู้คุมเกม
        // 1 = ดู A, 2 = ดู B, 3 = ดู Host, 4 or Space = เปิดเฉลย, R = สุ่มรอบใหม่
        window.addEventListener('keydown', (e) => {
            const petSection = document.getElementById('pet-mode');
            if (!petSection || !petSection.classList.contains('active')) return;

            // If user typing in an input, ignore
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (e.key === '1') {
                setViewMode('teamA');
            } else if (e.key === '2') {
                setViewMode('teamB');
            } else if (e.key === '3') {
                setViewMode('host');
            } else if (e.key === '4' || e.code === 'Space') {
                e.preventDefault();
                setViewMode('reveal');
            } else if (e.key === 'r' || e.key === 'R') {
                state.round++;
                newRound();
            }
        });
    }

    // Public API
    window.initPetGame = function () {
        initEvents();
        newRound();
    };
})();
