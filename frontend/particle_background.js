document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('backgroundCanvas');
    if (!canvas) {
        console.error("Elemento canvas 'backgroundCanvas' não encontrado.");
        return;
    }
    const ctx = canvas.getContext('2d');

    let particles = [];
    const NUM_PARTICLES = 150;
    const PARTICLE_SIZE = 1;
    const PARTICLE_COLOR = 'rgba(210, 180, 140, 0.7)';
    const WAVE_AMPLITUDE = 15;
    const WAVE_FREQUENCY = 0.005;
    const SCROLL_SPEED = 0.5;

    let animationFrameId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < NUM_PARTICLES; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                initialY: Math.random() * canvas.height,
                size: Math.random() * PARTICLE_SIZE + 0.5,
                speed: Math.random() * 0.1 + 0.05
            });
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = PARTICLE_COLOR;

        particles.forEach(p => {
            p.x -= p.speed * SCROLL_SPEED;
            p.y = p.initialY + Math.sin(p.x * WAVE_FREQUENCY + Date.now() * 0.0005) * WAVE_AMPLITUDE;

            if (p.x < 0) {
                p.x = canvas.width;
                p.y = Math.random() * canvas.height;
                p.initialY = p.y;
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function animate() {
        drawParticles();
        animationFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initParticles();
    animate();
});