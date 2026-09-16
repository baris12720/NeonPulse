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

let score = 0;
let isGameOver = false;
let player = { x: 180, y: 600, radius: 20, color: '#00ffcc' };
let obstacles = [];
let particles = [];
let frameCount = 0;
let targetX = player.x;

window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width) * canvas.width;
});
window.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if(e.touches.length > 0) {
        targetX = ((e.touches[0].clientX - rect.left) / rect.width) * canvas.width;
    }
}, { passive: true });

function spawnObstacle() {
    const width = Math.random() * 80 + 40;
    const x = Math.random() * (canvas.width - width);
    obstacles.push({ x: x, y: -40, width: width, height: 20, speed: 5 });
}

function createParticles(x, y, color) {
    for(let i=0; i<15; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            alpha: 1,
            color: color
        });
    }
}

function update() {
    if (isGameOver) return;
    frameCount++;
    if (frameCount % 40 === 0) spawnObstacle();

    player.x += (targetX - player.x) * 0.2;
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += obs.speed;

        if (
            player.x + player.radius > obs.x &&
            player.x - player.radius < obs.x + obs.width &&
            player.y + player.radius > obs.y &&
            player.y - player.radius < obs.y + obs.height
        ) {
            isGameOver = true;
            createParticles(player.x, player.y, '#ff0055');
        }

        if (obs.y > canvas.height) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff0055';
    obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.restore();
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`SKOR: ${score}`, 20, 35);

    if (isGameOver) {
        ctx.fillStyle = 'rgba(3, 3, 8, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OYUN BİTTİ', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#00ffcc';
        ctx.font = '18px sans-serif';
        ctx.fillText('Yeniden baslamak icin dokun', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    }
}

window.addEventListener('click', () => {
    if (isGameOver) {
        isGameOver = false;
        score = 0;
        obstacles = [];
        particles = [];
        player.x = canvas.width / 2;
    }
});

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
