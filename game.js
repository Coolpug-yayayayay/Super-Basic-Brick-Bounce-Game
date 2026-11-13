// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;   // 600
const HEIGHT = canvas.height; // 450


// ------------------------------------------------------------
// THE BALL
// x and y are the top-left corner. vx and vy are how many pixels
// the ball moves each update (vx = sideways, vy = up/down).
// A positive vy means the ball is moving DOWN the screen.
// ------------------------------------------------------------
const BALL_SPEED = 5;
const BONUS_BALL_SPEED = BALL_SPEED - 1;
const STARTING_LIVES = 3;
const STARTING_PADDLE_SPEED = 7;

const ball = {
  x: 0,
  y: 0,
  width: 12,
  height: 12,
  vx: 0,
  vy: 0,
  isBonus: false,
  isBlue: false
};

let extraLives = 0;

function getTotalLives() {
  return STARTING_LIVES + extraLives;
}

function awardExtraLife(amount = 1) {
  extraLives += amount;
}

function resetBonusLives() {
  extraLives = 0;
}

let balls = [ball];
let paddleDirection = 1;
let blueBonusActive = false;
let blueFinalBallSpawned = false;
const trailParticles = [];
const collisionParticles = [];
const brickParticles = [];
const screenBurstParticles = [];

function getBallColor(currentBall = ball) {
  if (currentBall.isBlue) {
    return "#3399ff";
  }
  if (currentBall.isBonus) {
    return "#00ff66";
  }
  return "#ffffff";
}

function hexToRgba(hex, alpha) {
  const cleanHex = hex.replace("#", "");
  const normalizedHex = cleanHex.length === 3
    ? cleanHex.split("").map((char) => char + char).join("")
    : cleanHex;
  const value = Number.parseInt(normalizedHex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function emitTrailParticle(currentBall = ball) {
  const baseColor = currentBall.isBlue ? "#8ac7ff" : currentBall.isBonus ? "#8ef4b4" : "#a9d7ff";
  trailParticles.push({
    x: currentBall.x + currentBall.width / 2,
    y: currentBall.y + currentBall.height / 2,
    vx: (Math.random() - 0.5) * 0.7 + currentBall.vx * 0.12,
    vy: (Math.random() - 0.5) * 0.7 + currentBall.vy * 0.12,
    size: 3 + Math.random() * 3.5,
    life: 7 + Math.random() * 5,
    maxLife: 7 + Math.random() * 5,
    color: baseColor
  });

  if (trailParticles.length > 90) {
    trailParticles.shift();
  }
}

function emitCollisionSparks(x, y, color, amount = 10) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 2.6;
    collisionParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.04,
      size: 1 + Math.random() * 2.4,
      life: 18 + Math.random() * 20,
      maxLife: 18 + Math.random() * 20,
      color
    });
  }

  if (collisionParticles.length > 240) {
    collisionParticles.splice(0, collisionParticles.length - 240);
  }
}

function emitBrickBreakParticles(brick) {
  const centerX = brick.x + brick.width / 2;
  const centerY = brick.y + brick.height / 2;
  const baseColor = brick.isTnt ? "#ff8a65" : brick.isLife ? "#ff6fd8" : brick.isBonus || brick.isBlueBonus ? "#5fe8a4" : "#cfe7ff";

  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 2.2;
    brickParticles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.03,
      size: 1.5 + Math.random() * 3,
      life: 18 + Math.random() * 20,
      maxLife: 18 + Math.random() * 20,
      color: baseColor
    });
  }

  if (brickParticles.length > 250) {
    brickParticles.splice(0, brickParticles.length - 250);
  }
}

function updateParticles() {
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const particle = trailParticles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.94;
    particle.vy *= 0.94;
    particle.life -= 1;
    if (particle.life <= 0) {
      trailParticles.splice(i, 1);
    }
  }

  for (let i = collisionParticles.length - 1; i >= 0; i--) {
    const particle = collisionParticles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.vx *= 0.98;
    particle.life -= 1;
    if (particle.life <= 0) {
      collisionParticles.splice(i, 1);
    }
  }

  for (let i = brickParticles.length - 1; i >= 0; i--) {
    const particle = brickParticles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.vx *= 0.985;
    particle.life -= 1;
    if (particle.life <= 0) {
      brickParticles.splice(i, 1);
    }
  }

  for (let i = screenBurstParticles.length - 1; i >= 0; i--) {
    const particle = screenBurstParticles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.vx *= 0.99;
    particle.life -= 1;
    if (particle.life <= 0) {
      screenBurstParticles.splice(i, 1);
    }
  }
}

// Put the main ball in the center and reset its speed and direction.
function resetBall(target = ball, direction = 1) {
  target.x = WIDTH / 2 - target.width / 2;
  target.y = HEIGHT / 2 - target.height / 2;
  target.vx = BALL_SPEED * direction;
  target.vy = BALL_SPEED;
}


