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
    const ctrlTeam1Name = document.getElementById('ctrl-team1-name');
    const ctrlTeam2Name = document.getElementById('ctrl-team2-name');
    const ctrlTeam1Score = document.getElementById('ctrl-team1-score');
    const ctrlTeam2Score = document.getElementById('ctrl-team2-score');
    
    // Penalties
    const penaltyModal = document.getElementById('penalty-modal');
    const penaltyTeamName = document.getElementById('penalty-team-name');
    const penaltyAction = document.getElementById('penalty-action');
    const btnClosePenalty = document.getElementById('btn-close-penalty');

    const penaltiesList = [
        "กระโดดตบ 10 ครั้ง",
        "สควอท 10 ครั้ง",
        "วิ่งอยู่กับที่ 30 วินาที",
        "วิดพื้น 5 ครั้ง",
        "เต้นไก่ย่าง 1 รอบ",
        "แพลงก์ 30 วินาที",
        "หมุนรอบตัวเอง 5 รอบ",
        "ซิทอัพ 10 ครั้ง"
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
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            });

            peer.on('connection', (connection) => {
                conn = connection;
                conn.on('open', () => {
                    // Connected!
                    waitView.style.display = 'none';
                    displayView.style.display = 'block';

                    displayTeam1Name.textContent = gameState.team1.name;
                    displayTeam2Name.textContent = gameState.team2.name;
                    updateHostDisplay();

                    // Send initial state to controller
                    conn.send({ type: 'init', state: gameState });
                });

                conn.on('data', (data) => {
                    if (data.type === 'update_score') {
                        if (data.team === 1) {
                            gameState.team1.score += data.amount;
                        } else if (data.team === 2) {
                            gameState.team2.score += data.amount;
                        }
                        updateHostDisplay();
                        checkPenalty();
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

        btnClosePenalty.addEventListener('click', () => {
            penaltyModal.classList.remove('active');
            // reset scores if desired, or let them continue
        });
    }

    function updateHostDisplay() {
        displayTeam1Score.textContent = gameState.team1.score;
        displayTeam2Score.textContent = gameState.team2.score;
        
        // Update controller too
        if (conn && conn.open) {
            conn.send({ type: 'sync', state: gameState });
        }
    }

    function checkPenalty() {
        let penalizedTeam = null;
        if (gameState.team1.score >= gameState.targetScore) {
            penalizedTeam = gameState.team1.name;
            gameState.team1.score = 0; // Reset
        } else if (gameState.team2.score >= gameState.targetScore) {
            penalizedTeam = gameState.team2.name;
            gameState.team2.score = 0; // Reset
        }

        if (penalizedTeam) {
            updateHostDisplay();
            const randomPenalty = penaltiesList[Math.floor(Math.random() * penaltiesList.length)];
            penaltyTeamName.textContent = `ทีม ${penalizedTeam} โดนลงโทษ!`;
            penaltyAction.textContent = randomPenalty;
            penaltyModal.classList.add('active');
            
            // Launch confetti for fun
            if (typeof launchConfetti === 'function') {
                launchConfetti();
            }
        }
    }


    // ==========================================
    // CONTROLLER MODE
    // ==========================================
    function initControllerMode(hostId) {
        // Hide main app
        if(appContainer) appContainer.style.display = 'none';
        
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
    }

    function updateControllerDisplay() {
        ctrlTeam1Name.textContent = gameState.team1.name;
        ctrlTeam2Name.textContent = gameState.team2.name;
        ctrlTeam1Score.textContent = gameState.team1.score;
        ctrlTeam2Score.textContent = gameState.team2.score;
    }

    function sendScoreUpdate(team, amount) {
        // Update local speculatively
        if (team === 1) gameState.team1.score += amount;
        else if (team === 2) gameState.team2.score += amount;
        
        updateControllerDisplay();

        if (conn && conn.open) {
            conn.send({ type: 'update_score', team: team, amount: amount });
        }
    }
});
