/**
 * Mystery Sound Guessing Game Logic
 */
(function() {
    let currentSoundIndex = 0;
    let filteredSounds = [...MYSTERY_SOUNDS_DATA];
    let isRevealed = false;
    let isHintShown = false;
    let currentAudio = null;
    let isPlaying = false;
    let timerId = null;
    let timeLeft = 15;
    let selectedCategory = 'all';

    // Simple Web Audio Sound Effects for buttons & applause
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
                }, idx * 90);
            });
        } catch(e) {}
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Elements
        const cardInner = document.getElementById('sg-card-inner');
        const questionNumber = document.getElementById('sg-question-number');
        const categoryBadge = document.getElementById('sg-category-badge');
        const btnPlaySound = document.getElementById('sg-btn-play-sound');
        const btnHint = document.getElementById('sg-btn-hint');
        const hintBox = document.getElementById('sg-hint-box');
        const hintText = document.getElementById('sg-hint-text');
        const btnReveal = document.getElementById('sg-btn-reveal');
        const btnNext = document.getElementById('sg-btn-next');
        const btnPrev = document.getElementById('sg-btn-prev');
        const btnRandom = document.getElementById('sg-btn-random');
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
            const soundItem = filteredSounds[currentSoundIndex];
            if (!soundItem) return;

            stopCurrentAudio();

            currentAudio = new Audio(soundItem.audioUrl);
            currentAudio.volume = 1.0;

            isPlaying = true;
            updatePlayButtonUI();
            if (visualizer) visualizer.classList.add('playing');

            currentAudio.play().catch(err => {
                console.warn('Audio play failed, using fallback tone', err);
                playFallbackSynth();
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

        function loadQuestion(index) {
            if (index < 0 || index >= filteredSounds.length) return;
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
            if (questionNumber) {
                questionNumber.textContent = `ข้อที่ ${currentSoundIndex + 1} / ${filteredSounds.length}`;
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
        }

        function revealAnswer() {
            if (isRevealed) return;
            isRevealed = true;
            if (cardInner) cardInner.classList.add('flipped');
            playWinJingle();
            clearInterval(timerId);
        }

        function showHint() {
            if (isHintShown) return;
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
                loadQuestion(0);
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

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                const nextIndex = (currentSoundIndex + 1) % filteredSounds.length;
                loadQuestion(nextIndex);
            });
        }

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                const prevIndex = (currentSoundIndex - 1 + filteredSounds.length) % filteredSounds.length;
                loadQuestion(prevIndex);
            });
        }

        if (btnRandom) {
            btnRandom.addEventListener('click', () => {
                if (filteredSounds.length <= 1) return;
                let rnd;
                do {
                    rnd = Math.floor(Math.random() * filteredSounds.length);
                } while (rnd === currentSoundIndex);
                loadQuestion(rnd);
            });
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
                revealAnswer();
            } else if (e.code === 'KeyH') {
                showHint();
            } else if (e.code === 'ArrowRight') {
                const nextIndex = (currentSoundIndex + 1) % filteredSounds.length;
                loadQuestion(nextIndex);
            } else if (e.code === 'ArrowLeft') {
                const prevIndex = (currentSoundIndex - 1 + filteredSounds.length) % filteredSounds.length;
                loadQuestion(prevIndex);
            }
        });

        // Initialize question 0
        loadQuestion(0);
    });
})();
