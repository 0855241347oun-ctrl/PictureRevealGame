/**
 * pet-game.js - ระบบการทำงานของเกม "วัดใจแต้มสัตว์เลี้ยง" (Offline Host Controlled)
 * - สัตว์ไม่ต้องบอกขอบ เปิดมาให้ซ่อนทั้งสองใบ (Face Down)
 * - สุ่มแล้วมีคำใบ้อยู่บนหลังการ์ดสัตว์
 * - การ์ดแต้มพิเศษแสดงขอบสี (ขาว เขียว น้ำเงิน ทอง)
 * - โหมดเฉลย (Duel Arena): การ์ดซ่อนไว้ก่อน ให้คลิกเลือกเปิดทีละใบ
 * - แอนิเมชันสุ่มแบบที่ 1: Card Snap (สไลด์ลงตรงๆ สแน็ปเข้าล็อก คมชัด นิ่งสนิท ไม่เอียง)
 * - สุ่มใบไหน ขยับเฉพาะใบนั้น 100%
 */

(function () {
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

    // เสียงพลิกการ์ด
    function playSfxFlip() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(560, now + 0.08);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) { }
    }

    // เสียงสแน็ปการ์ดใบใหม่ (Card Snap SFX)
    function playSfxDeal() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
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
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);
            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) { }
    }

    function playSfxVictory() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, idx) => {
                const now = ctx.currentTime + idx * 0.08;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            });
        } catch (e) { }
    }

    // ยิงแอนิเมชัน Card Snap เฉพาะกล่องการ์ด ID ที่ระบุใบเดียวเท่านั้น!
    function triggerCardSnap(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.classList.remove('card-snap-anim');
        void el.offsetWidth; // force reflow
        el.classList.add('card-snap-anim');
        el.addEventListener('animationend', () => {
            el.classList.remove('card-snap-anim');
        }, { once: true });
    }

    // Game State
    const state = {
        viewMode: 'reveal', // 'teamA' | 'teamB' | 'reveal'
        cardA: null,
        cardB: null,
        dealSeq: 1
    };

    function fmtNum(n) {
        return Number(n).toLocaleString('en-US');
    }

    // สุ่มรอบใหม่: ซ่อนทั้ง 2 ใบ มีคำใบ้อยู่หลังการ์ดสัตว์
    function newRound() {
        const petA = getRandomPetCard();
        const petB = getRandomPetCard(petA.id);
        const specA = getRandomSpecialCard();
        const specB = getRandomSpecialCard();
        state.dealSeq++;

        state.cardA = {
            pet: petA,
            special: specA,
            petFlipped: true,
            specialFlipped: true,
            action: 'none',
            petSeq: state.dealSeq,
            specSeq: state.dealSeq
        };

        state.cardB = {
            pet: petB,
            special: specB,
            petFlipped: true,
            specialFlipped: true,
            action: 'none',
            petSeq: state.dealSeq,
            specSeq: state.dealSeq
        };

        playSfxDeal();
        render();

        ['pet-card-box-a', 'pet-special-box-a', 'pet-card-box-b', 'pet-special-box-b',
         'pet-single-pet-card', 'pet-single-special-card'].forEach(triggerCardSnap);
    }

    // สุ่มสัตว์เฉพาะทีม: เล่นแอนิเมชันเฉพาะการ์ดสัตว์ใบที่สุ่มเท่านั้น!
    function rerollPet(team) {
        if (!state.cardA || !state.cardB) return;
        state.dealSeq++;
        const target = team === 'A' ? state.cardA : state.cardB;
        const other = team === 'A' ? state.cardB : state.cardA;
        target.pet = getRandomPetCard(other && other.pet ? other.pet.id : null);
        target.petFlipped = true;
        target.petSeq = state.dealSeq;
        playSfxDeal();
        render();

        // ยิงแอนิเมชัน Card Snap เฉพาะใบนี้ใบเดียว!
        if (state.viewMode === 'reveal') {
            triggerCardSnap(team === 'A' ? 'pet-card-box-a' : 'pet-card-box-b');
        } else {
            triggerCardSnap('pet-single-pet-card');
        }
    }

    // สุ่มการ์ดแต้มเฉพาะทีม: เล่นแอนิเมชันเฉพาะการ์ดแต้มใบที่สุ่มเท่านั้น!
    function rerollSpecial(team) {
        if (!state.cardA || !state.cardB) return;
        state.dealSeq++;
        const target = team === 'A' ? state.cardA : state.cardB;
        target.special = getRandomSpecialCard();
        target.specialFlipped = true;
        target.specSeq = state.dealSeq;
        playSfxDeal();
        render();

        // ยิงแอนิเมชัน Card Snap เฉพาะใบนี้ใบเดียว!
        if (state.viewMode === 'reveal') {
            triggerCardSnap(team === 'A' ? 'pet-special-box-a' : 'pet-special-box-b');
        } else {
            triggerCardSnap('pet-single-special-card');
        }
    }

    // สุ่มเฉพาะการ์ดแต้มทั้งสองทีม
    function rerollSpecialCards() {
        if (!state.cardA || !state.cardB) return;
        state.dealSeq++;
        state.cardA.special = getRandomSpecialCard();
        state.cardB.special = getRandomSpecialCard();
        state.cardA.specialFlipped = true;
        state.cardB.specialFlipped = true;
        state.cardA.specSeq = state.dealSeq;
        state.cardB.specSeq = state.dealSeq;
        playSfxDeal();
        render();

        triggerCardSnap('pet-special-box-a');
        triggerCardSnap('pet-special-box-b');
        triggerCardSnap('pet-single-special-card');
    }

    // พลิกการ์ด (เปิด/ซ่อน) หมุน 3D ลื่นๆ (ไม่ยิงแอนิเมชันสแน็ป)
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

        // โหมดเฉลย: ถ้าเปิดครบทั้ง 4 ใบแล้ว เล่นเสียงฉลองผู้ชนะ
        if (state.viewMode === 'reveal') {
            const allOpened = !state.cardA.petFlipped && !state.cardA.specialFlipped &&
                              !state.cardB.petFlipped && !state.cardB.specialFlipped;
            if (allOpened) {
                setTimeout(() => {
                    const totalA = (state.cardA?.pet?.power || 0) + (state.cardA?.special?.val || 0);
                    const totalB = (state.cardB?.pet?.power || 0) + (state.cardB?.special?.val || 0);
                    if (totalA !== totalB) playSfxVictory();
                }, 350);
            }
        }
    }

    // สลับโหมดมุมมอง
    function setViewMode(mode) {
        state.viewMode = mode;
        if (mode === 'reveal') {
            if (state.cardA) {
                state.cardA.petFlipped = true;
                state.cardA.specialFlipped = true;
            }
            if (state.cardB) {
                state.cardB.petFlipped = true;
                state.cardB.specialFlipped = true;
            }
            playSfxClash();
        } else {
            playSfxFlip();
        }
        render();
    }

    function setTeamAction(team, action) {
        const target = team === 'A' ? state.cardA : state.cardB;
        if (target) {
            target.action = target.action === action ? 'none' : action;
        }
        render();
    }

    // HTML การ์ดสัตว์ 3D Flipper
    function getPetCardFlipperHtml(petData, isFlipped, teamTheme) {
        return `
            <div class="pet-card-flipper ${isFlipped ? 'is-flipped' : ''}">
                <div class="pet-card-inner card-front ${teamTheme}">
                    <div class="pet-card-emoji">${petData.emoji}</div>
                    <div class="pet-card-name">${petData.name}</div>
                    <div class="pet-power-val">${fmtNum(petData.power)}</div>
                </div>
                <div class="pet-card-inner card-back">
                    <div class="pet-card-back-clue-pill">
                        💡 คำใบ้: <strong>${petData.clue}</strong>
                    </div>
                    <div class="pet-back-symbol">🐾</div>
                </div>
            </div>
        `;
    }

    // HTML การ์ดพิเศษ 3D Flipper
    function getSpecialCardFlipperHtml(specData, isFlipped) {
        const borderInfo = getSpecialBorderInfo(specData.tier);
        const isPos = specData.val >= 0;
        return `
            <div class="pet-card-flipper ${isFlipped ? 'is-flipped' : ''}">
                <div class="pet-special-inner card-front tier-${specData.tier}">
                    <span class="pet-special-icon">${specData.icon}</span>
                    <span class="pet-special-name">${specData.name}</span>
                    <span class="pet-special-val ${isPos ? 'pos' : 'neg'}">${specData.text}</span>
                </div>
                <div class="pet-special-inner card-back tier-${specData.tier}">
                    <span class="pet-special-border-badge tier-${specData.tier}">${borderInfo.label}</span>
                    <div class="pet-back-symbol">🃏</div>
                </div>
            </div>
        `;
    }

    // อัปเดตกล่องการ์ด: สลับแค่ .is-flipped ตอนคลิกพลิก ไม่รบกวนแอนิเมชันสแน็ป
    function updateCardElement(boxEl, cardKey, htmlBuilder, isFlipped) {
        if (!boxEl) return;
        const currentKey = boxEl.getAttribute('data-card-key');
        if (currentKey !== cardKey) {
            boxEl.setAttribute('data-card-key', cardKey);
            boxEl.innerHTML = htmlBuilder();
        } else {
            const flipper = boxEl.querySelector('.pet-card-flipper');
            if (flipper) {
                flipper.classList.toggle('is-flipped', isFlipped);
            }
        }
    }

    // Render หลัก
    function render() {
        if (!state.cardA || !state.cardB) return;

        const btnViewA = document.getElementById('pet-btn-view-a');
        const btnViewB = document.getElementById('pet-btn-view-b');
        const btnViewReveal = document.getElementById('pet-btn-view-reveal');

        [btnViewA, btnViewB, btnViewReveal].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        const singleStage = document.getElementById('pet-single-stage');
        const dualStage = document.getElementById('pet-dual-stage');

        if (state.viewMode === 'teamA' || state.viewMode === 'teamB') {
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
            if (singleStage) singleStage.style.display = 'none';
            if (dualStage) dualStage.style.display = 'block';
            if (btnViewReveal) btnViewReveal.classList.add('active');
            renderDualStage(true);
        }
    }

    // Render Single Stage
    function renderSingleStage(activeTeamKey, activeData, oppTeamKey, oppData) {
        const singlePetBox = document.getElementById('pet-single-pet-card');
        const singleSpecialBox = document.getElementById('pet-single-special-card');
        const isTeamA = activeTeamKey === 'A';
        const theme = isTeamA ? 'theme-team-b' : 'theme-team-a';

        if (singlePetBox) {
            const petKey = `single-pet-${oppTeamKey}-${oppData.pet.id}-${oppData.petSeq}`;
            updateCardElement(
                singlePetBox,
                petKey,
                () => getPetCardFlipperHtml(oppData.pet, oppData.petFlipped, theme),
                oppData.petFlipped
            );
            singlePetBox.onclick = () => toggleFlip(oppTeamKey, 'pet');
        }

        if (singleSpecialBox) {
            const specKey = `single-spec-${oppTeamKey}-${oppData.special.id}-${oppData.specSeq}`;
            updateCardElement(
                singleSpecialBox,
                specKey,
                () => getSpecialCardFlipperHtml(oppData.special, oppData.specialFlipped),
                oppData.specialFlipped
            );
            singleSpecialBox.onclick = () => toggleFlip(oppTeamKey, 'special');
        }

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

    // Render Dual Stage
    function renderDualStage(isRevealMode) {
        renderDualColumn('A', state.cardA, state.cardB, isRevealMode);
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
                actionStatus.innerHTML = '<span class="pet-badge-fight">⚔️</span>';
            } else if (myData.action === 'fold') {
                actionStatus.innerHTML = '<span class="pet-badge-fold">🏳️</span>';
            } else {
                actionStatus.innerHTML = '';
            }
        }

        if (cardBox) {
            const petKey = `dual-pet-${teamKey}-${myData.pet.id}-${myData.petSeq}`;
            updateCardElement(
                cardBox,
                petKey,
                () => getPetCardFlipperHtml(myData.pet, myData.petFlipped, isTeamA ? 'theme-team-a' : 'theme-team-b'),
                myData.petFlipped
            );
            cardBox.onclick = () => toggleFlip(teamKey, 'pet');
        }

        if (specialBox) {
            const specKey = `dual-spec-${teamKey}-${myData.special.id}-${myData.specSeq}`;
            updateCardElement(
                specialBox,
                specKey,
                () => getSpecialCardFlipperHtml(myData.special, myData.specialFlipped),
                myData.specialFlipped
            );
            specialBox.onclick = () => toggleFlip(teamKey, 'special');
        }

        if (totalBox) {
            const petPow = myData.pet ? myData.pet.power : 0;
            const specVal = myData.special ? myData.special.val : 0;
            const netTotal = petPow + specVal;

            const myPetOpen = !myData.petFlipped;
            const mySpecOpen = !myData.specialFlipped;
            const myBothOpen = myPetOpen && mySpecOpen;
            const oppBothOpen = !oppData.petFlipped && !oppData.specialFlipped;
            const allFourOpen = myBothOpen && oppBothOpen;

            if (isRevealMode) {
                if (!myBothOpen) {
                    totalBox.style.display = 'none';
                    totalBox.innerHTML = '';
                } else {
                    totalBox.style.display = 'block';
                    const oppPetPow = oppData.pet ? oppData.pet.power : 0;
                    const oppSpecVal = oppData.special ? oppData.special.val : 0;
                    const oppNetTotal = oppPetPow + oppSpecVal;

                    let badgeHtml = '';
                    if (allFourOpen) {
                        if (myData.action === 'fold' && oppData.action === 'fight') {
                            badgeHtml = '<div class="pet-win-badge defeat">🏳️ หมอบ</div>';
                        } else if (oppData.action === 'fold' && myData.action === 'fight') {
                            badgeHtml = '<div class="pet-win-badge victory">👑 ชนะ</div>';
                        } else if (netTotal > oppNetTotal) {
                            badgeHtml = '<div class="pet-win-badge victory">🏆 ชนะ</div>';
                        } else if (netTotal < oppNetTotal) {
                            badgeHtml = '<div class="pet-win-badge defeat">💀 แพ้</div>';
                        } else {
                            badgeHtml = '<div class="pet-win-badge draw">🤝 เสมอ</div>';
                        }
                    }

                    totalBox.innerHTML = `
                        <div class="pet-calc-total">
                            <span class="pet-calc-total-val">${fmtNum(netTotal)}</span>
                        </div>
                        ${badgeHtml}
                    `;
                }
            } else {
                totalBox.style.display = 'none';
            }
        }
    }

    function initEvents() {
        const btnViewA = document.getElementById('pet-btn-view-a');
        const btnViewB = document.getElementById('pet-btn-view-b');
        const btnViewReveal = document.getElementById('pet-btn-view-reveal');

        if (btnViewA) btnViewA.addEventListener('click', () => setViewMode('teamA'));
        if (btnViewB) btnViewB.addEventListener('click', () => setViewMode('teamB'));
        if (btnViewReveal) btnViewReveal.addEventListener('click', () => setViewMode('reveal'));

        const btnFightA = document.getElementById('pet-btn-fight-a');
        const btnFoldA = document.getElementById('pet-btn-fold-a');
        const btnFightB = document.getElementById('pet-btn-fight-b');
        const btnFoldB = document.getElementById('pet-btn-fold-b');

        if (btnFightA) btnFightA.addEventListener('click', () => setTeamAction('A', 'fight'));
        if (btnFoldA) btnFoldA.addEventListener('click', () => setTeamAction('A', 'fold'));
        if (btnFightB) btnFightB.addEventListener('click', () => setTeamAction('B', 'fight'));
        if (btnFoldB) btnFoldB.addEventListener('click', () => setTeamAction('B', 'fold'));

        const btnNewRound = document.getElementById('pet-btn-new-round');
        const btnRerollSpecial = document.getElementById('pet-btn-reroll-special');

        if (btnNewRound) btnNewRound.addEventListener('click', newRound);
        if (btnRerollSpecial) btnRerollSpecial.addEventListener('click', rerollSpecialCards);

        // Team-specific reroll buttons
        const btnRerollPetA = document.getElementById('pet-reroll-pet-a');
        const btnRerollSpecialA = document.getElementById('pet-reroll-special-a');
        const btnRerollPetB = document.getElementById('pet-reroll-pet-b');
        const btnRerollSpecialB = document.getElementById('pet-reroll-special-b');

        if (btnRerollPetA) btnRerollPetA.addEventListener('click', (e) => { e.stopPropagation(); rerollPet('A'); });
        if (btnRerollSpecialA) btnRerollSpecialA.addEventListener('click', (e) => { e.stopPropagation(); rerollSpecial('A'); });
        if (btnRerollPetB) btnRerollPetB.addEventListener('click', (e) => { e.stopPropagation(); rerollPet('B'); });
        if (btnRerollSpecialB) btnRerollSpecialB.addEventListener('click', (e) => { e.stopPropagation(); rerollSpecial('B'); });

        // Single stage reroll buttons
        const btnSingleRerollPet = document.getElementById('pet-single-reroll-pet');
        const btnSingleRerollSpecial = document.getElementById('pet-single-reroll-special');

        if (btnSingleRerollPet) {
            btnSingleRerollPet.addEventListener('click', () => {
                const curTeam = state.viewMode === 'teamB' ? 'B' : 'A';
                rerollPet(curTeam);
            });
        }
        if (btnSingleRerollSpecial) {
            btnSingleRerollSpecial.addEventListener('click', () => {
                const curTeam = state.viewMode === 'teamB' ? 'B' : 'A';
                rerollSpecial(curTeam);
            });
        }

        window.addEventListener('keydown', (e) => {
            const petSection = document.getElementById('pet-mode');
            if (!petSection || !petSection.classList.contains('active')) return;
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (e.key === '1') {
                setViewMode('teamA');
            } else if (e.key === '2') {
                setViewMode('teamB');
            } else if (e.key === '3' || e.code === 'Space') {
                e.preventDefault();
                setViewMode('reveal');
            } else if (e.key === 'r' || e.key === 'R') {
                newRound();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initEvents();
        newRound();
    });
})();
