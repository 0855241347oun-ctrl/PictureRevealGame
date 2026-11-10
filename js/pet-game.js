/**
 * pet-game.js - ระบบการทำงานของเกม "วัดใจแต้มสัตว์เลี้ยง" (Offline Host Controlled)
 * - สัตว์ไม่ต้องบอกขอบ เปิดมาให้ซ่อนทั้งสองใบ (Face Down)
 * - สุ่มแล้วมีคำใบ้อยู่บนหลังการ์ดสัตว์ (5 คำใบ้ต่อสัตว์ 1 ตัว)
 * - การ์ดแต้มพิเศษแบ่งเป็น 2 ใบ บน-ล่าง (Special 1 / Special 2) แสดงขอบสีชัดเจน
 * - 4 การ์ดตัวพลิกเกม:
 *     1. x2 พลังสัตว์ (Legendary Gold)
 *     2. ขอสลับสัตว์ (Legendary Gold)
 *     3. บังคับตัวเองสู้ (Uncommon Green)
 *     4. บังคับคู่แข่งสู้ (Rare Blue)
 * - โหมดเฉลย (Duel Arena): การ์ดซ่อนไว้ก่อน ให้คลิกเลือกเปิดทีละใบ
 * - แอนิเมชันสุ่มแบบ Card Snap (สไลด์ลงตรงๆ สแน็ปเข้าล็อก คมชัด นิ่งสนิท ไม่เอียง)
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

    // สุ่มรอบใหม่: แจกสัตว์ 1 ใบ + การ์ดพิเศษ 2 ใบ (บน-ล่าง) ให้ทั้ง 2 ทีม
    function newRound() {
        const petA = getRandomPetCard();
        const petB = getRandomPetCard(petA.id);
        const specA1 = getRandomSpecialCard();
        const specA2 = getRandomSpecialCard(specA1.id);
        const specB1 = getRandomSpecialCard();
        const specB2 = getRandomSpecialCard(specB1.id);
        state.dealSeq++;

        state.cardA = {
            pet: petA,
            special1: specA1,
            special2: specA2,
            petFlipped: true,
            special1Flipped: true,
            special2Flipped: true,
            action: 'none',
            petSeq: state.dealSeq,
            spec1Seq: state.dealSeq,
            spec2Seq: state.dealSeq
        };

        state.cardB = {
            pet: petB,
            special1: specB1,
            special2: specB2,
            petFlipped: true,
            special1Flipped: true,
            special2Flipped: true,
            action: 'none',
            petSeq: state.dealSeq,
            spec1Seq: state.dealSeq,
            spec2Seq: state.dealSeq
        };

        playSfxDeal();
        render();

        [
            'pet-card-box-a', 'pet-special1-box-a', 'pet-special2-box-a',
            'pet-card-box-b', 'pet-special1-box-b', 'pet-special2-box-b',
            'pet-single-pet-card', 'pet-single-special1-card', 'pet-single-special2-card'
        ].forEach(triggerCardSnap);
    }

    // สุ่มสัตว์เฉพาะทีม
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

        if (state.viewMode === 'reveal') {
            triggerCardSnap(team === 'A' ? 'pet-card-box-a' : 'pet-card-box-b');
        } else {
            triggerCardSnap('pet-single-pet-card');
        }
    }

    // สุ่มการ์ดพิเศษใบบน (Special 1)
    function rerollSpecial1(team) {
        if (!state.cardA || !state.cardB) return;
        state.dealSeq++;
        const target = team === 'A' ? state.cardA : state.cardB;
        target.special1 = getRandomSpecialCard(target.special2 ? target.special2.id : null);
        target.special1Flipped = true;
        target.spec1Seq = state.dealSeq;
        playSfxDeal();
        render();

        if (state.viewMode === 'reveal') {
            triggerCardSnap(team === 'A' ? 'pet-special1-box-a' : 'pet-special1-box-b');
        } else {
            triggerCardSnap('pet-single-special1-card');
        }
    }

    // สุ่มการ์ดพิเศษใบล่าง (Special 2)
    function rerollSpecial2(team) {
        if (!state.cardA || !state.cardB) return;
        state.dealSeq++;
        const target = team === 'A' ? state.cardA : state.cardB;
        target.special2 = getRandomSpecialCard(target.special1 ? target.special1.id : null);
        target.special2Flipped = true;
        target.spec2Seq = state.dealSeq;
        playSfxDeal();
        render();

        if (state.viewMode === 'reveal') {
            triggerCardSnap(team === 'A' ? 'pet-special2-box-a' : 'pet-special2-box-b');
        } else {
            triggerCardSnap('pet-single-special2-card');
        }
    }

    // สุ่มการ์ดพิเศษทั้งหมด (ทั้งบน-ล่าง ทั้งสองทีม)
    function rerollSpecialCards() {
        if (!state.cardA || !state.cardB) return;
        state.dealSeq++;
        state.cardA.special1 = getRandomSpecialCard();
        state.cardA.special2 = getRandomSpecialCard(state.cardA.special1.id);
        state.cardB.special1 = getRandomSpecialCard();
        state.cardB.special2 = getRandomSpecialCard(state.cardB.special1.id);

        state.cardA.special1Flipped = true;
        state.cardA.special2Flipped = true;
        state.cardB.special1Flipped = true;
        state.cardB.special2Flipped = true;

        state.cardA.spec1Seq = state.dealSeq;
        state.cardA.spec2Seq = state.dealSeq;
        state.cardB.spec1Seq = state.dealSeq;
        state.cardB.spec2Seq = state.dealSeq;

        playSfxDeal();
        render();

        [
            'pet-special1-box-a', 'pet-special2-box-a',
            'pet-special1-box-b', 'pet-special2-box-b',
            'pet-single-special1-card', 'pet-single-special2-card'
        ].forEach(triggerCardSnap);
    }

    // พลิกการ์ด (เปิด/ซ่อน) หมุน 3D
    function toggleFlip(team, type) {
        const data = team === 'A' ? state.cardA : state.cardB;
        if (!data) return;

        if (type === 'pet') {
            data.petFlipped = !data.petFlipped;
        } else if (type === 'special1') {
            data.special1Flipped = !data.special1Flipped;
        } else if (type === 'special2') {
            data.special2Flipped = !data.special2Flipped;
        }

        playSfxFlip();
        render();

        // โหมดเฉลย: ถ้าเปิดครบทั้ง 6 ใบแล้ว เล่นเสียงฉลอง
        if (state.viewMode === 'reveal') {
            const allOpened = !state.cardA.petFlipped && !state.cardA.special1Flipped && !state.cardA.special2Flipped &&
                              !state.cardB.petFlipped && !state.cardB.special1Flipped && !state.cardB.special2Flipped;
            if (allOpened) {
                setTimeout(() => {
                    const battle = calcBattle();
                    if (battle && battle.teamA.total !== battle.teamB.total) {
                        playSfxVictory();
                    }
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
                state.cardA.special1Flipped = true;
                state.cardA.special2Flipped = true;
            }
            if (state.cardB) {
                state.cardB.petFlipped = true;
                state.cardB.special1Flipped = true;
                state.cardB.special2Flipped = true;
            }
            playSfxClash();
        } else {
            playSfxFlip();
        }
        render();
    }

    function setTeamAction(team, action) {
        const battle = calcBattle();
        const target = team === 'A' ? state.cardA : state.cardB;
        const targetBattle = team === 'A' ? battle?.teamA : battle?.teamB;

        if (target) {
            // ถ้าโดนบังคับสู้ จะไม่สามารถเปลี่ยนเป็นหมอบได้
            if (targetBattle && targetBattle.lockedFight && action === 'fold') {
                target.action = 'fight';
            } else {
                target.action = target.action === action ? 'none' : action;
            }
        }
        render();
    }

    // คำนวณผลการรบ รวมผลของการ์ดตัวพลิกเกมทั้ง 4 ชนิด
    function calcBattle() {
        if (!state.cardA || !state.cardB) return null;

        // 1. ตรวจสอบการ์ดสลับสัตว์ (Swap Pet)
        const aSwapCount = (state.cardA.special1?.type === 'swap' ? 1 : 0) + (state.cardA.special2?.type === 'swap' ? 1 : 0);
        const bSwapCount = (state.cardB.special1?.type === 'swap' ? 1 : 0) + (state.cardB.special2?.type === 'swap' ? 1 : 0);
        const isSwapped = ((aSwapCount + bSwapCount) % 2) === 1;

        const effectivePetA = isSwapped ? state.cardB.pet : state.cardA.pet;
        const effectivePetB = isSwapped ? state.cardA.pet : state.cardB.pet;

        // 2. ตัวคูณพลังสัตว์ (x2)
        let multA = 1;
        if (state.cardA.special1?.type === 'multiplier') multA *= (state.cardA.special1.mult || 2);
        if (state.cardA.special2?.type === 'multiplier') multA *= (state.cardA.special2.mult || 2);

        let multB = 1;
        if (state.cardB.special1?.type === 'multiplier') multB *= (state.cardB.special1.mult || 2);
        if (state.cardB.special2?.type === 'multiplier') multB *= (state.cardB.special2.mult || 2);

        const basePowA = effectivePetA ? effectivePetA.power : 0;
        const basePowB = effectivePetB ? effectivePetB.power : 0;
        const boostedPetA = basePowA * multA;
        const boostedPetB = basePowB * multB;

        // 3. แต้มบวก/ลบ จากการ์ดพิเศษ
        const valA1 = state.cardA.special1?.val || 0;
        const valA2 = state.cardA.special2?.val || 0;
        const flatA = valA1 + valA2;

        const valB1 = state.cardB.special1?.val || 0;
        const valB2 = state.cardB.special2?.val || 0;
        const flatB = valB1 + valB2;

        const totalA = boostedPetA + flatA;
        const totalB = boostedPetB + flatB;

        // 4. การ์ดบังคับสู้ (Force Fight)
        // ทีม A โดนบังคับสู้ถ้า: ตัวเองมีการ์ด force_self_fight หรือ คู่แข่งมีการ์ด force_opp_fight
        const aHasForceSelf = (state.cardA.special1?.type === 'force_self_fight') || (state.cardA.special2?.type === 'force_self_fight');
        const bHasForceSelf = (state.cardB.special1?.type === 'force_self_fight') || (state.cardB.special2?.type === 'force_self_fight');
        const aHasForceOpp = (state.cardA.special1?.type === 'force_opp_fight') || (state.cardA.special2?.type === 'force_opp_fight');
        const bHasForceOpp = (state.cardB.special1?.type === 'force_opp_fight') || (state.cardB.special2?.type === 'force_opp_fight');

        const lockedA = aHasForceSelf || bHasForceOpp;
        const lockedB = bHasForceSelf || aHasForceOpp;

        // ถ้าถูกล็อกสู้ ปรับ action ให้เป็น fight อัตโนมัติถ้าเดิมเป็น fold
        if (lockedA && state.cardA.action === 'fold') state.cardA.action = 'fight';
        if (lockedB && state.cardB.action === 'fold') state.cardB.action = 'fight';

        return {
            isSwapped,
            teamA: {
                effectivePet: effectivePetA,
                mult: multA,
                flat: flatA,
                val1: valA1,
                val2: valA2,
                total: totalA,
                lockedFight: lockedA,
                action: lockedA && state.cardA.action === 'fold' ? 'fight' : state.cardA.action
            },
            teamB: {
                effectivePet: effectivePetB,
                mult: multB,
                flat: flatB,
                val1: valB1,
                val2: valB2,
                total: totalB,
                lockedFight: lockedB,
                action: lockedB && state.cardB.action === 'fold' ? 'fight' : state.cardB.action
            }
        };
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

    // HTML การ์ดพิเศษ 3D Flipper (รองรับแบบครึ่งใบ บน-ล่าง และตัวพลิกเกม)
    function getSpecialCardFlipperHtml(specData, isFlipped, slotLabel) {
        const borderInfo = getSpecialBorderInfo(specData.tier);
        const isPos = specData.val >= 0;
        const isGameChanger = !!specData.type;
        const typeClass = specData.type ? `type-${specData.type}` : '';
        const valClass = isGameChanger ? 'game-changer' : (isPos ? 'pos' : 'neg');
        const slotBadge = slotLabel ? `<span class="pet-card-slot-label">${slotLabel}</span>` : '';

        return `
            <div class="pet-card-flipper ${isFlipped ? 'is-flipped' : ''}">
                <div class="pet-special-inner card-front tier-${specData.tier} ${typeClass}">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        ${slotBadge}
                        <span class="pet-special-border-badge tier-${specData.tier}">${borderInfo.label}</span>
                    </div>
                    <span class="pet-special-icon">${specData.icon}</span>
                    <span class="pet-special-name" title="${specData.name}">${specData.name}</span>
                    <span class="pet-special-val ${valClass}">${specData.text}</span>
                </div>
                <div class="pet-special-inner card-back tier-${specData.tier}">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        ${slotBadge}
                        <span class="pet-special-border-badge tier-${specData.tier}">${borderInfo.label}</span>
                    </div>
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

        const battle = calcBattle();

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
                renderSingleStage('A', state.cardA, 'B', state.cardB, battle);
            } else {
                if (btnViewB) btnViewB.classList.add('active');
                renderSingleStage('B', state.cardB, 'A', state.cardA, battle);
            }
        } else {
            if (singleStage) singleStage.style.display = 'none';
            if (dualStage) dualStage.style.display = 'block';
            if (btnViewReveal) btnViewReveal.classList.add('active');
            renderDualStage(battle, true);
        }
    }

    // Render Single Stage
    function renderSingleStage(activeTeamKey, activeData, oppTeamKey, oppData, battle) {
        const singlePetBox = document.getElementById('pet-single-pet-card');
        const singleSpec1Box = document.getElementById('pet-single-special1-card');
        const singleSpec2Box = document.getElementById('pet-single-special2-card');
        const isTeamA = activeTeamKey === 'A';
        const theme = isTeamA ? 'theme-team-a' : 'theme-team-b';
        const activeBattle = isTeamA ? battle?.teamA : battle?.teamB;

        if (singlePetBox) {
            const petKey = `single-pet-${activeTeamKey}-${activeData.pet.id}-${activeData.petSeq}`;
            updateCardElement(
                singlePetBox,
                petKey,
                () => getPetCardFlipperHtml(activeData.pet, activeData.petFlipped, theme),
                activeData.petFlipped
            );
            singlePetBox.onclick = () => toggleFlip(activeTeamKey, 'pet');
        }

        if (singleSpec1Box && activeData.special1) {
            const spec1Key = `single-spec1-${activeTeamKey}-${activeData.special1.id}-${activeData.spec1Seq}`;
            updateCardElement(
                singleSpec1Box,
                spec1Key,
                () => getSpecialCardFlipperHtml(activeData.special1, activeData.special1Flipped, 'การ์ดบน'),
                activeData.special1Flipped
            );
            singleSpec1Box.onclick = () => toggleFlip(activeTeamKey, 'special1');
        }

        if (singleSpec2Box && activeData.special2) {
            const spec2Key = `single-spec2-${activeTeamKey}-${activeData.special2.id}-${activeData.spec2Seq}`;
            updateCardElement(
                singleSpec2Box,
                spec2Key,
                () => getSpecialCardFlipperHtml(activeData.special2, activeData.special2Flipped, 'การ์ดล่าง'),
                activeData.special2Flipped
            );
            singleSpec2Box.onclick = () => toggleFlip(activeTeamKey, 'special2');
        }

        const btnFight = document.getElementById('pet-single-btn-fight');
        const btnFold = document.getElementById('pet-single-btn-fold');

        if (btnFight) {
            btnFight.classList.toggle('active-action', activeData.action === 'fight');
            btnFight.onclick = () => setTeamAction(activeTeamKey, 'fight');
        }

        if (btnFold) {
            const isLocked = activeBattle?.lockedFight;
            btnFold.classList.toggle('is-locked', !!isLocked);
            btnFold.disabled = !!isLocked;
            btnFold.title = isLocked ? 'ถูกบังคับสู้ ห้ามหมอบเด็ดขาด!' : 'หมอบยอมแพ้';
            btnFold.classList.toggle('active-action', activeData.action === 'fold');
            btnFold.onclick = () => {
                if (!isLocked) setTeamAction(activeTeamKey, 'fold');
            };
        }
    }

    // Render Dual Stage
    function renderDualStage(battle, isRevealMode) {
        renderDualColumn('A', state.cardA, state.cardB, battle, isRevealMode);
        renderDualColumn('B', state.cardB, state.cardA, battle, isRevealMode);
    }

    function renderDualColumn(teamKey, myData, oppData, battle, isRevealMode) {
        const isTeamA = teamKey === 'A';
        const cardBox = document.getElementById(isTeamA ? 'pet-card-box-a' : 'pet-card-box-b');
        const spec1Box = document.getElementById(isTeamA ? 'pet-special1-box-a' : 'pet-special1-box-b');
        const spec2Box = document.getElementById(isTeamA ? 'pet-special2-box-a' : 'pet-special2-box-b');
        const totalBox = document.getElementById(isTeamA ? 'pet-total-box-a' : 'pet-total-box-b');
        const actionStatus = document.getElementById(isTeamA ? 'pet-action-status-a' : 'pet-action-status-b');
        const btnFight = document.getElementById(isTeamA ? 'pet-btn-fight-a' : 'pet-btn-fight-b');
        const btnFold = document.getElementById(isTeamA ? 'pet-btn-fold-a' : 'pet-btn-fold-b');

        const myBattle = isTeamA ? battle?.teamA : battle?.teamB;
        const oppBattle = isTeamA ? battle?.teamB : battle?.teamA;

        if (btnFight) btnFight.classList.toggle('active-action', myData.action === 'fight');

        if (btnFold) {
            const isLocked = myBattle?.lockedFight;
            btnFold.classList.toggle('is-locked', !!isLocked);
            btnFold.disabled = !!isLocked;
            btnFold.title = isLocked ? 'ถูกบังคับสู้ ห้ามหมอบเด็ดขาด!' : 'หมอบยอมแพ้';
            btnFold.classList.toggle('active-action', myData.action === 'fold');
        }

        if (actionStatus) {
            if (myData.action === 'fight') {
                actionStatus.innerHTML = '<span class="pet-badge-fight">⚔️</span>';
            } else if (myData.action === 'fold') {
                actionStatus.innerHTML = '<span class="pet-badge-fold">🏳️</span>';
            } else {
                actionStatus.innerHTML = '';
            }
        }

        // การ์ดสัตว์
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

        // การ์ดพิเศษ 1 (บน)
        if (spec1Box && myData.special1) {
            const spec1Key = `dual-spec1-${teamKey}-${myData.special1.id}-${myData.spec1Seq}`;
            updateCardElement(
                spec1Box,
                spec1Key,
                () => getSpecialCardFlipperHtml(myData.special1, myData.special1Flipped, 'การ์ดบน'),
                myData.special1Flipped
            );
            spec1Box.onclick = () => toggleFlip(teamKey, 'special1');
        }

        // การ์ดพิเศษ 2 (ล่าง)
        if (spec2Box && myData.special2) {
            const spec2Key = `dual-spec2-${teamKey}-${myData.special2.id}-${myData.spec2Seq}`;
            updateCardElement(
                spec2Box,
                spec2Key,
                () => getSpecialCardFlipperHtml(myData.special2, myData.special2Flipped, 'การ์ดล่าง'),
                myData.special2Flipped
            );
            spec2Box.onclick = () => toggleFlip(teamKey, 'special2');
        }

        // กล่องคะแนนสุทธิ (Total Box)
        if (totalBox && myBattle) {
            const myAllOpen = !myData.petFlipped && !myData.special1Flipped && !myData.special2Flipped;
            const oppAllOpen = !oppData.petFlipped && !oppData.special1Flipped && !oppData.special2Flipped;
            const allSixOpen = myAllOpen && oppAllOpen;

            if (isRevealMode) {
                if (!myAllOpen) {
                    totalBox.style.display = 'none';
                    totalBox.innerHTML = '';
                } else {
                    totalBox.style.display = 'block';

                    let badgeHtml = '';
                    if (allSixOpen) {
                        if (myData.action === 'fold' && oppData.action === 'fight') {
                            badgeHtml = '<div class="pet-win-badge defeat">🏳️ หมอบ</div>';
                        } else if (oppData.action === 'fold' && myData.action === 'fight') {
                            badgeHtml = '<div class="pet-win-badge victory">👑 ชนะ</div>';
                        } else if (myData.action === 'fold' && oppData.action === 'fold') {
                            badgeHtml = '<div class="pet-win-badge draw">🏳️ หมอบทั้งคู่</div>';
                        } else if (myBattle.total > oppBattle.total) {
                            badgeHtml = '<div class="pet-win-badge victory">🏆 ชนะ</div>';
                        } else if (myBattle.total < oppBattle.total) {
                            badgeHtml = '<div class="pet-win-badge defeat">💀 แพ้</div>';
                        } else {
                            badgeHtml = '<div class="pet-win-badge draw">🤝 เสมอ</div>';
                        }
                    }

                    // แสดงรายละเอียดการคำนวณแต้ม (Breakdown)
                    const effectivePet = myBattle.effectivePet;
                    const mult = myBattle.mult;
                    const val1 = myBattle.val1;
                    const val2 = myBattle.val2;

                    let formulaParts = [];
                    formulaParts.push(`สัตว์: <strong>${fmtNum(effectivePet.power)}</strong>`);
                    if (mult > 1) {
                        formulaParts.push(`<span style="color:#eab308; font-weight:800;">(x${mult} = ${fmtNum(effectivePet.power * mult)})</span>`);
                    }
                    if (val1 !== 0) {
                        formulaParts.push(`<span style="color:${val1 > 0 ? '#16a34a' : '#dc2626'}; font-weight:700;">${val1 > 0 ? '+' : ''}${val1}</span>`);
                    }
                    if (val2 !== 0) {
                        formulaParts.push(`<span style="color:${val2 > 0 ? '#16a34a' : '#dc2626'}; font-weight:700;">${val2 > 0 ? '+' : ''}${val2}</span>`);
                    }

                    const swapBadge = battle.isSwapped
                        ? `<div class="pet-swap-notice">🔄 ได้รับ: ${effectivePet.emoji} ${effectivePet.name}</div>`
                        : '';

                    totalBox.innerHTML = `
                        ${swapBadge}
                        <div class="pet-calc-breakdown" style="font-size: 0.85rem; color: #475569; margin-bottom: 0.35rem; display: flex; flex-direction: column; gap: 0.15rem; align-items: center;">
                            <div>${formulaParts.join(' ')}</div>
                        </div>
                        <div class="pet-calc-total">
                            <span class="pet-calc-total-val">${fmtNum(myBattle.total)}</span>
                        </div>
                        ${badgeHtml}
                    `;
                }
            } else {
                totalBox.style.display = 'none';
            }
        }
    }

    // --- ระบบ Card Compendium / สมุดคลังการ์ดทั้งหมด ---
    function initPetCardDex() {
        const btnOpen = document.getElementById('pet-btn-card-dex');
        const modal = document.getElementById('pet-card-dex-modal');
        const btnClose = document.getElementById('pet-dex-close');
        const backdrop = modal ? modal.querySelector('.pet-dex-backdrop') : null;
        const tabBtns = document.querySelectorAll('.pet-dex-tab-btn');
        const viewPets = document.getElementById('pet-dex-view-pets');
        const viewSpecials = document.getElementById('pet-dex-view-specials');
        const petGrid = document.getElementById('pet-dex-pet-grid');
        const specialsContainer = document.getElementById('pet-dex-specials-container');
        const searchInput = document.getElementById('pet-dex-search-input');
        const searchClear = document.getElementById('pet-dex-search-clear');
        const filterChips = document.querySelectorAll('.pet-dex-chip');

        let currentTierFilter = 'all';
        let searchQuery = '';

        if (!btnOpen || !modal) return;

        function openModal() {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            renderPetGrid();
            renderSpecialsGrid();
        }

        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }

        btnOpen.addEventListener('click', openModal);
        if (btnClose) btnClose.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        // Keyboard Esc to close
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });

        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const target = btn.dataset.tab;
                if (target === 'pets') {
                    if (viewPets) viewPets.style.display = 'block';
                    if (viewSpecials) viewSpecials.style.display = 'none';
                } else {
                    if (viewPets) viewPets.style.display = 'none';
                    if (viewSpecials) viewSpecials.style.display = 'block';
                }
            });
        });

        // Filter Chips
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentTierFilter = chip.dataset.tier;
                renderPetGrid();
            });
        });

        // Search Input
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim().toLowerCase();
                if (searchClear) searchClear.style.display = searchQuery ? 'flex' : 'none';
                renderPetGrid();
            });
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                searchClear.style.display = 'none';
                searchInput.focus();
                renderPetGrid();
            });
        }

        // Render Pets Grid
        function renderPetGrid() {
            if (!petGrid || typeof PET_CARDS === 'undefined') return;

            let filtered = PET_CARDS.filter(pet => {
                const borderInfo = getPetBorderInfo(pet.power);
                if (currentTierFilter !== 'all' && borderInfo.tier !== currentTierFilter) {
                    return false;
                }
                if (searchQuery) {
                    const nameMatch = pet.name.toLowerCase().includes(searchQuery);
                    const clueMatch = (pet.clues || [pet.clue]).some(c => c.toLowerCase().includes(searchQuery));
                    if (!nameMatch && !clueMatch) return false;
                }
                return true;
            });

            if (filtered.length === 0) {
                petGrid.innerHTML = `
                    <div class="pet-dex-empty">
                        <span class="pet-dex-empty-icon">🔍</span>
                        <p>ไม่พบการ์ดสัตว์ที่ตรงกับคำค้นหา "${searchQuery}"</p>
                    </div>
                `;
                return;
            }

            petGrid.innerHTML = filtered.map(pet => {
                const borderInfo = getPetBorderInfo(pet.power);
                const clues = pet.clues || [pet.clue];
                return `
                    <div class="pet-dex-card tier-${borderInfo.tier}">
                        <div class="pet-dex-card-top">
                            <span class="pet-dex-emoji">${pet.emoji}</span>
                            <div class="pet-dex-meta">
                                <div class="pet-dex-name">${pet.name}</div>
                                <span class="pet-dex-tier-badge tier-${borderInfo.tier}">${borderInfo.label}</span>
                            </div>
                            <div class="pet-dex-power-val">${fmtNum(pet.power)}</div>
                        </div>
                        <div class="pet-dex-clues-section">
                            <div class="pet-dex-clues-title">💡 คำใบ้ที่เป็นไปได้ (${clues.length} คำ):</div>
                            <div class="pet-dex-clue-tags">
                                ${clues.map(c => `<span class="pet-dex-tag">${c}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Render Specials Grid (รวมทั้งตัวพลิกเกมที่สุ่มทุกขอบสี และการ์ดปรับแต้ม)
        function renderSpecialsGrid() {
            if (!specialsContainer) return;

            let html = '';

            // 1. หมวดการ์ดตัวพลิกเกม (Game Changers - สุ่มออกได้ทุกขอบสี)
            if (typeof GAME_CHANGER_CARDS !== 'undefined' && GAME_CHANGER_CARDS.length > 0) {
                html += `
                    <div class="pet-dex-special-section tier-gamechanger">
                        <div class="pet-dex-special-sec-header">
                            <h3>⚡ การ์ดตัวพลิกเกม (${GAME_CHANGER_CARDS.length} ใบ - สุ่มออกได้ทุกขอบสี ⚪ 🟢 🔵 🟡)</h3>
                            <p>การ์ดระดับพิเศษที่ขอบสีจะถูกสุ่มหลอกตา ลุ้นระทึกได้ทุกรอบ ไม่จำกัดขอบสี!</p>
                        </div>
                        <div class="pet-dex-special-grid">
                            ${GAME_CHANGER_CARDS.map(card => {
                                const typeDesc = card.desc ? `<div class="pet-dex-special-desc" style="font-size: 0.76rem; color: #64748b; margin-top: 2px;">${card.desc}</div>` : '';
                                return `
                                    <div class="pet-dex-special-card game-changer">
                                        <div class="pet-dex-special-icon">${card.icon}</div>
                                        <div class="pet-dex-special-details">
                                            <div class="pet-dex-special-name">${card.name}</div>
                                            <span class="pet-dex-special-tag game-changer">⚡ สุ่มออกทุกขอบสี</span>
                                            ${typeDesc}
                                        </div>
                                        <div class="pet-dex-special-val game-changer">${card.text}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            // 2. หมวดการ์ดปรับแต้มปกติ (Score Modifiers)
            if (typeof SCORE_CARDS !== 'undefined') {
                const tierMeta = {
                    gold: { title: '🟡 การ์ดสีทอง (Legendary - ออกยาก 8%)', desc: 'การ์ดแต้มมหาศาล บอสโดนถึงทรุด หรือดันตัวชนจนล้มบอสได้' },
                    blue: { title: '🔵 การ์ดสีน้ำเงิน (Rare - ออก 20%)', desc: 'เสี่ยงสูง ลุ้นหนัก แต้มระดับสูงช่วยดันตัวล่างขึ้นมาชน' },
                    green: { title: '🟢 การ์ดสีเขียว (Uncommon - ออก 30%)', desc: 'แต้มระดับปานกลาง ช่วยให้สัตว์ทั่วไปเอาชนะได้' },
                    white: { title: '⚪ การ์ดสีขาว (Common - ออก 42%)', desc: 'ปรับแต่งแต้มเบาๆ เสริมกำลังตัวกากให้มีลุ้น' }
                };

                const tierOrder = ['gold', 'blue', 'green', 'white'];

                html += tierOrder.map(tierKey => {
                    const meta = tierMeta[tierKey];
                    const cards = SCORE_CARDS[tierKey] || [];
                    return `
                        <div class="pet-dex-special-section tier-${tierKey}">
                            <div class="pet-dex-special-sec-header">
                                <h3>${meta.title}</h3>
                                <p>${meta.desc}</p>
                            </div>
                            <div class="pet-dex-special-grid">
                                ${cards.map(card => {
                                    const isPos = card.val >= 0;
                                    return `
                                        <div class="pet-dex-special-card tier-${card.tier} ${isPos ? 'pos' : 'neg'}">
                                            <div class="pet-dex-special-icon">${card.icon}</div>
                                            <div class="pet-dex-special-details">
                                                <div class="pet-dex-special-name">${card.name}</div>
                                                <span class="pet-dex-special-tag ${isPos ? 'pos' : 'neg'}">${isPos ? 'บัฟเพิ่มพลัง' : 'คำสาปลดแต้ม'}</span>
                                            </div>
                                            <div class="pet-dex-special-val ${isPos ? 'pos' : 'neg'}">${card.text}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            specialsContainer.innerHTML = html;
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

        // Team A reroll buttons
        const btnRerollPetA = document.getElementById('pet-reroll-pet-a');
        const btnRerollSpec1A = document.getElementById('pet-reroll-special1-a');
        const btnRerollSpec2A = document.getElementById('pet-reroll-special2-a');

        if (btnRerollPetA) btnRerollPetA.addEventListener('click', (e) => { e.stopPropagation(); rerollPet('A'); });
        if (btnRerollSpec1A) btnRerollSpec1A.addEventListener('click', (e) => { e.stopPropagation(); rerollSpecial1('A'); });
        if (btnRerollSpec2A) btnRerollSpec2A.addEventListener('click', (e) => { e.stopPropagation(); rerollSpecial2('A'); });

        // Team B reroll buttons
        const btnRerollPetB = document.getElementById('pet-reroll-pet-b');
        const btnRerollSpec1B = document.getElementById('pet-reroll-special1-b');
        const btnRerollSpec2B = document.getElementById('pet-reroll-special2-b');

        if (btnRerollPetB) btnRerollPetB.addEventListener('click', (e) => { e.stopPropagation(); rerollPet('B'); });
        if (btnRerollSpec1B) btnRerollSpec1B.addEventListener('click', (e) => { e.stopPropagation(); rerollSpecial1('B'); });
        if (btnRerollSpec2B) btnRerollSpec2B.addEventListener('click', (e) => { e.stopPropagation(); rerollSpecial2('B'); });

        // Single stage reroll buttons
        const btnSingleRerollPet = document.getElementById('pet-single-reroll-pet');
        const btnSingleRerollSpec1 = document.getElementById('pet-single-reroll-special1');
        const btnSingleRerollSpec2 = document.getElementById('pet-single-reroll-special2');

        if (btnSingleRerollPet) {
            btnSingleRerollPet.addEventListener('click', () => {
                const curTeam = state.viewMode === 'teamB' ? 'B' : 'A';
                rerollPet(curTeam);
            });
        }
        if (btnSingleRerollSpec1) {
            btnSingleRerollSpec1.addEventListener('click', () => {
                const curTeam = state.viewMode === 'teamB' ? 'B' : 'A';
                rerollSpecial1(curTeam);
            });
        }
        if (btnSingleRerollSpec2) {
            btnSingleRerollSpec2.addEventListener('click', () => {
                const curTeam = state.viewMode === 'teamB' ? 'B' : 'A';
                rerollSpecial2(curTeam);
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
        initPetCardDex();
        newRound();
    });
})();
