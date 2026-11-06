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
  localStorage.setItem(SAVED_LEVEL_KEY, String(level));
  bricks = makeBricks(level);
  balls = [ball];
  resetBall();
}

function completeLevel() {
  const text = level === 1
    ? "level 1 complete :)"
    : level === 2
      ? "level 2 complete NICE :D"
      : `level ${level} complete :)`;
  showMessage(text, startNextLevel);
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
  keys[event.key.toLowerCase()] = true;
  // Stop the arrow keys from scrolling the page.
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
  if (gameOver && event.key.toLowerCase() === "r") {
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
  if (gameOver) {
    return;
  }
  if (messageTicks > 0) {
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
}


// ------------------------------------------------------------
// DRAW: paints everything on the canvas. Black background,
// white shapes.
// ------------------------------------------------------------
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "white";
  ctx.font = "16px Courier New";
  ctx.textAlign = "left";
  ctx.fillText(`Level ${level}   Lives: ${Math.max(0, getTotalLives() - lostBalls)}`, 12, 24);

  ctx.fillStyle = "white";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  for (const currentBall of balls) {
    ctx.fillStyle = currentBall.isBlue ? "#3399ff" : currentBall.isBonus ? "#00ff66" : "white";
    ctx.fillRect(currentBall.x, currentBall.y, currentBall.width, currentBall.height);
  }

  drawBricks();  // bricks.js

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
