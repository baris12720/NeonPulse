const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.95;
    canvas.width = 400;
    canvas.height = 700;
    canvas.style.width = size + 'px';
    canvas.style.height = (size * 1.75) + 'px';
}
window.addEventListener('resize', resize);
resize();

// Oyun Durumları ve İstatistikler
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let highScore = localStorage.getItem('neonPulseHighScore') || 0;
let level = 1;
let gameSpeed = 4;
let lives = 3;

let player = { 
    x: 200, 
    y: 580, 
    radius: 18, 
    color: '#00ffcc',
    trail: []
};

let obstacles = [];
let particles = [];
let powerUps = [];
let frameCount = 0;
let targetX = player.x;

// Dokunmatik ve Fare Kontrolleri
window.addEventListener('mousemove', (e) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width) * canvas.width;
});

window.addEventListener('touchmove', (e) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    if(e.touches.length > 0) {
        targetX = ((e.touches[0].clientX - rect.left) / rect.width) * canvas.width;
    }
}, { passive: true });

window.addEventListener('click', handleTouch);
window.addEventListener('touchstart', handleTouch, { passive: true });

function handleTouch() {
    if (gameState === 'MENU') {
        startGame();
    } else if (gameState === 'GAMEOVER') {
        gameState = 'MENU';
    }
}

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    level = 1;
    gameSpeed = 4;
    lives = 3;
    obstacles = [];
    particles = [];
    powerUps = [];
    player.x = canvas.width / 2;
    player.trail = [];
}

function spawnObstacle() {
    const width = Math.random() * 90 + 50;
    const x = Math.random() * (canvas.width - width);
    const type = Math.random() < 0.3 ? 'moving' : 'normal';
    obstacles.push({ 
        x: x, 
        y: -50, 
        width: width, 
        height: 22, 
        speed: gameSpeed + Math.random() * 2,
        type: type,
        dir: Math.random() < 0.5 ? 1 : -1
    });
}

function spawnPowerUp() {
    powerUps.push({
        x: Math.random() * (canvas.width - 30) + 15,
        y: -30,
        radius: 12,
        speed: 3.5
    });
}

function createParticles(x, y, color) {
    for(let i=0; i<30; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 9,
            vy: (Math.random() - 0.5) * 9,
            alpha: 1,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function update() {
    if (gameState !== 'PLAYING') return;

    frameCount++;
    level = Math.floor(score / 150) + 1;
    gameSpeed = 4 + (level * 0.7);

    if (frameCount % Math.max(20, 45 - (level * 3)) === 0) {
        spawnObstacle();
    }

    if (frameCount % 250 === 0) {
        spawnPowerUp();
    }

    // Oyuncu Hareketi ve Kuyruk Efekti
    player.x += (targetX - player.x) * 0.25;
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));

    if (frameCount % 2 === 0) {
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 8) player.trail.shift();
    }

    // Engelleri Güncelle
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += obs.speed;

        if (obs.type === 'moving') {
            obs.x += obs.dir * 2.5;
            if (obs.x <= 0 || obs.x + obs.width >= canvas.width) obs.dir *= -1;
        }

        // Çarpışma Kontrolü
        if (
            player.x + player.radius > obs.x &&
            player.x - player.radius < obs.x + obs.width &&
            player.y + player.radius > obs.y &&
            player.y - player.radius < obs.y + obs.height
        ) {
            obstacles.splice(i, 1);
            lives--;
            createParticles(player.x, player.y, '#ff0055');
            if (lives <= 0) {
                gameState = 'GAMEOVER';
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('neonPulseHighScore', highScore);
                }
            }
        }

        if (obs.y > canvas.height) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }

    // Bonusları Güncelle
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let p = powerUps[i];
        p.y += p.speed;

        let dist = Math.hypot(player.x - p.x, player.y - p.y);
        if (dist < player.radius + p.radius) {
            score += 50;
            createParticles(p.x, p.y, '#00ffcc');
            powerUps.splice(i, 1);
        } else if (p.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }

    // Parçacıkları Güncelle
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.03;
        if (pt.alpha <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Arka Plan Grid Efekti
    ctx.strokeStyle = '#121225';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for(let i=0; i<canvas.height; i+=40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    if (gameState === 'MENU') {
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#00ffcc';
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NEON PULSE', canvas.width / 2, canvas.height / 2 - 90);

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('ULTIMATE ARCADE EDITION', canvas.width / 2, canvas.height / 2 - 40);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px sans-serif';
        ctx.fillText(`En Yüksek Skor: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('BAŞLAMAK İÇİN DOKUN', canvas.width / 2, canvas.height / 2 + 120);
        ctx.textAlign = 'left';
        return;
    }

    // Power-up Çizimi
    powerUps.forEach(p => {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffcc';
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    });

    // Engel Çizimi
    obstacles.forEach(obs => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = obs.type === 'moving' ? '#ff9900' : '#ff0055';
        ctx.fillStyle = obs.type === 'moving' ? '#ff9900' : '#ff0055';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Oyuncu Kuyruğu
    player.trail.forEach((t, index) => {
        ctx.save();
        ctx.globalAlpha = index / player.trail.length * 0.4;
        ctx.fillStyle = player.color;
        ctx.beginPath(); ctx.arc(t.x, t.y, player.radius * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });

    // Oyuncu Topu
    ctx.shadowBlur = 25;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Parçacıklar
    particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        ctx.restore();
    });

    // Arayüz Paneli (Skor, Can, Seviye)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`SKOR: ${score}`, 20, 35);
    ctx.fillText(`SEVİYE: ${level}`, 160, 35);
    ctx.fillText(`CAN: ${'❤️'.repeat(lives)}`, canvas.width - 110, 35);

    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(3, 3, 8, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OYUN BİTTİ', canvas.width / 2, canvas.height / 2 - 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px sans-serif';
        ctx.fillText(`Skorun: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`En İyi: ${highScore}`, canvas.width / 2, canvas.height / 2 + 45);

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('Menüye dönmek için dokun', canvas.width / 2, canvas.height / 2 + 110);
        ctx.textAlign = 'left';
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
