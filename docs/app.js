const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const keys = {};

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const backgroundImage = new Image();
backgroundImage.src = './images/back.webp';

function drawBackground(ctx, canvasWidth, canvasHeight) {
    ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
}

// Mouse movement
let mouseX = canvasWidth / 2;
let mouseY = canvasHeight / 2;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});



// 
// Score
// 
let score = 0;

function drawScore(ctx) {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

// 
// Player
// 
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 70;
        this.speed = 5;
        this.health = 100;

        this.image = new Image();
        this.image.src = './images/gopstop.png';
    }

    draw(ctx, mouseX, mouseY) {
        if (this.health <= 0) {
            ctx.fillStyle = 'red';
            ctx.font = '30px Arial';
            ctx.fillText('Game Over', ctx.canvas.width / 2 - 60, ctx.canvas.height / 2);
            return false;
        }

        const angle = Math.atan2(mouseY - (this.y + this.size / 2), mouseX - (this.x + this.size / 2));

        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(angle);
        ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();

        return true;
    }

    move(keys, canvasWidth, canvasHeight) {
        if (keys['ArrowUp'] && this.y > 0) this.y -= this.speed;
        if (keys['ArrowDown'] && this.y < canvasHeight - this.size) this.y += this.speed;
        if (keys['ArrowLeft'] && this.x > 0) this.x -= this.speed;
        if (keys['ArrowRight'] && this.x < canvasWidth - this.size) this.x += this.speed;
    }
}


function drawHealthBar(ctx, health, canvasWidth) {
    const barWidth = canvasWidth;
    const barHeight = 10;
    const x = (ctx.canvas.width - barWidth) / 2;
    const y = 0;

    ctx.fillStyle = 'red';
    ctx.fillRect(x, y, barWidth, barHeight);

    const healthWidth = (barWidth * health) / 100;
    ctx.fillStyle = 'green';
    ctx.fillRect(x, y, healthWidth, barHeight);

    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, barWidth, barHeight);
}


const player = new Player(canvasWidth / 2, canvasHeight / 2);

// Player movement
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);



// 
// Bullet
//
const jointImage = new Image();
jointImage.src = './images/joint-2.png';

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.speed = 10;
        this.angle = angle;
        this.dx = Math.cos(this.angle) * this.speed;
        this.dy = Math.sin(this.angle) * this.speed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 32);
        const aspectRatio = jointImage.width / jointImage.height;
        const drawWidth = this.size * aspectRatio;
        const drawHeight = this.size;
        ctx.drawImage(jointImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        smokes.push(new Smoke(this.x, this.y));
    }

    isOffScreen() {
        return (
            this.x < 0 || this.x > canvasWidth ||
            this.y < 0 || this.y > canvasHeight
        );
    }

}

const bullets = [];

canvas.addEventListener('click', () => {
    const angle = Math.atan2(mouseY - (player.y + player.size / 2), mouseX - (player.x + player.size / 2));
    bullets.push(new Bullet(player.x + player.size / 2, player.y + player.size / 2, angle));
});



// 
// Enemy
//
const mentImage = new Image();
mentImage.src = './images/ment.png';
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 70;
        this.speed = 2;

        this.damage = 10;
    }

    draw() {
        ctx.drawImage(mentImage, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

    move(playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }
}

const enemies = [];
let enemyCount = 0;

//
// Boshki
//

const boshkiImage = new Image();
boshkiImage.src = './images/shisha-3.png';
class Boshki {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 70;
        this.speed = 1;
        this.angle = Math.random() * Math.PI * 2;
        this.dx = Math.cos(this.angle) * this.speed;
        this.dy = Math.sin(this.angle) * this.speed;
        this.tgk = 25;
        this.lifetime = 10000;
        this.spawnTime = Date.now();
    }

    draw() {
        ctx.drawImage(boshkiImage, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x <= 0 || this.x >= canvasWidth) this.dx *= -1;
        if (this.y <= 0 || this.y >= canvasHeight) this.dy *= -1;
    }

    isExpired() {
        return Date.now() - this.spawnTime > this.lifetime;
    }
}

const boshki = [];


// 
// Logic for spawning enemies
// 
let enemySpawnInterval = 1000;
let enemyIncreaseRate = 0.95;
let spawnBatchSize = 1;
let killedEnemies = 0;


