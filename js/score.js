document.addEventListener('DOMContentLoaded', () => {
    // URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const controllerId = urlParams.get('controller');

    // UI Elements
    const setupView = document.getElementById('score-setup-view');
    const waitView = document.getElementById('score-wait-view');
    const displayView = document.getElementById('score-display-view');
    const controllerView = document.getElementById('score-controller-container');
    const appContainer = document.querySelector('.app-container');

    // Setup Elements
    const inputTeam1 = document.getElementById('score-team1-name');
    const inputTeam2 = document.getElementById('score-team2-name');
    const inputTarget = document.getElementById('score-target');
    const btnCreateRoom = document.getElementById('btn-create-score-room');
    const qrContainer = document.getElementById('score-qrcode');
    const btnCancelRoom = document.getElementById('btn-cancel-score-room');

    // Display Elements
    const displayTeam1Name = document.getElementById('display-team1-name');
    const displayTeam2Name = document.getElementById('display-team2-name');
    const displayTeam1Score = document.getElementById('display-team1-score');
    const displayTeam2Score = document.getElementById('display-team2-score');

    // Controller Elements
    const ctrlStatus = document.getElementById('controller-status');
    const ctrlTeam1NameInput = document.getElementById('ctrl-team1-name-input');
    const ctrlTeam2NameInput = document.getElementById('ctrl-team2-name-input');
    const ctrlTeam1Score = document.getElementById('ctrl-team1-score');
    const ctrlTeam2Score = document.getElementById('ctrl-team2-score');

    // Penalties (Old Modal elements kept just in case, but we use Roller)
    const penaltyModal = document.getElementById('penalty-modal');
    const penaltyTeamName = document.getElementById('penalty-team-name');
    const penaltyAction = document.getElementById('penalty-action');
    const btnClosePenalty = document.getElementById('btn-close-penalty');

    // New Roller Elements
    const penaltyRollerModal = document.getElementById('penalty-roller-modal');
    const penaltyRollerTeam = document.getElementById('penalty-roller-team');
    const penaltyRollerText = document.getElementById('penalty-roller-text');
    const btnRollerAccept = document.getElementById('btn-roller-accept');
    const scoreCardsWrapper = document.getElementById('score-cards-wrapper');

    // Controller Penalty Overlay Elements
    const ctrlPenaltyOverlay = document.getElementById('ctrl-penalty-overlay');
    const ctrlPenaltyTeam = document.getElementById('ctrl-penalty-team');
    const ctrlPenaltyText = document.getElementById('ctrl-penalty-text');
    const btnCtrlPenaltyAccept = document.getElementById('btn-ctrl-penalty-accept');

    const penaltiesList = [
        "กระโดดตบ 20 ครั้ง",
        "สควอท 15 ครั้ง",
        "วิดพื้น 15 ครั้ง",
    ];

    // State
    let peer = null;
    let conn = null;
    let roomId = null;
    let qrCode = null;

    let gameState = {
        team1: { name: 'ทีม A', score: 0 },
        team2: { name: 'ทีม B', score: 0 },
        targetScore: 10
    };

    // Initialize based on mode
    if (controllerId) {
        initControllerMode(controllerId);
    } else {
        initHostMode();
    }

    // ==========================================
    // HOST MODE
    // ==========================================
    function initHostMode() {
        btnCreateRoom.addEventListener('click', () => {
            gameState.team1.name = inputTeam1.value || 'ทีม A';
            gameState.team2.name = inputTeam2.value || 'ทีม B';
            gameState.targetScore = parseInt(inputTarget.value) || 10;
            gameState.team1.score = 0;
            gameState.team2.score = 0;

            setupView.style.display = 'none';
            waitView.style.display = 'block';
            displayView.style.display = 'none';

            // Init Peer
            peer = new Peer();
            peer.on('open', (id) => {
                roomId = id;
                const controllerUrl = window.location.origin + window.location.pathname + '?controller=' + id;

                qrContainer.innerHTML = '';
                qrCode = new QRCode(qrContainer, {
                    text: controllerUrl,
                    width: 256,
                    height: 256,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            });

            peer.on('connection', (connection) => {
                conn = connection;
                conn.on('open', () => {
                    // Connected!
                    waitView.style.display = 'none';
                    displayView.style.display = 'flex';

                    // Trigger entry animation on the cards wrapper (view has inline gradientBG animation)
                    if (scoreCardsWrapper) {
                        scoreCardsWrapper.classList.remove('score-display-active');
                        void scoreCardsWrapper.offsetWidth; // reflow
                        scoreCardsWrapper.classList.add('score-display-active');
                    }

                    displayTeam1Name.textContent = gameState.team1.name;
                    displayTeam2Name.textContent = gameState.team2.name;
                    updateHostDisplay();

                    // Send initial state to controller
                    conn.send({ type: 'init', state: gameState });
                });

                conn.on('data', (data) => {
                    if (data.type === 'update_score') {
                        if (data.team === 1) {
                            gameState.team1.score = Math.max(0, gameState.team1.score + data.amount);
                        } else if (data.team === 2) {
                            gameState.team2.score = Math.max(0, gameState.team2.score + data.amount);
                        }
                        updateHostDisplay();
                        checkPenalty();
                    } else if (data.type === 'update_name') {
                        if (data.team === 1) {
                            gameState.team1.name = data.name;
                            displayTeam1Name.textContent = data.name;
                        } else if (data.team === 2) {
                            gameState.team2.name = data.name;
                            displayTeam2Name.textContent = data.name;
                        }
                        // Broadcast back to keep in sync
                        updateHostDisplay();
                    } else if (data.type === 'penalty_accept') {
                        // Controller accepted the penalty — same as host pressing the button
                        acceptPenalty();
                    }
                });

                conn.on('close', () => {
                    alert('รีโมทตัดการเชื่อมต่อ');
                });
            });

            peer.on('error', (err) => {
                console.error(err);
                alert('เกิดข้อผิดพลาดในการสร้างห้อง: ' + err.type);
            });
        });

        btnCancelRoom.addEventListener('click', () => {
            if (peer) {
                peer.destroy();
                peer = null;
            }
            waitView.style.display = 'none';
            setupView.style.display = 'block';
        });

        if (btnClosePenalty) {
            btnClosePenalty.addEventListener('click', () => {
                penaltyModal.classList.remove('active');
            });
        }
        if (btnRollerAccept) {
            btnRollerAccept.addEventListener('click', () => {
                acceptPenalty();
            });
        }

        const btnScoreExit = document.getElementById('btn-score-exit');
        if (btnScoreExit) {
            btnScoreExit.addEventListener('click', () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                if (peer) {
                    peer.destroy();
                    peer = null;
                }
                displayView.style.display = 'none';
                setupView.style.display = 'block';
            });
        }

        const btnScoreFullscreen = document.getElementById('btn-score-fullscreen');
        if (btnScoreFullscreen) {
            btnScoreFullscreen.addEventListener('click', () => {
                const elem = displayView;
                if (!document.fullscreenElement) {
                    if (elem.requestFullscreen) {
                        elem.requestFullscreen();
                    } else if (elem.webkitRequestFullscreen) { /* Safari */
                        elem.webkitRequestFullscreen();
                    } else if (elem.msRequestFullscreen) { /* IE11 */
                        elem.msRequestFullscreen();
                    }
                    btnScoreFullscreen.textContent = "↙️";
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) { /* Safari */
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) { /* IE11 */
                        document.msExitFullscreen();
                    }
                    btnScoreFullscreen.textContent = "📺";
                }
            });
        }
    }

    function updateHostDisplay() {
        if (displayTeam1Score && displayTeam1Score.textContent !== String(gameState.team1.score)) {
            displayTeam1Score.classList.remove('score-bump');
            void displayTeam1Score.offsetWidth;
            displayTeam1Score.classList.add('score-bump');
        }
        if (displayTeam2Score && displayTeam2Score.textContent !== String(gameState.team2.score)) {
            displayTeam2Score.classList.remove('score-bump');
            void displayTeam2Score.offsetWidth;
            displayTeam2Score.classList.add('score-bump');
        }
        displayTeam1Score.textContent = gameState.team1.score;
        displayTeam2Score.textContent = gameState.team2.score;

        // Update controller too
        if (conn && conn.open) {
            conn.send({ type: 'sync', state: gameState });
        }
    }

    function acceptPenalty() {
        // Hide host modal
        if (penaltyRollerModal) penaltyRollerModal.style.display = 'none';

        // Remove blur from score cards
        if (scoreCardsWrapper) {
            scoreCardsWrapper.style.filter = '';
            scoreCardsWrapper.style.pointerEvents = '';
            scoreCardsWrapper.style.transition = 'filter 0.4s ease';
        }

        // Reset scores
        if (gameState.team1.score >= gameState.targetScore) gameState.team1.score = 0;
        if (gameState.team2.score >= gameState.targetScore) gameState.team2.score = 0;

        // Send sync + hide_penalty to controller
        if (conn && conn.open) {
            conn.send({ type: 'hide_penalty', state: gameState });
        }

        updateHostDisplay();
        isWaitingForAccept = false;
    }

    let isRolling = false;
    let isWaitingForAccept = false;

    function checkPenalty() {
        if (isRolling || isWaitingForAccept) return;

        // ทีมที่ "แพ้" คือทีมที่คะแนนไม่ถึงเป้าหมาย เมื่ออีกทีมชนะ
        let penalizedTeam = null; // ทีมที่ต้องรับบทลงโทษ (ผู้แพ้)
        if (gameState.team1.score >= gameState.targetScore) {
            // team1 ชนะ → team2 แพ้ → team2 รับโทษ
            penalizedTeam = gameState.team2.name;
        } else if (gameState.team2.score >= gameState.targetScore) {
            // team2 ชนะ → team1 แพ้ → team1 รับโทษ
            penalizedTeam = gameState.team1.name;
        }

        if (penalizedTeam) {
            isRolling = true;
            isWaitingForAccept = true;

            // Show the roller modal overlay
            if (penaltyRollerTeam) penaltyRollerTeam.textContent = penalizedTeam;
            if (penaltyRollerModal) {
                penaltyRollerModal.style.display = 'flex';
            }

            // Blur the score cards behind the overlay
            if (scoreCardsWrapper) {
                scoreCardsWrapper.style.transition = 'filter 0.4s ease';
                scoreCardsWrapper.style.filter = 'blur(8px)';
                scoreCardsWrapper.style.pointerEvents = 'none';
            }
            if (btnRollerAccept) btnRollerAccept.style.display = 'none';
            if (penaltyRollerText) {
                penaltyRollerText.style.color = '#1f2937';
                penaltyRollerText.style.transform = 'scale(1)';
            }

            // Randomize animation
            let spins = 0;
            const maxSpins = Math.floor(Math.random() * 10) + 20; // 20-30 spins
            const finalIndex = Math.floor(Math.random() * penaltiesList.length);

            const spinInterval = setInterval(() => {
                const tempIndex = Math.floor(Math.random() * penaltiesList.length);
                if (penaltyRollerText) {
                    penaltyRollerText.textContent = penaltiesList[tempIndex];
                    // Add a small bounce effect
                    penaltyRollerText.style.transform = `translateY(${Math.random() * 10 - 5}px)`;
                }

                spins++;
                if (spins >= maxSpins) {
                    clearInterval(spinInterval);

                    // Final Reveal
                    if (penaltyRollerText) {
                        penaltyRollerText.textContent = penaltiesList[finalIndex];
                        penaltyRollerText.style.transform = 'scale(1.1)';
                        penaltyRollerText.style.color = '#ef4444';
                    }

                    setTimeout(() => {
                        if (penaltyRollerText) penaltyRollerText.style.transform = 'scale(1)';
                        if (btnRollerAccept) btnRollerAccept.style.display = 'inline-block';

                        // Send penalty result to controller
                        if (conn && conn.open) {
                            conn.send({
                                type: 'penalty_show',
                                teamName: penalizedTeam,
                                penalty: penaltiesList[finalIndex]
                            });
                        }

                        if (typeof launchConfetti === 'function') {
                            launchConfetti();
                        }
                        isRolling = false;
                    }, 300);
                }
            }, 60);
        }
    }


    // ==========================================
    // CONTROLLER MODE
    // ==========================================
    function initControllerMode(hostId) {
        // Hide main app
        if (appContainer) appContainer.style.display = 'none';

        // Show controller view
        controllerView.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        ctrlStatus.textContent = "กำลังเชื่อมต่อกับห้อง...";
        ctrlStatus.style.color = "#fbbf24"; // yellow

        peer = new Peer();
        peer.on('open', (id) => {
            conn = peer.connect(hostId, { reliable: true });

            conn.on('open', () => {
                ctrlStatus.textContent = "เชื่อมต่อสำเร็จ! 🟢";
                ctrlStatus.style.color = "#10b981"; // green
            });

            conn.on('data', (data) => {
                if (data.type === 'init' || data.type === 'sync') {
                    gameState = data.state;
                    updateControllerDisplay();
                } else if (data.type === 'penalty_show') {
                    // Host finished rolling — show penalty overlay on controller
                    if (ctrlPenaltyTeam) ctrlPenaltyTeam.textContent = data.teamName;
                    if (ctrlPenaltyText) ctrlPenaltyText.textContent = data.penalty;
                    if (ctrlPenaltyOverlay) ctrlPenaltyOverlay.style.display = 'flex';
                } else if (data.type === 'hide_penalty') {
                    // Host or controller accepted — hide overlay and sync state
                    if (ctrlPenaltyOverlay) ctrlPenaltyOverlay.style.display = 'none';
                    gameState = data.state;
                    updateControllerDisplay();
                }
            });

            conn.on('close', () => {
                ctrlStatus.textContent = "ขาดการเชื่อมต่อ 🔴";
                ctrlStatus.style.color = "#ef4444"; // red
            });
        });

        peer.on('error', (err) => {
            console.error(err);
            ctrlStatus.textContent = "เชื่อมต่อไม่สำเร็จ 🔴";
            ctrlStatus.style.color = "#ef4444";
            alert("ไม่สามารถเชื่อมต่อได้: " + err.type);
        });

        // Controller Buttons
        document.getElementById('btn-t1-plus').addEventListener('click', () => sendScoreUpdate(1, 1));
        document.getElementById('btn-t1-minus').addEventListener('click', () => sendScoreUpdate(1, -1));
        document.getElementById('btn-t2-plus').addEventListener('click', () => sendScoreUpdate(2, 1));
        document.getElementById('btn-t2-minus').addEventListener('click', () => sendScoreUpdate(2, -1));

        // Name change listeners
        if (ctrlTeam1NameInput) {
            ctrlTeam1NameInput.addEventListener('change', (e) => {
                const newName = e.target.value.trim() || 'ทีม A';
                gameState.team1.name = newName;
                if (conn && conn.open) conn.send({ type: 'update_name', team: 1, name: newName });
            });
        }
        if (ctrlTeam2NameInput) {
            ctrlTeam2NameInput.addEventListener('change', (e) => {
                const newName = e.target.value.trim() || 'ทีม B';
                gameState.team2.name = newName;
                if (conn && conn.open) conn.send({ type: 'update_name', team: 2, name: newName });
            });
        }

        // Controller Penalty Accept Button
        if (btnCtrlPenaltyAccept) {
            btnCtrlPenaltyAccept.addEventListener('click', () => {
                // Hide overlay on controller immediately
                if (ctrlPenaltyOverlay) ctrlPenaltyOverlay.style.display = 'none';
                // Tell host to accept and reset
                if (conn && conn.open) conn.send({ type: 'penalty_accept' });
            });
        }
    }

    function updateControllerDisplay() {
        if (ctrlTeam1NameInput) ctrlTeam1NameInput.value = gameState.team1.name;
        if (ctrlTeam2NameInput) ctrlTeam2NameInput.value = gameState.team2.name;
        if (ctrlTeam1Score) {
            if (ctrlTeam1Score.textContent !== String(gameState.team1.score)) {
                ctrlTeam1Score.classList.remove('score-bump');
                void ctrlTeam1Score.offsetWidth;
                ctrlTeam1Score.classList.add('score-bump');
            }
            ctrlTeam1Score.textContent = gameState.team1.score;
        }
        if (ctrlTeam2Score) {
            if (ctrlTeam2Score.textContent !== String(gameState.team2.score)) {
                ctrlTeam2Score.classList.remove('score-bump');
                void ctrlTeam2Score.offsetWidth;
                ctrlTeam2Score.classList.add('score-bump');
            }
            ctrlTeam2Score.textContent = gameState.team2.score;
        }
    }

    function sendScoreUpdate(team, amount) {
        // Prevent negative locally before sending
        if (team === 1 && gameState.team1.score + amount < 0) return;
        if (team === 2 && gameState.team2.score + amount < 0) return;

        // Update local speculatively
        if (team === 1) gameState.team1.score += amount;
        else if (team === 2) gameState.team2.score += amount;

        updateControllerDisplay();

        if (conn && conn.open) {
            conn.send({ type: 'update_score', team: team, amount: amount });
        }
    }

    // Expose host score adjustment as global (called by inline onclick on display view buttons)
    window.hostAdjustScore = function (team, amount) {
        if (isWaitingForAccept) return; // ห้ามแก้ขณะรอยืนยันบทลงโทษ
        if (team === 1) {
            gameState.team1.score = Math.max(0, gameState.team1.score + amount);
        } else if (team === 2) {
            gameState.team2.score = Math.max(0, gameState.team2.score + amount);
        }
        updateHostDisplay();
        checkPenalty();
    };
});
