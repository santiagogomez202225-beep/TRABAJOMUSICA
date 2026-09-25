document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MENÚ HAMBURGUESA (MÓVIL)
    // ==========================================
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
        });
    }

    // ==========================================
    // 2. CAMBIO DINÁMICO DE PESTAÑAS
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.seccion-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            if (!targetSection) return;

            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            link.classList.add('active');
            const sectionEl = document.getElementById(targetSection);
            if (sectionEl) {
                sectionEl.classList.add('active');
            }

            if (menuToggle && navMenu) {
                menuToggle.classList.remove('open');
                navMenu.classList.remove('open');
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // ==========================================
    // 3. CONTROL DEL REPRODUCTOR FIJO DE AUDIO
    // ==========================================
    const buttons = document.querySelectorAll('.btn-play');
    const mainAudio = document.getElementById('main-audio');
    const audioSource = document.getElementById('audio-source');
    const playerImg = document.getElementById('player-img');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.card');
            if (!card) return;

            const src = card.getAttribute('data-src');
            const title = card.getAttribute('data-title');
            const artist = card.getAttribute('data-artist');
            const img = card.getAttribute('data-img');

            if (audioSource && mainAudio && src) {
                audioSource.src = src;
                if (playerTitle) playerTitle.textContent = title || 'Sin título';
                if (playerArtist) playerArtist.textContent = artist || 'Trap Colombia';
                if (playerImg && img) playerImg.src = img;

                mainAudio.load();
                mainAudio.play().catch(err => {
                    console.warn('No se pudo reproducir automáticamente:', err);
                });
            }
        });
    });

    // ==========================================
    // 4. JUEGO: CACERÍA DE PÁJAROS
    // ==========================================
    const canvas = document.getElementById("gameCanvas");

    if (canvas) {
        const ctx = canvas.getContext("2d");
        const overlay = document.getElementById("game-overlay");
        const btnStart = document.getElementById("btn-start-game");
        const scoreElem = document.getElementById("game-score");
        const timeElem = document.getElementById("game-time");
        const shotsElem = document.getElementById("game-shots");
        const overlayTitle = document.getElementById("overlay-title");
        const overlayDesc = document.getElementById("overlay-desc");
        const wrapper = document.getElementById("bird-wrapper");

        const W = canvas.width;
        const H = canvas.height;

        let birds = [];
        let particles = [];
        let score = 0;
        let shots = 0;
        let timeLeft = 30;
        let isPlaying = false;
        let gameLoopId = null;
        let timerInterval = null;
        let spawnTimer = 0;
        let handX = W / 2;
        let handY = H - 20;
        let mouseX = W / 2;
        let mouseY = H / 2;

        function createBird() {
            const fromLeft = Math.random() > 0.5;
            const speed = 1.5 + Math.random() * 1.5;
            return {
                x: fromLeft ? -40 : W + 40,
                y: 60 + Math.random() * (H - 180),
                vx: fromLeft ? speed : -speed,
                vy: (Math.random() - 0.5) * 1.2,
                size: 26 + Math.random() * 10,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 0.2 + Math.random() * 0.15
            };
        }

        function drawSky() {
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#0a0a18');
            grad.addColorStop(0.5, '#1a0a1f');
            grad.addColorStop(1, '#2a0815');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            for (let i = 0; i < 40; i++) {
                const sx = (i * 137) % W;
                const sy = (i * 89) % (H * 0.6);
                const twinkle = 0.5 + Math.sin(Date.now() * 0.002 + i) * 0.5;
                ctx.globalAlpha = twinkle * 0.7;
                ctx.fillRect(sx, sy, 1.5, 1.5);
            }
            ctx.globalAlpha = 1;

            ctx.beginPath();
            ctx.arc(W - 70, 60, 28, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 220, 150, 0.9)';
            ctx.shadowColor = 'rgba(255, 220, 150, 0.6)';
            ctx.shadowBlur = 30;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        function drawBird(bird) {
            bird.wingPhase += bird.wingSpeed;
            const wingOffset = Math.sin(bird.wingPhase) * bird.size * 0.4;

            ctx.save();
            ctx.translate(bird.x, bird.y);

            ctx.shadowColor = 'rgba(255, 0, 51, 0.4)';
            ctx.shadowBlur = 12;

            ctx.font = `${bird.size}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (bird.vx < 0) {
                ctx.scale(-1, 1);
            }

            ctx.translate(0, wingOffset * 0.3);
            ctx.fillText('🐦', 0, 0);

            ctx.restore();
        }

        function drawHand() {
            const aimX = mouseX;
            const aimY = mouseY;

            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = 'rgba(255, 0, 51, 0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(handX, handY - 30);
            ctx.lineTo(aimX, aimY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.strokeStyle = 'rgba(255, 0, 51, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(aimX - 14, aimY);
            ctx.lineTo(aimX - 5, aimY);
            ctx.moveTo(aimX + 5, aimY);
            ctx.lineTo(aimX + 14, aimY);
            ctx.moveTo(aimX, aimY - 14);
            ctx.lineTo(aimX, aimY - 5);
            ctx.moveTo(aimX, aimY + 5);
            ctx.lineTo(aimX, aimY + 14);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(aimX, aimY, 16, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 0, 51, 0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.font = '58px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.save();
            ctx.shadowColor = 'rgba(255, 0, 51, 0.7)';
            ctx.shadowBlur = 20;
            ctx.fillText('🔫', handX, handY);
            ctx.restore();
        }

        function createParticles(x, y, isHit) {
            const count = isHit ? 18 : 8;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 3,
                    life: 1,
                    color: isHit ? [255, 204, 0] : [255, 255, 255]
                });
            }
        }

        function drawParticles() {
            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${p.life})`;
                ctx.fill();
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2;
                p.life -= 0.025;
                p.size *= 0.97;
            });
        }

        function updateBirds() {
            birds.forEach(b => {
                b.x += b.vx;
                b.y += b.vy;

                if (b.y < 50 || b.y > H - 120) {
                    b.vy *= -1;
                }
            });

            birds = birds.filter(b => b.x > -60 && b.x < W + 60);
        }

        function spawnBirds() {
            spawnTimer++;
            if (spawnTimer >= 45 && birds.length < 6) {
                birds.push(createBird());
                spawnTimer = 0;
            }
        }

        function gameLoop() {
            if (!isPlaying) return;

            drawSky();
            updateBirds();
            spawnBirds();

            birds.forEach(drawBird);
            drawParticles();
            drawHand();

            gameLoopId = requestAnimationFrame(gameLoop);
        }

        function handleShoot(e) {
            if (!isPlaying) return;

            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const clickX = (clientX - rect.left) * (W / rect.width);
            const clickY = (clientY - rect.top) * (H / rect.height);

            mouseX = clickX;
            mouseY = clickY;

            shots++;
            if (shotsElem) shotsElem.textContent = shots;

            if (wrapper) {
                wrapper.classList.remove('flash');
                void wrapper.offsetWidth;
                wrapper.classList.add('flash');
            }

            let hit = false;
            for (let i = birds.length - 1; i >= 0; i--) {
                const b = birds[i];
                const dist = Math.hypot(clickX - b.x, clickY - b.y);
                if (dist <= b.size * 0.8) {
                    score++;
                    if (scoreElem) scoreElem.textContent = score;
                    createParticles(b.x, b.y, true);
                    birds.splice(i, 1);
                    hit = true;
                    break;
                }
            }

            if (!hit) {
                createParticles(clickX, clickY, false);
            }
        }

        function handleMouseMove(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            mouseX = (clientX - rect.left) * (W / rect.width);
            mouseY = (clientY - rect.top) * (H / rect.height);
        }

        function startGame() {
            birds = [];
            particles = [];
            score = 0;
            shots = 0;
            timeLeft = 30;
            spawnTimer = 0;
            isPlaying = true;

            if (scoreElem) scoreElem.textContent = '0';
            if (timeElem) timeElem.textContent = '30';
            if (shotsElem) shotsElem.textContent = '0';
            if (overlay) overlay.classList.remove('active');

            birds.push(createBird());
            birds.push(createBird());

            gameLoop();

            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                timeLeft--;
                if (timeElem) timeElem.textContent = timeLeft;

                if (timeLeft <= 0) {
                    endGame();
                }
            }, 1000);
        }

        function endGame() {
            isPlaying = false;
            clearInterval(timerInterval);
            cancelAnimationFrame(gameLoopId);

            if (overlayTitle) overlayTitle.textContent = '¡TIEMPO AGOTADO! ⏱️';
            if (overlayDesc) {
                overlayDesc.innerHTML = `Derribaste <b>${score} pájaros</b> con <b>${shots} disparos</b>. ¡Buen ojo de cazador!`;
            }
            if (btnStart) btnStart.textContent = 'JUGAR DE NUEVO 🔄';
            if (overlay) overlay.classList.add('active');
        }

        canvas.addEventListener('click', handleShoot);
        canvas.addEventListener('touchstart', handleShoot, { passive: false });
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchmove', handleMouseMove, { passive: true });

        if (btnStart) {
            btnStart.addEventListener('click', startGame);
        }

        drawSky();
        drawHand();
    }

    // ==========================================
    // 5. VISOR DE PDF LOCAL
    // ==========================================
    const pdfInput = document.getElementById('pdf-input');
    const pdfFrame = document.getElementById('pdf-frame');
    const pdfName = document.getElementById('pdf-name');
    const pdfPlaceholder = document.getElementById('pdf-placeholder');

    if (pdfInput) {
        pdfInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type === "application/pdf") {
                const fileURL = URL.createObjectURL(file);
                pdfFrame.src = fileURL;
                pdfFrame.style.display = 'block';
                if (pdfPlaceholder) pdfPlaceholder.style.display = 'none';
                if (pdfName) pdfName.textContent = file.name;
            } else {
                alert("Por favor selecciona un archivo en formato PDF válido.");
            }
        });
    }

    // ==========================================
    // 6. STUDIO UNDERGROUND (PIZARRA CREATIVA)
    // ==========================================
    const sketchCanvas = document.getElementById('sketchCanvas');
    if (sketchCanvas) {
        const ctx = sketchCanvas.getContext('2d');
        const colorPicker = document.getElementById('draw-color');
        const sizePicker = document.getElementById('draw-size');
        const btnClear = document.getElementById('btn-clear-canvas');
        const themeBtns = document.querySelectorAll('.btn-tema');
        const canvasWrapper = document.getElementById('canvas-wrapper');

        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        sketchCanvas.width = 500;
        sketchCanvas.height = 350;

        function startDrawing(e) {
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x;
            lastY = pos.y;
        }

        function draw(e) {
            if (!isDrawing) return;
            const pos = getPos(e);

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = colorPicker ? colorPicker.value : '#ff0055';
            ctx.lineWidth = sizePicker ? sizePicker.value : 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            lastX = pos.x;
            lastY = pos.y;
        }

        function stopDrawing() {
            isDrawing = false;
        }

        function getPos(e) {
            const rect = sketchCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (sketchCanvas.width / rect.width),
                y: (clientY - rect.top) * (sketchCanvas.height / rect.height)
            };
        }

        sketchCanvas.addEventListener('mousedown', startDrawing);
        sketchCanvas.addEventListener('mousemove', draw);
        sketchCanvas.addEventListener('mouseup', stopDrawing);
        sketchCanvas.addEventListener('mouseleave', stopDrawing);

        sketchCanvas.addEventListener('touchstart', (e) => { startDrawing(e); e.preventDefault(); }, { passive: false });
        sketchCanvas.addEventListener('touchmove', (e) => { draw(e); e.preventDefault(); }, { passive: false });
        sketchCanvas.addEventListener('touchend', stopDrawing);

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                ctx.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
            });
        }

        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const color = btn.getAttribute('data-color');
                if (canvasWrapper) {
                    canvasWrapper.style.backgroundColor = color;
                }
            });
        });
    }

    // ==========================================
    // 7. ANIMACIÓN DE BARRAS DE HABILIDADES
    // ==========================================
    const skillFills = document.querySelectorAll('.skill-fill');

    if (skillFills.length > 0) {
        const animateSkills = () => {
            skillFills.forEach((fill, i) => {
                const width = fill.getAttribute('data-width') || 0;
                setTimeout(() => {
                    fill.style.width = width + '%';
                }, i * 150);
            });
        };

        // Animar al entrar a la sección Academia
        const academiaSection = document.getElementById('academia');

        if (academiaSection) {
            // Detectar cuando la sección se activa
            const observer = new MutationObserver(() => {
                if (academiaSection.classList.contains('active')) {
                    // Resetear barras
                    skillFills.forEach(fill => fill.style.width = '0');
                    // Animar después de un pequeño delay
                    setTimeout(animateSkills, 300);
                }
            });

            observer.observe(academiaSection, {
                attributes: true,
                attributeFilter: ['class']
            });

            // Animar también si la sección ya está activa al cargar
            if (academiaSection.classList.contains('active')) {
                setTimeout(animateSkills, 500);
            }
        } else {
            // Fallback: animar al cargar
            setTimeout(animateSkills, 1000);
        }
    }

});