function adjustDifficulty() {
    if (killedEnemies % 10 === 0) {
        enemySpawnInterval = Math.max(200, enemySpawnInterval * enemyIncreaseRate);
        spawnBatchSize++;
        console.log(`New spawn interval: ${enemySpawnInterval}, batch size: ${spawnBatchSize}`);
    }
}

setInterval(() => {
    for (let i = 0; i < spawnBatchSize; i++) {
        const side = Math.floor(Math.random() * 4);
        let x, y;

        if (side === 0) { x = 0; y = Math.random() * canvasHeight; }
        else if (side === 1) { x = canvasWidth; y = Math.random() * canvasHeight; }
        else if (side === 2) { x = Math.random() * canvasWidth; y = 0; }
        else { x = Math.random() * canvasWidth; y = canvasHeight; }

        enemies.push(new Enemy(x, y));
        enemyCount++;
    }

    if (enemyCount % 10 === 0) {
        boshki.push(new Boshki(Math.random() * canvasWidth, Math.random() * canvasHeight));
    }
}, enemySpawnInterval);



//
// Damage Logic
//
function isColliding(bullet, enemy) {
    const dx = bullet.x - enemy.x;
    const dy = bullet.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < enemy.size;
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(bullet, enemy)) {
                createExplosion(enemy.x, enemy.y);
                // bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);

                killedEnemies++;
                score++
                adjustDifficulty();
            }
        });

        boshki.forEach((boshkiItem, boIndex) => {
            if (isColliding(bullet, boshkiItem)) {
                createExplosion(boshkiItem.x, boshkiItem.y);
                bullets.splice(bulletIndex, 1);
                boshki.splice(boIndex, 1);
            }
        });
    });

    enemies.forEach((enemy, eIndex) => {
        if (isColliding(player, enemy)) {
            if (player.health > 0) {
                player.health -= enemy.damage;
            }
            enemies.splice(eIndex, 1);
        }
    });

    boshki.forEach((boshkiItem, bIndex) => {
        if (isColliding(player, boshkiItem)) {
            if (player.health < 100) {
                player.health = Math.min(100, player.health + boshkiItem.tgk);
            }
            boshki.splice(bIndex, 1);
        }
    });
}


// 
// Explosion
// 
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = 50;
        this.opacity = 1;
        this.expansionSpeed = 2;
        this.fadeSpeed = 0.05;
        this.finished = false;
    }

    update() {
        this.radius += this.expansionSpeed;
        this.opacity -= this.fadeSpeed;

        if (this.radius >= this.maxRadius || this.opacity <= 0) {
            this.finished = true;
        }
    }

    draw(ctx) {
        if (!this.finished) {
            ctx.save();
            ctx.globalAlpha = this.opacity
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'orange';
            ctx.fill();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }
}

const explosions = [];

function createExplosion(x, y) {
    explosions.push(new Explosion(x, y));
}


// 
// Smoke
// 
class Smoke {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.alpha = 1;
        this.fadeRate = 0.03;
    }

    draw() {
        ctx.fillStyle = `rgba(128, 128, 128, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.alpha -= this.fadeRate;
    }

    isExpired() {
        return this.alpha <= 0;
    }
}

const smokes = [];


// 
// Game loop
// 
function updateGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawBackground(ctx, canvasWidth, canvasHeight);

    drawHealthBar(ctx, player.health, canvasWidth);

    drawScore(ctx);


    if (!player.draw(ctx, mouseX, mouseY)) {
        return;
    }

    player.move(keys, canvasWidth, canvasHeight);

    bullets.forEach((bullet, index) => {
        bullet.update();
        bullet.draw();

        if (bullet.isOffScreen()) bullets.splice(index, 1);       
    });

    enemies.forEach((enemy) => {
        enemy.move(player.x, player.y);
        enemy.draw();
    });

    boshki.forEach((boshkiItem, index) => {
        boshkiItem.move();
        boshkiItem.draw();
        if (boshkiItem.isExpired()) {
            boshki.splice(index, 1);
        }
    });

    explosions.forEach((explosion, index) => {
        explosion.update();
        explosion.draw(ctx);
        if (explosion.finished) {
            explosions.splice(index, 1);
        }
    });

    smokes.forEach((smoke, index) => {
        smoke.update();
        smoke.draw();
        if (smoke.isExpired()) {
            smokes.splice(index, 1);
        }
    });

    checkCollisions();

    requestAnimationFrame(updateGame);
}


updateGame();
