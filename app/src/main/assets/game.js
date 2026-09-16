/* ================================================================= 
   OKHEDEF PRO - ULTIMATE GAME ENGINE v6.3 (HYPER-CASUAL MASTERPIECE)
   ================================================================= */

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.score = 0;
        this.combo = 0;
        this.highScore = parseInt(localStorage.getItem('okhedef_highscore') || '0', 10);
        this.gameState = 'MENU';
        
        this.lastTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;

        this.particles = [];
        this.screenShake = 0;
        this.audioCtx = null;
        this.soundEnabled = true;

        this.initDOM();
        this.initEvents();
    }

    initDOM() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gameCanvas';
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);

        this.resizeCanvas();

        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.backgroundColor = '#07070b';
        document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.canvas.style.display = 'block';

        this.createUIOverlay();
    }

    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    initEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('pointerdown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            this.handleInput(e.clientX, e.clientY);
        });

        window.addEventListener('pointerdown', () => {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }

    createUIOverlay() {
        if (this.uiContainer) this.uiContainer.remove();

        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'ui-overlay';
        this.uiContainer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; display: flex; flex-direction: column;
            justify-content: space-between; padding: 25px; box-sizing: border-box;
            color: #ffffff;
        `;
        document.body.appendChild(this.uiContainer);
        this.updateUIState();
    }

    updateUIState() {
        if (this.gameState === 'MENU') {
            this.uiContainer.innerHTML = `
                <div style="margin: auto; text-align: center; pointer-events: auto;">
                    <div style="font-size: 1rem; color: #00ffcc; letter-spacing: 4px; margin-bottom: 10px; font-weight: 700;">ULTIMATE ARCADE</div>
                    <h1 style="font-size: 3.2rem; color: #fff; text-shadow: 0 0 30px rgba(0,255,204,0.6); margin: 0 0 10px 0;">OKHEDEF</h1>
                    <p style="color: #9090b0; font-size: 1rem; margin-bottom: 40px;">Hızlı Ol, Hedefi Vur, Rekoru Kır!</p>
                    <button id="startBtn" style="background: linear-gradient(135deg, #00ffcc, #0077ff); border: none; padding: 18px 50px; font-size: 1.3rem; font-weight: 800; color: #fff; border-radius: 40px; cursor: pointer; box-shadow: 0 8px 25px rgba(0,255,204,0.4);">BAŞLA</button>
                    <div style="margin-top: 30px; color: #777; font-size: 0.95rem;">🏆 En İyi Skor: <span style="color: #00ffcc; font-weight: bold;">${this.highScore}</span></div>
                </div>
            `;
            setTimeout(() => {
                const btn = document.getElementById('startBtn');
                if (btn) btn.onclick = () => this.startGame();
            }, 50);
        } else if (this.gameState === 'PLAYING') {
            this.uiContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; width: 100%; font-size: 1.4rem; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.6);">
                    <div>SKOR: <span id="scoreVal" style="color: #00ffcc;">${this.score}</span></div>
                    <div id="comboContainer" style="color: #ffaa00; font-size: 1.1rem; display: ${this.combo > 1 ? 'block' : 'none'};">KOMBO x${this.combo}</div>
                    <div>REKOR: ${this.highScore}</div>
                </div>
            `;
        } else if (this.gameState === 'GAMEOVER') {
            this.uiContainer.innerHTML = `
                <div style="margin: auto; text-align: center; pointer-events: auto; background: rgba(12,12,20,0.9); padding: 40px; border-radius: 24px; border: 1px solid rgba(255,51,102,0.4); backdrop-filter: blur(15px); box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
                    <h2 style="font-size: 2.5rem; color: #ff3366; margin: 0 0 10px 0; text-shadow: 0 0 20px rgba(255,51,102,0.5);">OYUN BİTTİ</h2>
                    <p style="font-size: 1.1rem; color: #a0a0c0; margin-bottom: 5px;">Toplam Skorun</p>
                    <div style="font-size: 3rem; font-weight: 900; color: #00ffcc; margin-bottom: 20px;">${this.score}</div>
                    <button id="restartBtn" style="background: linear-gradient(135deg, #ff3366, #ff7700); border: none; padding: 16px 45px; font-size: 1.2rem; font-weight: 800; color: #fff; border-radius: 35px; cursor: pointer; box-shadow: 0 8px 25px rgba(255,51,102,0.4);">TEKRAR OYNA</button>
                </div>
            `;
            setTimeout(() => {
                const btn = document.getElementById('restartBtn');
                if (btn) btn.onclick = () => this.startGame();
            }, 50);
        }
    }

    startGame() {
        this.score = 0;
        this.combo = 0;
        this.gameState = 'PLAYING';
        this.particles = [];
        this.updateUIState();
        this.spawnTarget();
    }

    spawnTarget() {
        const margin = 70;
        this.target = {
            x: Math.random() * (this.width - margin * 2) + margin,
            y: Math.random() * (this.height - margin * 3) + margin * 1.5,
            radius: Math.max(25, 45 - Math.floor(this.score / 50) * 3),
            color: `hsl(${Math.random() * 360}, 90%, 65%)`,
            pulse: 0,
            life: 1.0,
            maxLife: Math.max(60, 120 - Math.floor(this.score / 30) * 5)
        };
    }

    handleInput(x, y) {
        if (this.gameState !== 'PLAYING') return;

        const dx = x - this.target.x;
        const dy = y - this.target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.target.radius + 20) {
            this.combo++;
            const points = 10 * this.combo;
            this.score += points;
            this.screenShake = 8;
            this.playTone(500 + (this.combo * 50), 0.1, 'sine');
            this.createParticles(this.target.x, this.target.y, this.target.color);
            this.updateLiveHUD();
            this.spawnTarget();
        } else {
            this.combo = 0;
            this.screenShake = 12;
            this.playTone(150, 0.2, 'sawtooth');
            this.gameState = 'GAMEOVER';
            this.updateUIState();
        }
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }

    updateLiveHUD() {
        const scoreEl = document.getElementById('scoreVal');
        const comboEl = document.getElementById('comboContainer');
        if (scoreEl) scoreEl.innerText = this.score;
        if (comboEl) {
            comboEl.innerText = `KOMBO x${this.combo}`;
            comboEl.style.display = this.combo > 1 ? 'block' : 'none';
        }
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('okhedef_highscore', this.highScore);
        }
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {}
    }

    update() {
        if (this.gameState !== 'PLAYING') return;

        this.target.life -= 1 / this.target.maxLife;
        if (this.target.life <= 0) {
            this.gameState = 'GAMEOVER';
            this.playTone(100, 0.3, 'sawtooth');
            this.updateUIState();
            return;
        }

        this.target.pulse += 0.08;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.screenShake > 0) {
            this.screenShake *= 0.85;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }
    }

    render() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.screenShake > 0) {
            const offsetX = (Math.random() - 0.5) * this.screenShake;
            const offsetY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(offsetX, offsetY);
        }

        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, '#07070b');
        bgGrad.addColorStop(1, '#11111d');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.gameState === 'PLAYING' && this.target) {
            const currentRadius = this.target.radius + Math.sin(this.target.pulse) * 3;

            this.ctx.beginPath();
            this.ctx.arc(this.target.x, this.target.y, currentRadius + 10, 0, Math.PI * 2 * this.target.life);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            this.ctx.save();
            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = this.target.color;
            this.ctx.beginPath();
            this.ctx.arc(this.target.x, this.target.y, currentRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.target.color;
            this.ctx.fill();
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.stroke();
            this.ctx.restore();
        }

        for (let p of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const elapsed = timestamp - this.lastTime;

        if (elapsed >= this.frameInterval) {
            this.lastTime = timestamp - (elapsed % this.frameInterval);
            this.update();
            this.render();
        }

        requestAnimationFrame((ts) => this.loop(ts));
    }

    start() {
        requestAnimationFrame((ts) => this.loop(ts));
    }
}

window.addEventListener('load', () => {
    window.gameEngine = new GameEngine();
    window.gameEngine.start();
});

