/**
 * Mystery Sound Guessing Game Logic (Always Random Edition)
 */
(function() {
    let currentSoundIndex = -1;
    let filteredSounds = [...MYSTERY_SOUNDS_DATA];
    let isRevealed = false;
    let isHintShown = false;
    let currentAudio = null;
    let isPlaying = false;
    let timerId = null;
    let timeLeft = 15;
    let selectedCategory = 'all';
    let playedCount = 0;
    let recentHistory = []; // Track last 10 played to avoid immediate duplicates

    // Sound effect on reveal
    function playWinJingle() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.35);
                }, idx * 80);
            });
        } catch(e) {}
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Elements
        const cardInner = document.getElementById('sg-card-inner');
        const playedCountBadge = document.getElementById('sg-played-count');
        const categoryBadge = document.getElementById('sg-category-badge');
        const btnPlaySound = document.getElementById('sg-btn-play-sound');
        const btnHint = document.getElementById('sg-btn-hint');
        const hintBox = document.getElementById('sg-hint-box');
        const hintText = document.getElementById('sg-hint-text');
        const btnReveal = document.getElementById('sg-btn-reveal');
        const btnRandom = document.getElementById('sg-btn-random');
        const btnRandomNext = document.getElementById('sg-btn-random-next');
        const categoryFilter = document.getElementById('sg-category-filter');
        const timerBadge = document.getElementById('sg-timer-badge');
        const visualizer = document.getElementById('sg-visualizer');

        // Reveal view elements
        const revealImage = document.getElementById('sg-reveal-image');
        const revealTitle = document.getElementById('sg-reveal-title');
        const revealEmoji = document.getElementById('sg-reveal-emoji');
        const revealCategory = document.getElementById('sg-reveal-category');

        function stopCurrentAudio() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            isPlaying = false;
            updatePlayButtonUI();
            if (visualizer) visualizer.classList.remove('playing');
        }

        function playSound() {
            if (currentSoundIndex < 0 || !filteredSounds[currentSoundIndex]) return;
            const soundItem = filteredSounds[currentSoundIndex];

            stopCurrentAudio();

            currentAudio = new Audio(soundItem.audioUrl);
            currentAudio.volume = 1.0;

            isPlaying = true;
            updatePlayButtonUI();
            if (visualizer) visualizer.classList.add('playing');

            currentAudio.play().catch(err => {
                console.warn('Audio play error:', err);
                isPlaying = false;
                updatePlayButtonUI();
                if (visualizer) visualizer.classList.remove('playing');
            });

            currentAudio.onended = () => {
                isPlaying = false;
                updatePlayButtonUI();
                if (visualizer) visualizer.classList.remove('playing');
            };

            startTimer();
        }

        function updatePlayButtonUI() {
            if (!btnPlaySound) return;
            if (isPlaying) {
                btnPlaySound.innerHTML = '<span>⏸️ กำลังเล่นเสียง... (คลิกเพื่อหยุด)</span>';
                btnPlaySound.classList.add('playing');
            } else {
                btnPlaySound.innerHTML = '<span>🔊 ฟังเสียงปริศนา</span>';
                btnPlaySound.classList.remove('playing');
            }
        }

        function startTimer() {
            clearInterval(timerId);
            timeLeft = 15;
            updateTimerDisplay();

            timerId = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    clearInterval(timerId);
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            if (!timerBadge) return;
            timerBadge.textContent = `⏱️ ${timeLeft}s`;
            if (timeLeft <= 5) {
                timerBadge.style.color = '#ef4444';
            } else {
                timerBadge.style.color = '#3b82f6';
            }
        }

        // Random pick without repeating recent items
        function pickRandomSound() {
            if (filteredSounds.length === 0) return;
            if (filteredSounds.length === 1) {
                loadSound(0);
                return;
            }

            let availableIndices = [];
            for (let i = 0; i < filteredSounds.length; i++) {
                if (!recentHistory.includes(filteredSounds[i].key) && i !== currentSoundIndex) {
                    availableIndices.push(i);
                }
            }

            if (availableIndices.length === 0) {
                // Reset history if all played
                recentHistory = [];
                for (let i = 0; i < filteredSounds.length; i++) {
                    if (i !== currentSoundIndex) availableIndices.push(i);
                }
            }

            const chosen = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            recentHistory.push(filteredSounds[chosen].key);
            if (recentHistory.length > 15) recentHistory.shift();

            playedCount++;
            loadSound(chosen);
        }

        function loadSound(index) {
            currentSoundIndex = index;
            isRevealed = false;
            isHintShown = false;

            stopCurrentAudio();
            clearInterval(timerId);
            timeLeft = 15;
            updateTimerDisplay();

            const item = filteredSounds[currentSoundIndex];

            // Card unflip
            if (cardInner) {
                cardInner.classList.remove('flipped');
            }

            // Text elements
            if (playedCountBadge) {
                playedCountBadge.textContent = `🎲 เล่นไปแล้ว ${playedCount} ข้อ`;
            }
            if (categoryBadge) {
                categoryBadge.textContent = item.category;
            }

            // Hint hide
            if (hintBox) hintBox.style.display = 'none';
            if (btnHint) btnHint.style.display = 'inline-flex';

            // Populate reveal side
            if (revealImage) {
                revealImage.src = item.image;
                revealImage.alt = item.title;
            }
            if (revealTitle) revealTitle.textContent = item.title;
            if (revealEmoji) revealEmoji.textContent = item.emoji;
            if (revealCategory) revealCategory.textContent = `หมวดหมู่: ${item.category}`;

            // Automatically play sound on new random pick for instant fun
            setTimeout(() => {
                playSound();
            }, 300);
        }

        function revealAnswer() {
            if (isRevealed) return;
            isRevealed = true;
            if (cardInner) cardInner.classList.add('flipped');
            playWinJingle();
            clearInterval(timerId);
        }

        function showHint() {
            if (isHintShown || currentSoundIndex < 0) return;
            isHintShown = true;
            const item = filteredSounds[currentSoundIndex];
            if (hintText) hintText.textContent = `💡 คำใบ้: ${item.hint}`;
            if (hintBox) hintBox.style.display = 'block';
            if (btnHint) btnHint.style.display = 'none';
        }

        // Category filter
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                selectedCategory = categoryFilter.value;
                if (selectedCategory === 'all') {
                    filteredSounds = [...MYSTERY_SOUNDS_DATA];
                } else {
                    filteredSounds = MYSTERY_SOUNDS_DATA.filter(it => it.category === selectedCategory);
                }
                pickRandomSound();
            });
        }

        // Button clicks
        if (btnPlaySound) {
            btnPlaySound.addEventListener('click', () => {
                if (isPlaying) stopCurrentAudio();
                else playSound();
            });
        }

        if (btnHint) btnHint.addEventListener('click', showHint);
        if (btnReveal) btnReveal.addEventListener('click', revealAnswer);

        if (btnRandom) {
            btnRandom.addEventListener('click', pickRandomSound);
        }

        if (btnRandomNext) {
            btnRandomNext.addEventListener('click', pickRandomSound);
        }

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            const soundGameSection = document.getElementById('sound-game-mode');
            if (!soundGameSection || !soundGameSection.classList.contains('active')) return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (isPlaying) stopCurrentAudio();
                else playSound();
            } else if (e.code === 'KeyR' || e.code === 'Enter') {
                if (!isRevealed) revealAnswer();
                else pickRandomSound();
            } else if (e.code === 'KeyH') {
                showHint();
            } else if (e.code === 'KeyN' || e.code === 'ArrowRight') {
                pickRandomSound();
            }
        });

        // Start with a random sound immediately!
        pickRandomSound();
    });
})();