// ------------------------------------------------------------
// THE PADDLE
// ------------------------------------------------------------
const paddle = {
  x: WIDTH / 2 - 45,
  y: HEIGHT - 30,
  width: 90,
  height: 12,
  speed: STARTING_PADDLE_SPEED
};


// ------------------------------------------------------------
// THE BRICKS (the list is filled in by makeBricks() in bricks.js)
// ------------------------------------------------------------
let bricks = [];
let level = 1;
let lostBalls = 0;
const SAVED_LEVEL_KEY = "superBasicBrickBounceLevel";
let message = "";
let messageTicks = 0;
let messageAction = null;
let gameOver = false;
let isPaused = false;

function togglePause() {
  if (gameOver) {
    return;
  }
  isPaused = !isPaused;
}

function loadSavedLevel() {
  const url = new URLSearchParams(window.location.search);
  if (url.get("reset") === "1") {
    localStorage.setItem(SAVED_LEVEL_KEY, "1");
    return 1;
  }

  localStorage.setItem(SAVED_LEVEL_KEY, "1");
  return 1;
}

function showMessage(text, action) {
  message = text;
  messageTicks = 120;
  messageAction = action;
}

function triggerLevelCompleteBurst(isFinal = false) {
  const count = isFinal ? 360 : 150;
  const burstSpeed = isFinal ? 5.2 : 3.2;
  const burstGravity = isFinal ? 0.08 : 0.05;
  const colors = isFinal
    ? ["#ffde59", "#ff7a59", "#7bdff2", "#c77dff", "#7ef29a", "#ffffff"]
    : ["#ffffff", "#b8f2ff", "#8ef4b4", "#ffd166"];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * burstSpeed + 0.8;
    const originX = isFinal ? Math.random() * WIDTH : WIDTH / 2;
    const originY = isFinal ? Math.random() * HEIGHT : HEIGHT / 2;
    const pullX = isFinal ? (Math.random() - 0.5) * 1.5 : 0;
    const pullY = isFinal ? (Math.random() - 0.5) * 1.5 : 0;

    screenBurstParticles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed + pullX,
      vy: Math.sin(angle) * speed + pullY,
      gravity: burstGravity,
      size: isFinal ? 6 + Math.random() * 6 : 4 + Math.random() * 5,
      life: 30 + Math.random() * 28,
      maxLife: 30 + Math.random() * 28,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function startNextLevel() {
  if (level === LEVEL_CONFIGS.length) {
    message = "You beat all 5 levels NICE :D";
    gameOver = true;
    return;
  }

  level++;
  lostBalls = 0;
  resetBonusLives();
  blueBonusActive = false;
  blueFinalBallSpawned = false;
  screenBurstParticles.length = 0;
  localStorage.setItem(SAVED_LEVEL_KEY, String(level));
  bricks = makeBricks(level);
  balls = [ball];
  resetBall();
}

function startNewGame(startingLevel = 1) {
  level = startingLevel;
  paddle.speed = STARTING_PADDLE_SPEED;
  lostBalls = 0;
  resetBonusLives();
  blueBonusActive = false;
  blueFinalBallSpawned = false;
  gameOver = false;
  message = "";
  messageTicks = 0;
  messageAction = null;
  screenBurstParticles.length = 0;
  localStorage.setItem(SAVED_LEVEL_KEY, String(level));
  bricks = makeBricks(level);
  balls = [ball];
  resetBall();
}

function completeLevel() {
  const isFinalLevel = level === LEVEL_CONFIGS.length;
  triggerLevelCompleteBurst(isFinalLevel);
  const text = level === 1
    ? "level 1 complete :)"
    : level === 2
      ? "level 2 complete NICE :D"
      : `level ${level} complete :)`;
  showMessage(text, isFinalLevel ? null : startNextLevel);

  if (isFinalLevel) {
    message = "You beat all 5 levels NICE :D";
    gameOver = true;
  }
}

function loseMainBall() {
  lostBalls++;
  if (lostBalls >= getTotalLives()) {
    localStorage.setItem(SAVED_LEVEL_KEY, String(level));
    message = "aww u lose :(";
    gameOver = true;
    return;
  }
  resetBall(ball, paddleDirection);
}


// ------------------------------------------------------------
// KEYBOARD
// keys["arrowleft"] is true while the left arrow is held down.
// ------------------------------------------------------------
const keys = {};

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();
  keys[key] = true;
  // Stop the arrow keys from scrolling the page.
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
  if (key === "p") {
    togglePause();
  }
  if (gameOver && key === "r") {
    startNewGame(level);
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function update() {
  if (gameOver || isPaused) {
    return;
  }
  if (messageTicks > 0) {
    updateParticles();
    messageTicks--;
    if (messageTicks === 0) {
      const action = messageAction;
      message = "";
      messageAction = null;
      if (action) {
        action();
      }
    }
    return;
  }

  moveBricks();
  movePaddle();
  updateBrickShakes();
  updateParticles();
  for (const currentBall of [...balls]) {
    moveBall(currentBall);
    if (currentBall.y > HEIGHT) {
      if (currentBall.isBlue) {
        balls = balls.filter((activeBall) => activeBall !== currentBall);
        if (currentBall.isFinalBlue) {
          blueBonusActive = false;
          blueFinalBallSpawned = false;
        } else if (blueBonusActive && !blueFinalBallSpawned && !balls.some((activeBall) => activeBall.isBlue)) {
          blueFinalBallSpawned = true;
          balls.push({
            x: paddle.x + paddle.width / 2 - ball.width / 2,
            y: paddle.y - ball.height,
            width: ball.width,
            height: ball.height,
            vx: BONUS_BALL_SPEED * paddleDirection,
            vy: -BONUS_BALL_SPEED,
            isBonus: false,
            isBlue: true,
            isFinalBlue: true
          });
        }
      } else if (currentBall.isBonus) {
        awardExtraLife();
        balls = balls.filter((activeBall) => activeBall !== currentBall);
      } else {
        loseMainBall();
        if (gameOver) {
          return;
        }
      }
      continue;
    }

    bounceOffWalls(currentBall);   // collisions.js
    bounceOffPaddle(currentBall);  // collisions.js
    bounceOffBricks(currentBall);  // collisions.js
  }

  if (bricks.length === 0) {
    completeLevel();
  }
}

function movePaddle() {
  if (keys["arrowleft"] || keys["a"]) {
    paddle.x = paddle.x - paddle.speed;
    paddleDirection = -1;
  }
  if (keys["arrowright"] || keys["d"]) {
    paddle.x = paddle.x + paddle.speed;
    paddleDirection = 1;
  }

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }
}

function moveBall(target = ball) {
  target.x = target.x + target.vx;
  target.y = target.y + target.vy;
  emitTrailParticle(target);
}


// ------------------------------------------------------------
// DRAW: paints everything on the canvas. Black background,
// white shapes.
// ------------------------------------------------------------
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const particle of trailParticles) {
    const alpha = particle.life / particle.maxLife;
    ctx.fillStyle = hexToRgba(particle.color, alpha);
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  }

  for (const particle of collisionParticles) {
    const alpha = particle.life / particle.maxLife;
    ctx.fillStyle = hexToRgba(particle.color, alpha);
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  }

  for (const particle of brickParticles) {
    const alpha = particle.life / particle.maxLife;
    ctx.fillStyle = hexToRgba(particle.color, alpha);
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  }

  for (const particle of screenBurstParticles) {
    const alpha = particle.life / particle.maxLife;
    ctx.fillStyle = hexToRgba(particle.color, alpha);
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  }

  ctx.fillStyle = "white";
  ctx.font = "16px Courier New";
  ctx.textAlign = "left";
  ctx.fillText(`Level ${level}   Lives: ${Math.max(0, getTotalLives() - lostBalls)}`, 12, 24);

  ctx.fillStyle = "white";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  for (const currentBall of balls) {
    ctx.fillStyle = getBallColor(currentBall);
    ctx.fillRect(currentBall.x, currentBall.y, currentBall.width, currentBall.height);
  }

  drawBricks();  // bricks.js

  if (isPaused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "white";
    ctx.font = "bold 26px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("Game paused", WIDTH / 2, HEIGHT / 2 - 18);
    ctx.font = "16px Courier New";
    ctx.fillText("press P to resume the game :)", WIDTH / 2, HEIGHT / 2 + 18);
    return;
  }

  if (message) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "white";
    ctx.font = "bold 26px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(message, WIDTH / 2, HEIGHT / 2);
    if (gameOver) {
      ctx.font = "16px Courier New";
      ctx.fillText("Press R to play again", WIDTH / 2, HEIGHT / 2 + 34);
    }
  }
}


// ------------------------------------------------------------
// THE GAME LOOP
// The browser calls frame() every time it is ready to draw.
// Some screens are faster than others, so we make sure update()
// always runs exactly 60 times per second on every computer.
// ------------------------------------------------------------
const STEP = 1000 / 60;
let lastTime = 0;
let leftover = 0;

function frame(now) {
  leftover = leftover + (now - lastTime);
  lastTime = now;

  // If the tab was hidden for a while, don't try to catch up.
  if (leftover > 250) {
    leftover = 250;
  }

  while (leftover >= STEP) {
    update();
    leftover = leftover - STEP;
  }

  draw();
  requestAnimationFrame(frame);
}

function start() {
  startNewGame(loadSavedLevel());
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
