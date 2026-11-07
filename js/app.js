document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let savedGames = [];
    let gameState = {
        id: null,
        name: 'My Map',
        gridSize: 3,
        startingScore: 200,
        currentScore: 200,
        pointsMap: [], // Array of points to deduct per tile
        imageSrc: null,
        tilesRevealed: []
    };

    let cropper = null;

    let wheelState = {
        id: null,
        name: 'วงล้อสุ่ม',
        items: [],
        currentRotation: 0,
        isSpinning: false
    };
    let savedWheels = [];
    let wheelPlayHistory = [];
    let currentWinnerItem = null;
    const imageCache = {};

    // --- DOM Elements ---
    const btnHomeMode = document.getElementById('btn-home-mode');
    const btnPlayerMode = document.getElementById('btn-player-mode');
    const btnCreatorMode = document.getElementById('btn-creator-mode');
    const btnWheelMode = document.getElementById('btn-wheel-mode');

    const homeSection = document.getElementById('home-mode');
    const playerSection = document.getElementById('player-mode');
    const creatorSection = document.getElementById('creator-mode');
    const wheelSection = document.getElementById('wheel-mode');
    const wheelPlaySection = document.getElementById('wheel-play-mode');
    const wordSection = document.getElementById('word-mode');
    const btnWordMode = document.getElementById('btn-word-mode');

    // Home Elements
    const btnHomeCreate = document.getElementById('btn-home-create');
    const btnHomeCreateWheel = document.getElementById('btn-home-create-wheel');
    const btnHomeWordGame = document.getElementById('btn-home-word-game');
    const mapListContainer = document.getElementById('map-list-container');
    const mapList = document.getElementById('map-list');
    const wheelListContainer = document.getElementById('wheel-list-container');
    const wheelList = document.getElementById('wheel-list');

    // Creator Elements
    const mapNameInput = document.getElementById('map-name');
    const gridSizeSelect = document.getElementById('grid-size');
    const startingScoreInput = document.getElementById('starting-score');
    const aspectRatioSelect = document.getElementById('aspect-ratio');
    const imageUploadInput = document.getElementById('image-upload');
    const creatorGrid = document.getElementById('creator-grid');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    // Player Elements
    const gameGrid = document.getElementById('game-grid');
    const gameImageBg = document.getElementById('game-image-bg');
    const playerScoreDisplay = document.getElementById('player-score');
    const btnResetGame = document.getElementById('btn-reset-game');

    // Modal Elements
    const modal = document.getElementById('cropper-modal');
    const cropperImage = document.getElementById('cropper-image');
    const btnCancelCrop = document.getElementById('btn-cancel-crop');
    const btnApplyCrop = document.getElementById('btn-apply-crop');

    // Winner Modal Elements
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnFinishGame = document.getElementById('btn-finish-game');
    const winnerModal = document.getElementById('winner-modal');
    const finalScoreDisplay = document.getElementById('final-score-display');
    const winnerNameInput = document.getElementById('winner-name');
    const btnCancelWinner = document.getElementById('btn-cancel-winner');
    const btnSaveWinner = document.getElementById('btn-save-winner');

    // Wheel Edit Elements
    const wheelNameInput = document.getElementById('wheel-name');
    const btnSaveWheel = document.getElementById('btn-save-wheel');
    const wheelItemsList = document.getElementById('wheel-items-list');
    const btnAddWheelItem = document.getElementById('btn-add-wheel-item');
    const btnPresetYesNo = document.getElementById('btn-preset-yesno');
    const btnPresetNumbers = document.getElementById('btn-preset-numbers');
    const btnClearWheel = document.getElementById('btn-clear-wheel');
    const wheelCanvas = document.getElementById('wheel-canvas');

    // Wheel Play Elements
    const wheelPlayCanvas = document.getElementById('wheel-play-canvas');
    const wheelPlayTitle = document.getElementById('wheel-play-title');
    const btnSpinWheelPlay = document.getElementById('btn-spin-wheel-play');
    const wheelPlayPointer = document.querySelector('.wheel-play-pointer');
    const wheelHistoryList = document.getElementById('wheel-history-list');
    const btnClearHistory = document.getElementById('btn-clear-history');

    // Track which mode we're in for drawing
    let activeWheelMode = 'edit'; // 'edit' or 'play'
    
    // Wheel Winner Modal
    const wheelWinnerModal = document.getElementById('wheel-winner-modal');
    const wheelWinnerName = document.getElementById('wheel-winner-name');
    const wheelWinnerImg = document.getElementById('wheel-winner-img');
    const wheelWinnerImageContainer = document.getElementById('wheel-winner-image-container');
    const btnWheelWinnerRemove = document.getElementById('btn-wheel-winner-remove');
    const btnWheelWinnerKeep = document.getElementById('btn-wheel-winner-keep');
    const btnWheelWinnerHome = document.getElementById('btn-wheel-winner-home');

    // Word Game Elements
    const wordFlashcard = document.getElementById('word-flashcard');
    const wordDisplay = document.getElementById('word-display');
    const btnWordRandom = document.getElementById('btn-word-random');
    const wordCountDisplay = document.getElementById('word-count-display');

    // --- Initialization ---
    loadSettings();
    loadWheelState();
    
    if (typeof THAI_NOUNS !== 'undefined' && wordCountDisplay) {
        wordCountDisplay.textContent = THAI_NOUNS.length.toLocaleString();
    }
    
    switchTab('home'); // Start on home screen

    // --- Tab Switching ---
    btnHomeMode.addEventListener('click', () => switchTab('home'));
    btnPlayerMode.addEventListener('click', () => switchTab('player'));
    btnCreatorMode.addEventListener('click', () => {
        initNewMap();
        switchTab('creator');
    });
    btnHomeCreate.addEventListener('click', () => {
        initNewMap();
        switchTab('creator');
    });
    btnHomeCreateWheel.addEventListener('click', () => {
        initNewWheel();
        switchTab('wheel');
    });
    btnWheelMode.addEventListener('click', () => {
        if (!wheelState.id) {
            initNewWheel();
        }
        switchTab('wheel');
    });
    
    if (btnWordMode) {
        btnWordMode.addEventListener('click', () => switchTab('word'));
    }
    if (btnHomeWordGame) {
        btnHomeWordGame.addEventListener('click', () => switchTab('word'));
    }
    
    if (btnWordRandom) {
        let isSpinningWord = false;
        btnWordRandom.addEventListener('click', () => {
            if (isSpinningWord) return;
            
            if (typeof THAI_NOUNS !== 'undefined' && THAI_NOUNS.length > 0) {
                isSpinningWord = true;
                btnWordRandom.disabled = true;
                btnWordRandom.style.opacity = '0.5';
                
                // Animate card down slightly and change color to indicate spinning
                if (wordFlashcard) {
                    wordFlashcard.style.transform = 'scale(0.95)';
                    wordFlashcard.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
                    wordDisplay.style.color = '#8b5cf6';
                }
                
                let count = 0;
                // Random duration: spin 15 to 25 times
                const maxSpins = Math.floor(Math.random() * 10) + 15;
                const finalIndex = Math.floor(Math.random() * THAI_NOUNS.length);
                
                const spinInterval = setInterval(() => {
                    const tempIndex = Math.floor(Math.random() * THAI_NOUNS.length);
                    wordDisplay.textContent = THAI_NOUNS[tempIndex];
                    
                    count++;
                    if (count >= maxSpins) {
                        clearInterval(spinInterval);
                        
                        // Final reveal
                        wordDisplay.textContent = THAI_NOUNS[finalIndex];
                        wordDisplay.style.color = '#2d3748';
                        
                        if (wordFlashcard) {
                            // Big pop animation
                            wordFlashcard.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s ease';
                            wordFlashcard.style.transform = 'scale(1.1)';
                            wordFlashcard.style.boxShadow = '0 30px 60px rgba(124, 58, 237, 0.25)';
                            
                            // Let the user celebrate, maybe small confetti?
                            if (Math.random() > 0.5 && typeof launchConfetti === 'function') {
                                // Light confetti occasionally
                                setTimeout(launchConfetti, 100);
                            }
                            
                            setTimeout(() => {
                                wordFlashcard.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
                                wordFlashcard.style.transform = 'scale(1)';
                                wordFlashcard.style.boxShadow = '0 20px 50px rgba(0,0,0,0.06)';
                            }, 200);
                        }
                        
                        isSpinningWord = false;
                        btnWordRandom.disabled = false;
                        btnWordRandom.style.opacity = '1';
                    }
                }, 60); // Fast cycle every 60ms
                
            } else {
                wordDisplay.textContent = 'ไม่พบข้อมูลคำศัพท์';
            }
        });
    }
    
    if (wheelNameInput) {
        wheelNameInput.addEventListener('input', (e) => {
            wheelState.name = e.target.value;
        });
    }

    if (btnSaveWheel) {
        btnSaveWheel.addEventListener('click', () => {
            if (wheelState.items.length < 2) {
                alert('กรุณาเพิ่มตัวเลือกอย่างน้อย 2 รายการขึ้นไปก่อนบันทึก!');
                return;
            }
            saveWheel();
            alert('บันทึกวงล้อเรียบร้อยแล้ว!');
            switchTab('home');
        });
    }

    function switchTab(tab) {
        // Reset all
        btnHomeMode.classList.remove('active');
        btnPlayerMode.classList.remove('active');
        btnCreatorMode.classList.remove('active');
        btnWheelMode.classList.remove('active');
        if (btnWordMode) btnWordMode.classList.remove('active');
        
        homeSection.classList.remove('active');
        playerSection.classList.remove('active');
        creatorSection.classList.remove('active');
        wheelSection.classList.remove('active');
        wheelPlaySection.classList.remove('active');
        if (wordSection) wordSection.classList.remove('active');
        
        btnPlayerMode.style.display = 'none';

        if (tab === 'home') {
            btnHomeMode.classList.add('active');
            homeSection.classList.add('active');
            renderMapList();
            renderWheelList();
        } else if (tab === 'player') {
            btnPlayerMode.classList.add('active');
            btnPlayerMode.style.display = 'inline-block';
            playerSection.classList.add('active');
            initPlayerGrid();
        } else if (tab === 'creator') {
            btnCreatorMode.classList.add('active');
            creatorSection.classList.add('active');
            loadSettingsToCreatorForm();
        } else if (tab === 'wheel') {
            btnWheelMode.classList.add('active');
            wheelSection.classList.add('active');
            activeWheelMode = 'edit';
            if (wheelNameInput) {
                wheelNameInput.value = wheelState.name || '';
            }
            renderWheelItemsList();
            drawWheel();
        } else if (tab === 'wheel-play') {
            btnWheelMode.classList.add('active');
            wheelPlaySection.classList.add('active');
            activeWheelMode = 'play';
            wheelPlayHistory = []; // Reset history for new session
            renderWheelHistory();
            if (wheelPlayTitle) {
                wheelPlayTitle.textContent = wheelState.name || 'วงล้อสุ่ม';
            }
            drawWheel();
        } else if (tab === 'word') {
            if (btnWordMode) btnWordMode.classList.add('active');
            if (wordSection) wordSection.classList.add('active');
        }
    }

    function renderWheelHistory() {
        if (!wheelHistoryList) return;
        wheelHistoryList.innerHTML = '';
        if (wheelPlayHistory.length === 0) {
            wheelHistoryList.innerHTML = '<div class="history-empty">ยังไม่มีประวัติการสุ่ม</div>';
            return;
        }

        // Render from newest to oldest
        const reversedHistory = [...wheelPlayHistory].reverse();
        reversedHistory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            
            let imgHTML = '';
            if (item.imageSrc) {
                imgHTML = `<img src="${item.imageSrc}" class="history-item-img" alt="${item.text}">`;
            } else {
                imgHTML = `<div class="history-item-img" style="display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; font-size: 0.8rem;">🎁</div>`;
            }

            div.innerHTML = `
                ${imgHTML}
                <div class="history-item-text" title="${item.text}">${item.text || 'ไม่มีชื่อ'}</div>
                <div class="history-item-time">${item.time}</div>
            `;
            wheelHistoryList.appendChild(div);
        });
    }

    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            wheelPlayHistory = [];
            renderWheelHistory();
        });
    }

    // --- Home Logic ---
    function renderMapList() {
        mapList.innerHTML = '';
        if (savedGames.length === 0) {
            mapListContainer.style.display = 'none';
        } else {
            mapListContainer.style.display = 'block';
            savedGames.forEach(game => {
                const card = document.createElement('div');
                card.className = 'map-card';
                let leaderboardHTML = '';
                if (game.leaderboard && game.leaderboard.length > 0) {
                    leaderboardHTML = '<div class="leaderboard-list"><div class="leaderboard-title">Top Players</div>';
                    game.leaderboard.slice(0, 3).forEach((entry, idx) => {
                        leaderboardHTML += `<div class="leaderboard-item rank-${idx + 1}"><span>${idx + 1}. ${entry.name}</span><span>${entry.score} pts</span></div>`;
                    });
                    leaderboardHTML += '</div>';
                }

                const actionHTML = `
                    <div class="map-card-actions" style="display: flex; gap: 0.5rem; justify-content: flex-start; margin-top: auto; padding-top: 1rem;">
                        <button class="btn btn-edit" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Edit</button>
                        <button class="btn btn-delete" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: #ef4444; color: white;">Delete</button>
                    </div>
                `;

                card.innerHTML = `
                    <h4>${game.name || 'Untitled Map'}</h4>
                    <p>Grid: ${game.gridSize}x${game.gridSize}</p>
                    <p>Score: ${game.startingScore}</p>
                    ${leaderboardHTML}
                    ${actionHTML}
                `;

                card.addEventListener('click', () => {
                    // Load this game
                    gameState = { ...game };
                    switchTab('player');
                });

                // Edit and Delete handlers
                const btnEdit = card.querySelector('.btn-edit');
                const btnDelete = card.querySelector('.btn-delete');

                btnEdit.addEventListener('click', (e) => {
                    e.stopPropagation();
                    gameState = { ...game };
                    switchTab('creator');
                });

                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this map?')) {
                        savedGames = savedGames.filter(g => g.id !== game.id);
                        try {
                            localStorage.setItem('pictureRevealGames', JSON.stringify(savedGames));
                        } catch (err) { }
                        renderMapList();
                    }
                });

                mapList.appendChild(card);
            });
        }
    }

    function renderWheelList() {
        if (!wheelList || !wheelListContainer) return;
        wheelList.innerHTML = '';
        if (savedWheels.length === 0) {
            wheelListContainer.style.display = 'none';
        } else {
            wheelListContainer.style.display = 'block';
            savedWheels.forEach(wheel => {
                const card = document.createElement('div');
                card.className = 'map-card';

                // preview items (up to 4)
                let itemsPreviewHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); text-align: left; margin: 0.5rem 0; display: flex; flex-direction: column; gap: 0.2rem;">';
                const previewItems = (wheel.items || []).slice(0, 4);
                previewItems.forEach(item => {
                    const icon = item.imageSrc ? '🖼️ ' : '🔹 ';
                    itemsPreviewHTML += `<div>${icon}${item.text || 'ไม่มีชื่อ'}</div>`;
                });
                if (wheel.items && wheel.items.length > 4) {
                    itemsPreviewHTML += `<div style="font-style: italic;">และอีก ${wheel.items.length - 4} ตัวเลือก...</div>`;
                }
                itemsPreviewHTML += '</div>';

                const actionHTML = `
                    <div class="map-card-actions" style="display: flex; gap: 0.5rem; justify-content: flex-start; margin-top: auto; padding-top: 1rem;">
                        <button class="btn btn-spin-now primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; flex: 1;">หมุนวงล้อ</button>
                        <button class="btn btn-edit-wheel" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">แก้ไข</button>
                        <button class="btn btn-delete-wheel" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: #ef4444; color: white;">ลบ</button>
                    </div>
                `;

                card.innerHTML = `
                    <h4 style="font-size: 1.25rem;">🎡 ${wheel.name || 'Untitled Wheel'}</h4>
                    <p>${wheel.items ? wheel.items.length : 0} ตัวเลือก</p>
                    ${itemsPreviewHTML}
                    ${actionHTML}
                `;

                // Card click loads the wheel and takes them to play (spin)
                card.addEventListener('click', () => {
                    loadSpecificWheel(wheel);
                    switchTab('wheel-play');
                });

                // Spin Now handler
                const btnSpinNow = card.querySelector('.btn-spin-now');
                btnSpinNow.addEventListener('click', (e) => {
                    e.stopPropagation();
                    loadSpecificWheel(wheel);
                    switchTab('wheel-play');
                });

                // Edit handler
                const btnEditWheel = card.querySelector('.btn-edit-wheel');
                btnEditWheel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    loadSpecificWheel(wheel);
                    switchTab('wheel');
                });

                // Delete handler
                const btnDeleteWheel = card.querySelector('.btn-delete-wheel');
                btnDeleteWheel.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบวงล้อ "${wheel.name}"?`)) {
                        savedWheels = savedWheels.filter(w => w.id !== wheel.id);
                        try {
                            localStorage.setItem('pictureRevealSavedWheels', JSON.stringify(savedWheels));
                        } catch (err) { }
                        renderWheelList();
                    }
                });

                wheelList.appendChild(card);
            });
        }
    }

    function initNewWheel() {
        wheelState = {
            id: Date.now().toString(),
            name: `วงล้อสุ่ม ${savedWheels.length + 1}`,
            items: [
                { id: '1', text: 'ใช่', imageSrc: null },
                { id: '2', text: 'ไม่ใช่', imageSrc: null },
                { id: '3', text: 'อาจจะ', imageSrc: null }
            ],
            currentRotation: 0,
            isSpinning: false
        };
        if (wheelNameInput) {
            wheelNameInput.value = wheelState.name;
        }
        drawWheel();
    }

    function loadSpecificWheel(wheel) {
        wheelState.id = wheel.id;
        wheelState.name = wheel.name || 'วงล้อสุ่ม';
        wheelState.items = JSON.parse(JSON.stringify(wheel.items || []));
        wheelState.currentRotation = 0;
        wheelState.isSpinning = false;

        // Cache images
        wheelState.items.forEach(item => {
            if (item.imageSrc && !imageCache[item.id]) {
                const img = new Image();
                img.onload = () => {
                    imageCache[item.id] = img;
                    drawWheel();
                };
                img.src = item.imageSrc;
            }
        });

        if (wheelNameInput) {
            wheelNameInput.value = wheelState.name;
        }
    }

    function initNewMap() {
        gameState = {
            id: Date.now().toString(),
            name: `Map ${savedGames.length + 1}`,
            gridSize: 3,
            startingScore: 1000,
            currentScore: 1000,
            pointsMap: Array(9).fill(10),
            imageSrc: null,
            tilesRevealed: [],
            leaderboard: [],
            aspectRatio: '1:1'
        };
        if (imageUploadInput) imageUploadInput.value = '';
    }

    // --- Creator Logic ---
    gridSizeSelect.addEventListener('change', (e) => {
        gameState.gridSize = parseInt(e.target.value);
        // Reset points map based on new size
        const totalTiles = gameState.gridSize * gameState.gridSize;
        gameState.pointsMap = Array(totalTiles).fill(10); // Default 10
        initCreatorGrid();
    });

    if (aspectRatioSelect) {
        aspectRatioSelect.addEventListener('change', (e) => {
            gameState.aspectRatio = e.target.value;
            applyAspectRatio(creatorGrid.parentElement);
        });
    }

    function applyAspectRatio(container) {
        let ratio = 1; // 1:1
        if (gameState.aspectRatio === '16:9') ratio = 16 / 9;
        if (gameState.aspectRatio === '4:3') ratio = 4 / 3;
        container.style.setProperty('--ratio', ratio);
    }

    function initCreatorGrid() {
        const size = gameState.gridSize;
        creatorGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        creatorGrid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        creatorGrid.innerHTML = '';
        
        applyAspectRatio(creatorGrid.parentElement);

        const totalTiles = size * size;
        if (gameState.pointsMap.length !== totalTiles) {
            gameState.pointsMap = Array(totalTiles).fill(10);
        }

        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';

            const input = document.createElement('input');
            input.type = 'number';
            input.value = gameState.pointsMap[i];
            input.min = 0;

            input.addEventListener('change', (e) => {
                gameState.pointsMap[i] = parseInt(e.target.value) || 0;
            });

            tile.appendChild(input);
            creatorGrid.appendChild(tile);
        }

        // Apply bg image if exists
        if (gameState.imageSrc) {
            creatorGrid.parentElement.style.backgroundImage = `url(${gameState.imageSrc})`;
            creatorGrid.parentElement.style.backgroundSize = 'cover';
        } else {
            creatorGrid.parentElement.style.backgroundImage = 'none';
        }
    }

    // Image Upload and Cropping
    imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                cropperImage.src = event.target.result;
                modal.classList.add('active');

                if (cropper) cropper.destroy();

                let cropRatio = 1;
                if (gameState.aspectRatio === '16:9') cropRatio = 16 / 9;
                if (gameState.aspectRatio === '4:3') cropRatio = 4 / 3;

                cropper = new Cropper(cropperImage, {
                    aspectRatio: cropRatio,
                    viewMode: 1,
                });
            };
            reader.readAsDataURL(file);
        }
    });

    btnCancelCrop.addEventListener('click', () => {
        modal.classList.remove('active');
        if (cropper) cropper.destroy();
        imageUploadInput.value = '';
    });

    btnApplyCrop.addEventListener('click', () => {
        if (!cropper) return;

        let cropRatio = 1;
        if (gameState.aspectRatio === '16:9') cropRatio = 16 / 9;
        if (gameState.aspectRatio === '4:3') cropRatio = 4 / 3;

        const canvas = cropper.getCroppedCanvas({
            width: 800,
            height: Math.round(800 / cropRatio)
        });

        // Compress image to save in localStorage (Base64)
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        gameState.imageSrc = base64Image;

        modal.classList.remove('active');
        cropper.destroy();
        initCreatorGrid();
    });

    btnSaveSettings.addEventListener('click', () => {
        gameState.startingScore = parseInt(startingScoreInput.value) || 1000;
        gameState.name = mapNameInput.value || `Map ${savedGames.length + 1}`;
        if (!gameState.id) gameState.id = Date.now().toString();

        // Update or add to savedGames
        const existingIndex = savedGames.findIndex(g => g.id === gameState.id);
        if (existingIndex >= 0) {
            savedGames[existingIndex] = { ...gameState };
        } else {
            savedGames.push({ ...gameState });
        }

        // Save to localStorage
        try {
            localStorage.setItem('pictureRevealGames', JSON.stringify(savedGames));
            alert('Map saved successfully!');
            switchTab('home'); // Switch to home after saving to see the list
        } catch (e) {
            alert('Failed to save settings. The image might be too large for local storage. Try uploading a smaller image or use a lower resolution.');
            console.error(e);
        }
    });

    // --- Player Logic ---
    function initPlayerGrid() {
        const size = gameState.gridSize;
        gameGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        gameGrid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        gameGrid.innerHTML = '';
        gameGrid.parentElement.classList.add('player-mode');
        
        applyAspectRatio(gameGrid.parentElement);

        gameState.currentScore = gameState.startingScore;
        gameState.tilesRevealed = Array(size * size).fill(false);
        updateScoreDisplay();

        if (gameState.imageSrc) {
            gameImageBg.style.backgroundImage = `url(${gameState.imageSrc})`;
        } else {
            gameImageBg.style.backgroundColor = '#333';
            gameImageBg.style.backgroundImage = 'none';
        }

        const totalTiles = size * size;
        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.index = i;

            // Add tile number (top left corner)
            const tileNumber = document.createElement('span');
            tileNumber.className = 'tile-number';
            tileNumber.textContent = i + 1;
            tile.appendChild(tileNumber);

            // Add points deduction text
            const deductionText = document.createElement('span');
            deductionText.className = 'deduction-text';
            deductionText.textContent = `-${gameState.pointsMap[i] || 0}`;
            tile.appendChild(deductionText);

            tile.addEventListener('click', handleTileClick);
            gameGrid.appendChild(tile);
        }
    }

    function handleTileClick(e) {
        const tile = e.target;
        const index = parseInt(tile.dataset.index);

        if (gameState.tilesRevealed[index]) return; // Already revealed

        gameState.tilesRevealed[index] = true;
        tile.classList.add('revealed');

        // Deduct points
        const deduction = gameState.pointsMap[index] || 0;
        gameState.currentScore -= deduction;

        updateScoreDisplay();
    }

    function updateScoreDisplay() {
        playerScoreDisplay.textContent = gameState.currentScore;
        if (gameState.currentScore < 0) {
            playerScoreDisplay.classList.add('danger');
        } else {
            playerScoreDisplay.classList.remove('danger');
        }
    }

    btnResetGame.addEventListener('click', initPlayerGrid);

    // Fullscreen logic
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            const container = document.querySelector('.game-container');
            if (!document.fullscreenElement) {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        });
    }

    // Finish Game logic
    if (btnFinishGame) {
        btnFinishGame.addEventListener('click', () => {
            finalScoreDisplay.textContent = gameState.currentScore;
            winnerNameInput.value = '';
            winnerModal.classList.add('active');
        });
    }

    if (btnCancelWinner) {
        btnCancelWinner.addEventListener('click', () => {
            winnerModal.classList.remove('active');
        });
    }

    if (btnSaveWinner) {
        btnSaveWinner.addEventListener('click', () => {
            const name = winnerNameInput.value.trim() || 'Anonymous';
            if (!gameState.leaderboard) {
                gameState.leaderboard = [];
            }
            gameState.leaderboard.push({ name: name, score: gameState.currentScore });
            gameState.leaderboard.sort((a, b) => b.score - a.score);

            // Save to array
            const existingIndex = savedGames.findIndex(g => g.id === gameState.id);
            if (existingIndex >= 0) {
                savedGames[existingIndex] = { ...gameState };
                try {
                    localStorage.setItem('pictureRevealGames', JSON.stringify(savedGames));
                } catch (e) { }
            }

            winnerModal.classList.remove('active');
            switchTab('home'); // Go to home to see leaderboard
        });
    }

    // --- Storage ---
    function loadSettings() {
        const saved = localStorage.getItem('pictureRevealGames');
        if (saved) {
            try {
                savedGames = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading settings', e);
            }
        } else {
            // Migrate legacy settings if any
            const legacy = localStorage.getItem('pictureRevealSettings');
            if (legacy) {
                try {
                    const parsed = JSON.parse(legacy);
                    parsed.id = Date.now().toString();
                    parsed.name = 'Legacy Map';
                    savedGames.push(parsed);
                    localStorage.setItem('pictureRevealGames', JSON.stringify(savedGames));
                } catch (e) { }
            }
        }
    }

    function loadSettingsToCreatorForm() {
        mapNameInput.value = gameState.name || '';
        gridSizeSelect.value = gameState.gridSize;
        startingScoreInput.value = gameState.startingScore;
        if (aspectRatioSelect) {
            aspectRatioSelect.value = gameState.aspectRatio || '1:1';
        }
        initCreatorGrid();
    }

    // --- Spin Wheel Logic ---

    function loadSavedWheels() {
        const saved = localStorage.getItem('pictureRevealSavedWheels');
        if (saved) {
            try {
                savedWheels = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading saved wheels', e);
            }
        }
    }

    function loadWheelState() {
        loadSavedWheels();
        const saved = localStorage.getItem('pictureRevealWheelItems');
        if (saved) {
            try {
                wheelState.items = JSON.parse(saved);
                wheelState.name = 'วงล้อสุ่ม';
                wheelState.id = 'default_wheel';
            } catch (e) {
                console.error(e);
            }
        }
        
        // Default items if empty
        if (!wheelState.items || wheelState.items.length === 0) {
            wheelState.items = [
                { id: '1', text: 'ใช่', imageSrc: null },
                { id: '2', text: 'ไม่ใช่', imageSrc: null },
                { id: '3', text: 'อาจจะ', imageSrc: null }
            ];
            wheelState.name = 'วงล้อสุ่ม';
            wheelState.id = 'default_wheel';
        }
        
        // Pre-cache existing images
        wheelState.items.forEach(item => {
            if (item.imageSrc) {
                const img = new Image();
                img.onload = () => {
                    imageCache[item.id] = img;
                    drawWheel();
                };
                img.src = item.imageSrc;
            }
        });
    }

    function saveActiveWheelItems() {
        try {
            localStorage.setItem('pictureRevealWheelItems', JSON.stringify(wheelState.items));
        } catch (e) {
            console.error(e);
        }
    }

    function saveWheelState() {
        saveActiveWheelItems();
    }

    function saveWheel() {
        if (!wheelState.id || wheelState.id === 'default_wheel') {
            wheelState.id = Date.now().toString();
        }
        saveActiveWheelItems();

        const existingIndex = savedWheels.findIndex(w => w.id === wheelState.id);
        const wheelToSave = {
            id: wheelState.id,
            name: wheelState.name || 'วงล้อสุ่ม',
            items: JSON.parse(JSON.stringify(wheelState.items))
        };

        if (existingIndex >= 0) {
            savedWheels[existingIndex] = wheelToSave;
        } else {
            savedWheels.push(wheelToSave);
        }

        try {
            localStorage.setItem('pictureRevealSavedWheels', JSON.stringify(savedWheels));
        } catch (e) {
            alert('ล้มเหลวในการบันทึกข้อมูลวงล้อ เนื่องจากพื้นที่เก็บข้อมูลเต็ม (ไฟล์ภาพอาจจะใหญ่เกินไป)');
            console.error(e);
        }
    }

    const modernColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
        '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#a855f7'
    ];

    function renderWheelItemsList() {
        wheelItemsList.innerHTML = '';
        wheelState.items.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'wheel-item-row';
            
            // Label input
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'wheel-item-input';
            input.value = item.text;
            input.placeholder = `ตัวเลือกที่ ${index + 1}`;
            input.addEventListener('input', (e) => {
                item.text = e.target.value;
                saveWheelState();
                drawWheel();
            });

            // Image Upload Wrapper
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'wheel-image-upload-wrapper';
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.className = 'wheel-image-input';
            fileInput.accept = 'image/*';
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 128;
                        canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        
                        // Draw cover crop center
                        const size = Math.min(img.width, img.height);
                        const sx = (img.width - size) / 2;
                        const sy = (img.height - size) / 2;
                        ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 128);
                        
                        const base64 = canvas.toDataURL('image/jpeg', 0.85);
                        item.imageSrc = base64;
                        
                        // Cache and redraw
                        const cachedImg = new Image();
                        cachedImg.onload = () => {
                            imageCache[item.id] = cachedImg;
                            drawWheel();
                        };
                        cachedImg.src = base64;
                        
                        saveWheelState();
                        renderWheelItemsList();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });

            const previewBtn = document.createElement('div');
            previewBtn.className = 'wheel-image-preview-btn';
            
            if (item.imageSrc) {
                const imgTag = document.createElement('img');
                imgTag.src = item.imageSrc;
                previewBtn.appendChild(imgTag);
                
                // Add remove image button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn-remove-image';
                removeBtn.innerHTML = '✖';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.imageSrc = null;
                    if (imageCache[item.id]) delete imageCache[item.id];
                    saveWheelState();
                    renderWheelItemsList();
                    drawWheel();
                });
                imgWrapper.appendChild(removeBtn);
            } else {
                previewBtn.innerHTML = '🖼️';
            }

            imgWrapper.appendChild(fileInput);
            imgWrapper.appendChild(previewBtn);

            // Delete item button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-item';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'ลบตัวเลือกนี้';
            deleteBtn.addEventListener('click', () => {
                wheelState.items = wheelState.items.filter(i => i.id !== item.id);
                if (imageCache[item.id]) delete imageCache[item.id];
                saveWheelState();
                renderWheelItemsList();
                drawWheel();
            });

            row.appendChild(input);
            row.appendChild(imgWrapper);
            row.appendChild(deleteBtn);
            wheelItemsList.appendChild(row);
        });
    }

    btnAddWheelItem.addEventListener('click', () => {
        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            text: `ตัวเลือก ${wheelState.items.length + 1}`,
            imageSrc: null
        };
        wheelState.items.push(newItem);
        saveWheelState();
        renderWheelItemsList();
        drawWheel();
        
        // Scroll list to bottom
        setTimeout(() => {
            wheelItemsList.scrollTop = wheelItemsList.scrollHeight;
        }, 50);
    });

    // Presets
    btnPresetYesNo.addEventListener('click', () => {
        wheelState.items = [
            { id: 'yes', text: 'ใช่', imageSrc: null },
            { id: 'no', text: 'ไม่ใช่', imageSrc: null }
        ];
        saveWheelState();
        renderWheelItemsList();
        drawWheel();
    });

    btnPresetNumbers.addEventListener('click', () => {
        wheelState.items = Array.from({ length: 8 }, (_, idx) => ({
            id: `num_${idx + 1}`,
            text: `${idx + 1}`,
            imageSrc: null
        }));
        saveWheelState();
        renderWheelItemsList();
        drawWheel();
    });

    btnClearWheel.addEventListener('click', () => {
        if (confirm('คุณต้องการล้างรายการทั้งหมดหรือไม่?')) {
            wheelState.items = [];
            saveWheelState();
            renderWheelItemsList();
            drawWheel();
        }
    });

    // Draw Wheel Canvas
    function drawWheel() {
        const targetCanvas = activeWheelMode === 'play' ? wheelPlayCanvas : wheelCanvas;
        if (!targetCanvas) return;
        const ctx = targetCanvas.getContext('2d');
        const width = targetCanvas.width;
        const height = targetCanvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(cx, cy) - 20;

        ctx.clearRect(0, 0, width, height);

        const items = wheelState.items;
        const N = items.length;

        if (N === 0) {
            // Draw empty state placeholder
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#e2e8f0';
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();

            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('➕ เพิ่มตัวเลือกเพื่อเริ่มสุ่ม', cx, cy);
            return;
        }

        const segmentAngle = (Math.PI * 2) / N;

        // Save context and translate to center
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(wheelState.currentRotation);

        for (let i = 0; i < N; i++) {
            const startAngle = i * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const item = items[i];

            // 1. Draw Pie slice
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();

            // Alternating modern colors
            ctx.fillStyle = modernColors[i % modernColors.length];
            ctx.fill();

            // Sector separator border
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // 2. Draw Text and Image contents
            ctx.save();
            // Rotate to middle of this segment
            ctx.rotate(startAngle + segmentAngle / 2);

            // Draw label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px "Inter", sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            
            // Text shadow for high contrast
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            const textX = radius - 30;
            // Truncate text if too long
            let text = item.text || '';
            if (text.length > 12) {
                text = text.substring(0, 10) + '..';
            }
            
            // If there's an image, push text inwards slightly
            const drawRadius = item.imageSrc ? textX - 45 : textX;
            ctx.fillText(text, drawRadius, 0);

            // Draw Image if cached
            if (item.imageSrc && imageCache[item.id]) {
                const img = imageCache[item.id];
                ctx.save();
                
                // Position image in the segment
                ctx.translate(radius - 40, 0);
                
                // Draw white circle border for the image
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();

                // Clip image as circle
                ctx.beginPath();
                ctx.arc(0, 0, 17, 0, Math.PI * 2);
                ctx.clip();
                
                // Draw cropped image
                ctx.drawImage(img, -17, -17, 34, 34);
                ctx.restore();
            }

            ctx.restore();
        }

        ctx.restore();

        // 3. Draw outer glassmorphic ring border
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.stroke();

        // 4. Draw Center Shiny Glass Peg
        const centerRadius = 26;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        // Outer glow/shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // Peg Background
        ctx.beginPath();
        ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, centerRadius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#f1f5f9');
        grad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.shadowColor = 'transparent'; // Reset shadow
        
        // Peg Border
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Center silver pin core
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#64748b';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.restore();
    }

    // Audio Tick Engine
    let audioCtx = null;
    function playTickSound() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle';
            // Start higher, drop fast for wood tick
            osc.frequency.setValueAtTime(500, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.035);
            
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.035);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.04);
        } catch (e) {
            console.error(e);
        }
    }

    // Fullscreen Confetti Particle Generator
    function launchConfetti() {
        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849'];
        const container = document.body;
        
        for (let i = 0; i < 100; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.zIndex = '9999';
            particle.style.pointerEvents = 'none'; // Prevent blocking clicks
            particle.style.width = Math.random() * 10 + 6 + 'px';
            particle.style.height = Math.random() * 6 + 4 + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.top = '-10px';
            particle.style.opacity = Math.random();
            particle.style.transform = `rotate(${Math.random() * 360}deg)`;
            container.appendChild(particle);

            // Animate downwards
            const duration = Math.random() * 2000 + 1500;
            const horizontalShift = (Math.random() - 0.5) * 200;
            const animation = particle.animate([
                { top: '-10px', transform: `rotate(0deg) translateX(0px)` },
                { top: '105vh', transform: `rotate(${Math.random() * 1080}deg) translateX(${horizontalShift}px)`, opacity: 0 }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
            });

            animation.onfinish = () => particle.remove();
        }
    }

    // Spin animation handler
    btnSpinWheelPlay.addEventListener('click', () => {
        if (wheelState.isSpinning) return;
        const N = wheelState.items.length;
        if (N < 2) {
            alert('กรุณาเพิ่มตัวเลือกอย่างน้อย 2 รายการขึ้นไป!');
            return;
        }

        wheelState.isSpinning = true;
        btnSpinWheelPlay.disabled = true;
        btnSpinWheelPlay.style.opacity = '0.5';

        // Select a random target
        const numSpins = 5 + Math.random() * 4; // 5 to 9 full spins
        const startRotation = wheelState.currentRotation % (Math.PI * 2);
        const targetRotation = startRotation + numSpins * Math.PI * 2 + Math.random() * Math.PI * 2;
        const spinDuration = 4000; // 4 seconds
        const startTime = performance.now();

        const segmentAngle = (Math.PI * 2) / N;
        let lastSegmentIndex = -1;

        // Custom ease out quint
        function easeOutQuint(t) {
            return 1 - Math.pow(1 - t, 5);
        }

        function animateSpin(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            const easedProgress = easeOutQuint(progress);
            wheelState.currentRotation = startRotation + (targetRotation - startRotation) * easedProgress;

            // Redraw
            drawWheel();

            // Calculate current sector under pointer (at screen angle 1.5 * PI)
            let alpha = (1.5 * Math.PI - wheelState.currentRotation) % (Math.PI * 2);
            if (alpha < 0) alpha += Math.PI * 2;
            const currentSegmentIndex = Math.floor(alpha / segmentAngle) % N;

            // Trigger tick audio on segment transition
            if (currentSegmentIndex !== lastSegmentIndex) {
                playTickSound();
                
                // Visual pointer wiggle
                wheelPlayPointer.classList.remove('wiggling');
                void wheelPlayPointer.offsetWidth; // Force layout recalculation
                wheelPlayPointer.classList.add('wiggling');
                
                lastSegmentIndex = currentSegmentIndex;
            }

            if (progress < 1) {
                requestAnimationFrame(animateSpin);
            } else {
                // Done spinning
                wheelState.isSpinning = false;
                btnSpinWheelPlay.disabled = false;
                btnSpinWheelPlay.style.opacity = '1';
                wheelPlayPointer.classList.remove('wiggling');

                // Determine winner
                const winner = wheelState.items[currentSegmentIndex];
                currentWinnerItem = winner;

                // Add to history
                wheelPlayHistory.push({
                    text: winner.text,
                    imageSrc: winner.imageSrc,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                });
                renderWheelHistory();
                
                // Show winner
                wheelWinnerName.textContent = winner.text || 'ไม่มีชื่อ';
                if (winner.imageSrc) {
                    wheelWinnerImg.src = winner.imageSrc;
                    wheelWinnerImageContainer.style.display = 'block';
                } else {
                    wheelWinnerImg.src = '';
                    wheelWinnerImageContainer.style.display = 'none';
                }

                // Show modal & trigger confetti
                setTimeout(() => {
                    wheelWinnerModal.classList.add('active');
                    launchConfetti();
                }, 400);
            }
        }

        requestAnimationFrame(animateSpin);
    });

    if (btnWheelWinnerRemove) {
        btnWheelWinnerRemove.addEventListener('click', () => {
            if (currentWinnerItem) {
                // Remove the winning item from the current session
                wheelState.items = wheelState.items.filter(item => item.id !== currentWinnerItem.id);
                drawWheel();
            }
            wheelWinnerModal.classList.remove('active');
        });
    }

    if (btnWheelWinnerKeep) {
        btnWheelWinnerKeep.addEventListener('click', () => {
            // Do nothing, just close and spin again
            wheelWinnerModal.classList.remove('active');
        });
    }

    if (btnWheelWinnerHome) {
        btnWheelWinnerHome.addEventListener('click', () => {
            wheelWinnerModal.classList.remove('active');
            switchTab('home');
        });
    }
});
