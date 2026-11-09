/**
 * pet-game.js - ระบบการทำงานของเกม "วัดใจแต้มสัตว์เลี้ยง" (Offline Host Controlled)
 * ปรับปรุง UI ให้คลีน สบายตา ไม่มีตัวจับเวลา/รอบกวนใจ
 * เปิดดูแยกทีมเป็นใบเดี่ยวใหญ่ๆ ชัดเจน
 * คลิกที่การ์ด (ทั้งการ์ดสัตว์ และการ์ดแต้ม) เพื่อพลิกซ่อน/เปิด โดยหลังการ์ดแสดงขอบสีชัดเจน
 */

(function () {
    // Web Audio API Synthesizer สำหรับ SFX ในตัว
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

    function playSfxFlip() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } catch (e) { }
    }

    function playSfxClash() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) { }
    }

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
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            });
        } catch (e) { }
    }

    // Game State
    const state = {
        scoreA: 0,
        scoreB: 0,
        viewMode: 'host', // 'host' | 'teamA' | 'teamB' | 'reveal'
        cardA: null, // { pet, special, petFlipped: boolean, specialFlipped: boolean, action: 'none'|'fight'|'fold' }
        cardB: null
    };

    function fmtNum(n) {
        return Number(n).toLocaleString('en-US');
    }

    // เริ่มสุ่มรอบใหม่
    function newRound() {
        const petA = getRandomPetCard();
        const petB = getRandomPetCard(petA.id);
        const specA = getRandomSpecialCard();
        const specB = getRandomSpecialCard();

        state.cardA = {
            pet: petA,
            special: specA,
            petFlipped: false,      // false = ด้านหน้า (เปิด), true = ด้านหลัง (ซ่อนเพื่อดูขอบ)
            specialFlipped: false,
            action: 'none'
        };

        state.cardB = {
            pet: petB,
            special: specB,
            petFlipped: false,
            specialFlipped: false,
            action: 'none'
        };

        state.viewMode = 'host';
        playSfxFlip();
        render();
    }

    // สุ่มเฉพาะการ์ดแต้มพิเศษใหม่
    function rerollSpecialCards() {
        if (!state.cardA || !state.cardB) return;
        state.cardA.special = getRandomSpecialCard();
        state.cardB.special = getRandomSpecialCard();
        state.cardA.specialFlipped = false;
        state.cardB.specialFlipped = false;
        playSfxFlip();
        render();
    }

    // พลิกการ์ด (Toggle Flip)
    function toggleFlip(team, type) {
        const data = team === 'A' ? state.cardA : state.cardB;
        if (!data) return;
        if (type === 'pet') {
            data.petFlipped = !data.petFlipped;
        } else if (type === 'special') {
            data.specialFlipped = !data.specialFlipped;
        }
        playSfxFlip();
        render();
    }

    // สลับโหมดมุมมอง
    function setViewMode(mode) {
        state.viewMode = mode;
        if (mode === 'reveal') {
            // เมื่อเฉลย บังคับเปิดหน้าการ์ดทั้งหมด
            if (state.cardA) {
                state.cardA.petFlipped = false;
                state.cardA.specialFlipped = false;
            }
            if (state.cardB) {
                state.cardB.petFlipped = false;
                state.cardB.specialFlipped = false;
            }
            playSfxClash();
            setTimeout(() => {
                const totalA = (state.cardA?.pet?.power || 0) + (state.cardA?.special?.val || 0);
                const totalB = (state.cardB?.pet?.power || 0) + (state.cardB?.special?.val || 0);
                if (totalA !== totalB) playSfxVictory();
            }, 300);
        } else {
            playSfxFlip();
        }
        render();
    }

    // ปรับการตัดสินใจของแต่ละทีม (สู้ หรือ หมอบ)
    function setTeamAction(team, action) {
        const target = team === 'A' ? state.cardA : state.cardB;
        if (target) {
            target.action = target.action === action ? 'none' : action;
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
        if (confirm('คุณต้องการรีเซ็ตคะแนนทั้งหมดใช่หรือไม่?')) {
            state.scoreA = 0;
            state.scoreB = 0;
            renderScores();
        }
    }

    function renderScores() {
        const scoreAEl = document.getElementById('pet-score-a');
        const scoreBEl = document.getElementById('pet-score-b');
        if (scoreAEl) scoreAEl.textContent = state.scoreA;
        if (scoreBEl) scoreBEl.textContent = state.scoreB;
    }

    // HTML Template สำหรับการ์ดสัตว์ (รองรับทั้งหน้าและหลัง)
    function getPetCardHtml(petData, isFlipped, teamTheme) {
        const borderInfo = getPetBorderInfo(petData.power);
        if (!isFlipped) {
            // ด้านหน้าการ์ดสัตว์ (เปิดโชว์)
            return `
                <div class="pet-card-inner card-front ${teamTheme} border-${borderInfo.tier}">
                    <div class="pet-card-header">
                        <span class="pet-clue-pill">💡 คำใบ้: "${petData.clue}"</span>
                        <span class="pet-border-indicator tier-${borderInfo.tier}">${borderInfo.label}</span>
                    </div>
                    <div class="pet-card-emoji-wrap">
                        <div class="pet-card-emoji">${petData.emoji}</div>
                    </div>
                    <div class="pet-card-name">${petData.name}</div>
                    <div class="pet-card-power-wrap">
                        <span class="pet-power-label">⚡ แต้มความเก่ง</span>
                        <div class="pet-power-val">${fmtNum(petData.power)}</div>
                    </div>
                    <div class="pet-flip-hint">👆 คลิกเพื่อพลิกซ่อนการ์ด</div>
                </div>
            `;
        } else {
            // ด้านหลังการ์ดสัตว์ (ซ่อน - แต่โชว์ว่าขอบอะไรตามที่ผู้ใช้สั่ง!)
            return `
                <div class="pet-card-inner card-back border-${borderInfo.tier}">
                    <div class="pet-back-badge-wrap">
                        <span class="pet-border-glow-badge tier-${borderInfo.tier}">${borderInfo.label}</span>
                    </div>
                    <div class="pet-back-symbol">🐾 ❓</div>
                    <div class="pet-back-title">การ์ดสัตว์ถูกซ่อนไว้</div>
                    <div class="pet-back-border-desc">ขอบการ์ดใบนี้คือ: <strong>${borderInfo.label}</strong></div>
                    <div class="pet-flip-hint active-hint">👆 คลิกเพื่อพลิกเปิดดูตัวและแต้ม</div>
                </div>
            `;
        }
    }

    // HTML Template สำหรับการ์ดแต้มพิเศษ (รองรับทั้งหน้าและหลัง)
    function getSpecialCardHtml(specData, isFlipped) {
        const borderInfo = getSpecialBorderInfo(specData.tier);
        const isPos = specData.val >= 0;
        if (!isFlipped) {
            // ด้านหน้าการ์ดพิเศษ
            return `
                <div class="pet-special-inner card-front tier-${specData.tier}">
                    <div class="pet-special-tier-label">${borderInfo.label}</div>
                    <div class="pet-special-content">
                        <span class="pet-special-icon">${specData.icon}</span>
                        <span class="pet-special-name">${specData.name}</span>
                        <span class="pet-special-val ${isPos ? 'pos' : 'neg'}">${specData.text}</span>
                    </div>
                    <div class="pet-special-flip-sub">👆 คลิกเพื่อซ่อนแต้ม</div>
                </div>
            `;
        } else {
            // ด้านหลังการ์ดพิเศษ (ซ่อนแต้ม - แต่โชว์ว่าขอบการ์ดสีอะไร!)
            return `
                <div class="pet-special-inner card-back tier-${specData.tier}">
                    <div class="pet-back-badge-wrap">
                        <span class="pet-special-border-badge tier-${specData.tier}">${borderInfo.label}</span>
                    </div>
                    <div class="pet-special-back-desc">
                        🃏 ซ่อนแต้มไว้ (การ์ดขอบ <strong>${borderInfo.label}</strong>)
                    </div>
                    <div class="pet-special-flip-sub active-hint">👆 คลิกเพื่อพลิกเปิดแต้ม</div>
                </div>
            `;
        }
    }

    // Render หลัก
    function render() {
        if (!state.cardA || !state.cardB) return;
        renderScores();

        // อัปเดตสถานะปุ่ม Switcher
        const btnViewA = document.getElementById('pet-btn-view-a');
        const btnViewB = document.getElementById('pet-btn-view-b');
        const btnViewHost = document.getElementById('pet-btn-view-host');
        const btnViewReveal = document.getElementById('pet-btn-view-reveal');

        [btnViewA, btnViewB, btnViewHost, btnViewReveal].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        const singleStage = document.getElementById('pet-single-stage');
        const dualStage = document.getElementById('pet-dual-stage');

        if (state.viewMode === 'teamA' || state.viewMode === 'teamB') {
            // === โหมดหันจอให้ดูทีละทีม: แสดงใบเดี่ยวใหญ่ๆ ชัดๆ คลีนๆ ไม่ขึ้นกริดเบียดกัน ===
            if (singleStage) singleStage.style.display = 'block';
            if (dualStage) dualStage.style.display = 'none';

            if (state.viewMode === 'teamA') {
                if (btnViewA) btnViewA.classList.add('active');
                renderSingleStage('A', state.cardA, 'B', state.cardB);
            } else {
                if (btnViewB) btnViewB.classList.add('active');
                renderSingleStage('B', state.cardB, 'A', state.cardA);
            }
        } else {
            // === โหมดเฉลยประชันแต้ม หรือ โหมดผู้คุมแอบดู: แสดง 2 ฝั่งประชันกัน ===
            if (singleStage) singleStage.style.display = 'none';
            if (dualStage) dualStage.style.display = 'block';

            if (state.viewMode === 'host') {
                if (btnViewHost) btnViewHost.classList.add('active');
                renderDualStage(false);
            } else {
                if (btnViewReveal) btnViewReveal.classList.add('active');
                renderDualStage(true);
            }
        }
    }

    // แสดงผล Single Focused Stage (ใบเดี่ยวใหญ่ๆ)
    function renderSingleStage(activeTeamKey, activeData, oppTeamKey, oppData) {
        const viewTitle = document.getElementById('pet-single-view-title');
        const myClueBox = document.getElementById('pet-single-my-clue');
        const targetLabel = document.getElementById('pet-single-target-label');
        const decisionLabel = document.getElementById('pet-single-decision-label');
        const singlePetBox = document.getElementById('pet-single-pet-card');
        const singleSpecialBox = document.getElementById('pet-single-special-card');

        const isTeamA = activeTeamKey === 'A';
        if (viewTitle) {
            viewTitle.innerHTML = `👀 หันจอให้ <strong style="color: ${isTeamA ? '#dc2626' : '#2563eb'};">"ทีม ${activeTeamKey}"</strong> ดู!`;
        }
        if (myClueBox) {
            myClueBox.innerHTML = `💡 คำใบ้การ์ดของคุณ (ทีม ${activeTeamKey}): <strong>"${activeData.pet.clue}"</strong>`;
        }
        if (targetLabel) {
            targetLabel.innerHTML = `🎯 กำลังส่องการ์ดของ: <strong style="color: ${isTeamA ? '#2563eb' : '#dc2626'};">ทีม ${oppTeamKey}</strong>`;
        }
        if (decisionLabel) {
            decisionLabel.textContent = `การตัดสินใจของทีม ${activeTeamKey}:`;
        }

        // Render Opponent Card (ใบใหญ่เดี่ยวๆ ให้ทีมนี้ส่อง!)
        if (singlePetBox) {
            singlePetBox.innerHTML = getPetCardHtml(oppData.pet, oppData.petFlipped, isTeamA ? 'theme-team-b' : 'theme-team-a');
            singlePetBox.onclick = () => toggleFlip(oppTeamKey, 'pet');
        }
        if (singleSpecialBox) {
            singleSpecialBox.innerHTML = getSpecialCardHtml(oppData.special, oppData.specialFlipped);
            singleSpecialBox.onclick = () => toggleFlip(oppTeamKey, 'special');
        }

        // Action Buttons for this single team
        const btnFight = document.getElementById('pet-single-btn-fight');
        const btnFold = document.getElementById('pet-single-btn-fold');
        if (btnFight) {
            btnFight.classList.toggle('active-action', activeData.action === 'fight');
            btnFight.onclick = () => setTeamAction(activeTeamKey, 'fight');
        }
        if (btnFold) {
            btnFold.classList.toggle('active-action', activeData.action === 'fold');
            btnFold.onclick = () => setTeamAction(activeTeamKey, 'fold');
        }
    }

    // แสดงผล Dual Stage (สำหรับ Reveal และ Host Mode)
    function renderDualStage(isRevealMode) {
        const bannerTitle = document.getElementById('pet-view-mode-title');
        const bannerSub = document.getElementById('pet-view-mode-sub');
        const banner = document.getElementById('pet-banner-container');

        if (isRevealMode) {
            if (banner) banner.className = 'pet-banner-card mode-reveal';
            if (bannerTitle) bannerTitle.innerHTML = '💥 <strong>หันจอตรงกลาง: เปิดเฉลยพร้อมกัน! (SHOWDOWN)</strong>';
            if (bannerSub) bannerSub.textContent = 'คำนวณแต้มสุทธิ (พลังสัตว์ + การ์ดแต้มพิเศษ) ตัดสินผู้ชนะ!';
        } else {
            if (banner) banner.className = 'pet-banner-card mode-host';
            if (bannerTitle) bannerTitle.innerHTML = '👑 <strong>จอผู้คุมเกม (Host Master)</strong> - แอบดูคนเดียว';
            if (bannerSub) bannerSub.textContent = 'ผู้คุมมองเห็นทั้ง 2 ฝั่งอย่างชัดเจน คลิกการ์ดใบไหนก็ได้เพื่อพลิกซ่อน/เปิด';
        }

        // Render ฝั่งทีม A
        renderDualColumn('A', state.cardA, state.cardB, isRevealMode);
        // Render ฝั่งทีม B
        renderDualColumn('B', state.cardB, state.cardA, isRevealMode);
    }

    function renderDualColumn(teamKey, myData, oppData, isRevealMode) {
        const isTeamA = teamKey === 'A';
        const cardBox = document.getElementById(isTeamA ? 'pet-card-box-a' : 'pet-card-box-b');
        const specialBox = document.getElementById(isTeamA ? 'pet-special-box-a' : 'pet-special-box-b');
        const totalBox = document.getElementById(isTeamA ? 'pet-total-box-a' : 'pet-total-box-b');
        const actionStatus = document.getElementById(isTeamA ? 'pet-action-status-a' : 'pet-action-status-b');
        const btnFight = document.getElementById(isTeamA ? 'pet-btn-fight-a' : 'pet-btn-fight-b');
        const btnFold = document.getElementById(isTeamA ? 'pet-btn-fold-a' : 'pet-btn-fold-b');

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

        if (cardBox) {
            cardBox.innerHTML = getPetCardHtml(myData.pet, myData.petFlipped, isTeamA ? 'theme-team-a' : 'theme-team-b');
            cardBox.onclick = () => toggleFlip(teamKey, 'pet');
        }

        if (specialBox) {
            specialBox.innerHTML = getSpecialCardHtml(myData.special, myData.specialFlipped);
            specialBox.onclick = () => toggleFlip(teamKey, 'special');
        }

        if (totalBox) {
            const petPow = myData.pet ? myData.pet.power : 0;
            const specVal = myData.special ? myData.special.val : 0;
            const netTotal = petPow + specVal;

            if (isRevealMode) {
                totalBox.style.display = 'block';
                const oppPetPow = oppData.pet ? oppData.pet.power : 0;
                const oppSpecVal = oppData.special ? oppData.special.val : 0;
                const oppNetTotal = oppPetPow + oppSpecVal;

                let badgeHtml = '';
                if (myData.action === 'fold' && oppData.action === 'fight') {
                    badgeHtml = '<div class="pet-win-badge defeat">🏳️ หมอบยอมแพ้</div>';
                } else if (oppData.action === 'fold' && myData.action === 'fight') {
                    badgeHtml = '<div class="pet-win-badge victory">👑 ชนะเพราะคู่แข่งหมอบ!</div>';
                } else if (netTotal > oppNetTotal) {
                    badgeHtml = '<div class="pet-win-badge victory">🏆 ผู้ชนะรอบนี้! (+1 แต้ม)</div>';
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
            } else {
                // Host Master Mode: แสดงแต้มสรุปแบบกระชับ
                totalBox.style.display = 'block';
                totalBox.innerHTML = `
                    <div class="pet-calc-host-preview">
                        👑 ผู้คุมมองเห็น: <strong>${fmtNum(petPow)}</strong> ${specVal >= 0 ? '+' : ''}${fmtNum(specVal)} = <strong>${fmtNum(netTotal)}</strong>
                    </div>
                `;
            }
        }
    }

    // ผูก Event Listeners
    function initEvents() {
        const btnViewA = document.getElementById('pet-btn-view-a');
        const btnViewB = document.getElementById('pet-btn-view-b');
        const btnViewHost = document.getElementById('pet-btn-view-host');
        const btnViewReveal = document.getElementById('pet-btn-view-reveal');

        if (btnViewA) btnViewA.addEventListener('click', () => setViewMode('teamA'));
        if (btnViewB) btnViewB.addEventListener('click', () => setViewMode('teamB'));
        if (btnViewHost) btnViewHost.addEventListener('click', () => setViewMode('host'));
        if (btnViewReveal) btnViewReveal.addEventListener('click', () => setViewMode('reveal'));

        // Action Buttons ใน Dual Stage
        const btnFightA = document.getElementById('pet-btn-fight-a');
        const btnFoldA = document.getElementById('pet-btn-fold-a');
        const btnFightB = document.getElementById('pet-btn-fight-b');
        const btnFoldB = document.getElementById('pet-btn-fold-b');

        if (btnFightA) btnFightA.addEventListener('click', () => setTeamAction('A', 'fight'));
        if (btnFoldA) btnFoldA.addEventListener('click', () => setTeamAction('A', 'fold'));
        if (btnFightB) btnFightB.addEventListener('click', () => setTeamAction('B', 'fight'));
        if (btnFoldB) btnFoldB.addEventListener('click', () => setTeamAction('B', 'fold'));

        // Score Controls
        const btnPlusA = document.getElementById('pet-score-plus-a');
        const btnMinusA = document.getElementById('pet-score-minus-a');
        const btnPlusB = document.getElementById('pet-score-plus-b');
        const btnMinusB = document.getElementById('pet-score-minus-b');

        if (btnPlusA) btnPlusA.addEventListener('click', () => changeScore('A', 1));
        if (btnMinusA) btnMinusA.addEventListener('click', () => changeScore('A', -1));
        if (btnPlusB) btnPlusB.addEventListener('click', () => changeScore('B', 1));
        if (btnMinusB) btnMinusB.addEventListener('click', () => changeScore('B', -1));

        // Round Controls
        const btnNewRound = document.getElementById('pet-btn-new-round');
        const btnRerollSpecial = document.getElementById('pet-btn-reroll-special');
        const btnResetScore = document.getElementById('pet-btn-reset-score');

        if (btnNewRound) btnNewRound.addEventListener('click', newRound);
        if (btnRerollSpecial) btnRerollSpecial.addEventListener('click', rerollSpecialCards);
        if (btnResetScore) btnResetScore.addEventListener('click', resetScores);

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            const petSection = document.getElementById('pet-mode');
            if (!petSection || !petSection.classList.contains('active')) return;
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
                newRound();
            }
        });
    }

    window.initPetGame = function () {
        initEvents();
        newRound();
    };
})();
