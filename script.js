const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

// Variables del juego
let player, bullets, enemies, score, lives, gameOver, respawnTimer;
const RESPAWN_DELAY = 90;
const ENEMY_BASE_SPEED = 1.5;

// Fondo estrellado animado
const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.5,
    speed: 0.5 + Math.random() * 3
}));

// Inicialización del juego
function initGame() {
    player = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 60,
        width: 30,
        height: 30,
        speed: 6,
        color: '#3498db',
        isAlive: true
    };

    bullets = [];
    enemies = [];
    score = 0;
    lives = 3;
    gameOver = false;
    respawnTimer = 0;

    scoreElement.textContent = score;
    livesElement.textContent = lives;

    spawnEnemies();
}

// Control
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false,
    r: false
};

// Eventos de teclado
document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    
    if (e.key === ' ' && player.isAlive && !gameOver) {
        shoot();
    }
    
    if (e.key.toLowerCase() === 'r' && gameOver) {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

function resetGame() {
    initGame();
    gameLoop();
}

// Disparar
function shoot() {
    if (!player.isAlive) return;
    
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 12,
        speed: 8,
        color: '#f1c40f'
    });
}

// Crear enemigos
function spawnEnemies() {
    const rows = 3;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            enemies.push({
                x: 30 + c * 45,
                y: 30 + r * 40,
                width: 25,
                height: 25,
                speed: ENEMY_BASE_SPEED + (r * 0.3),
                color: '#e74c3c'
            });
        }
    }
}

// Respawn del jugador
function respawnPlayer() {
    if (respawnTimer > 0) {
        respawnTimer--;
        return;
    }
    player.isAlive = true;
    player.x = canvas.width / 2 - 15;
    player.y = canvas.height - 60;
}

// Actualizar fondo estrellado
function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// Dibujar fondo estrellado
function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.globalAlpha = 0.8;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;
}

// Actualizar juego
function update() {
    if (gameOver) return;

    updateStars();

    // Respawn si está muerto
    if (!player.isAlive) {
        respawnPlayer();
        return;
    }

    // MOVIMIENTO CORREGIDO (usando las mayúsculas correctas)
    if (keys.ArrowLeft) player.x = Math.max(0, player.x - player.speed);
    if (keys.ArrowRight) player.x = Math.min(canvas.width - player.width, player.x + player.speed);

    // Mover disparos
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Mover enemigos y detectar colisiones
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed * 0.05;
        
        // Colisión con jugador
        if (player.isAlive && 
            player.x < enemies[i].x + enemies[i].width &&
            player.x + player.width > enemies[i].x &&
            player.y < enemies[i].y + enemies[i].height &&
            player.y + player.height > enemies[i].y
        ) {
            player.isAlive = false;
            lives--;
            livesElement.textContent = lives;
            respawnTimer = RESPAWN_DELAY;
            
            if (lives <= 0) {
                endGame();
                return;
            }
        }

        // Colisión disparos-enemigos
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (
                bullets[j].x < enemies[i].x + enemies[i].width &&
                bullets[j].x + bullets[j].width > enemies[i].x &&
                bullets[j].y < enemies[i].y + enemies[i].height &&
                bullets[j].y + bullets[j].height > enemies[i].y
            ) {
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                score += 100;
                scoreElement.textContent = score;
                
                if (enemies.length === 0) {
                    spawnEnemies();
                }
                break;
            }
        }
    }
}

// Dibujar elementos
function draw() {
    // Fondo negro
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas
    drawStars();
    
    // Capa semitransparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Jugador
    if (player.isAlive) {
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();
    } else if (respawnTimer % 20 < 10) {
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();
    }
    
    // Disparos
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Enemigos
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Game Over
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡GAME OVER!', canvas.width/2, canvas.height/2 - 40);
        ctx.fillText(`Puntuación: ${score}`, canvas.width/2, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText('Presiona R para reiniciar', canvas.width/2, canvas.height/2 + 40);
    }
}

function endGame() {
    gameOver = true;
}

// Bucle del juego
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar juego
initGame();
gameLoop();