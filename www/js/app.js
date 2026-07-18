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

    // --- DOM Elements ---
    const btnHomeMode = document.getElementById('btn-home-mode');
    const btnPlayerMode = document.getElementById('btn-player-mode');
    const btnCreatorMode = document.getElementById('btn-creator-mode');

    const homeSection = document.getElementById('home-mode');
    const playerSection = document.getElementById('player-mode');
    const creatorSection = document.getElementById('creator-mode');

    // Home Elements
    const btnHomeCreate = document.getElementById('btn-home-create');
    const mapListContainer = document.getElementById('map-list-container');
    const mapList = document.getElementById('map-list');

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

    // --- Initialization ---
    loadSettings();
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

    function switchTab(tab) {
        // Reset all
        btnHomeMode.classList.remove('active');
        btnPlayerMode.classList.remove('active');
        btnCreatorMode.classList.remove('active');
        homeSection.classList.remove('active');
        playerSection.classList.remove('active');
        creatorSection.classList.remove('active');
        btnPlayerMode.style.display = 'none';

        if (tab === 'home') {
            btnHomeMode.classList.add('active');
            homeSection.classList.add('active');
            renderMapList();
        } else if (tab === 'player') {
            btnPlayerMode.classList.add('active');
            btnPlayerMode.style.display = 'inline-block';
            playerSection.classList.add('active');
            initPlayerGrid();
        } else if (tab === 'creator') {
            btnCreatorMode.classList.add('active');
            creatorSection.classList.add('active');
            loadSettingsToCreatorForm();
        }
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
                    <div class="map-card-actions" style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
                        <button class="btn btn-edit" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Edit</button>
                        <button class="btn btn-delete" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: var(--danger); color: white;">Delete</button>
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
});
