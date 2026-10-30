// ============================================================
// collisions.js: what happens when the ball touches something
//
// To "bounce", we flip the ball's speed:
//   hit something sideways -> vx = -vx
//   hit something above or below -> vy = -vy
// ============================================================

// Returns true if two rectangles (like the ball and a brick) overlap.
function boxesTouch(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}


// The ball bounces off the left, right, and top walls.
// (The bottom is not a wall: falling off the bottom resets the ball.)
function bounceOffWalls(currentBall = ball) {
  if (currentBall.x < 0) {
    currentBall.x = 0;
    currentBall.vx = -currentBall.vx;
  }
  if (currentBall.x + currentBall.width > WIDTH) {
    currentBall.x = WIDTH - currentBall.width;
    currentBall.vx = -currentBall.vx;
  }
  if (currentBall.y < 0) {
    currentBall.y = 0;
    currentBall.vy = -currentBall.vy;
  }
}


// The ball bounces off the top of the paddle.
// ball.vy > 0 means "the ball is moving down", so it only bounces
// when it is falling onto the paddle.
function bounceOffPaddle(currentBall = ball) {
  if (boxesTouch(currentBall, paddle) && currentBall.vy > 0) {
    currentBall.y = paddle.y - currentBall.height;  // sit on top of the paddle
    currentBall.vy = -currentBall.vy;
  }
}


function applyBrickHitEffects(brick, currentBall) {
  if (brick.isBonus && !brick.bonusGiven) {
    brick.bonusGiven = true;
    balls.push({
      x: currentBall.x,
      y: currentBall.y,
      width: currentBall.width,
      height: currentBall.height,
      vx: currentBall.vx > 0 ? -BONUS_BALL_SPEED : BONUS_BALL_SPEED,
      vy: -BONUS_BALL_SPEED,
      isBonus: true
    });
  }

  if (brick.isBlueBonus && !brick.bonusGiven) {
    brick.bonusGiven = true;
    blueBonusActive = true;
    blueFinalBallSpawned = false;
    for (const direction of [-1, 0, 1]) {
      balls.push({
        x: currentBall.x,
        y: currentBall.y,
        width: currentBall.width,
        height: currentBall.height,
        vx: direction * BONUS_BALL_SPEED,
        vy: -BONUS_BALL_SPEED,
        isBonus: false,
        isBlue: true
      });
    }
  }

  if (brick.isLife) {
    awardExtraLife(2);
  }
}

function applyBrickDestructionEffects(brick) {
  if (brick.isSpeed) {
    paddle.speed += 2;
  }
}

function triggerTntBlast(targetIndex, currentBall) {
  const targetBrick = bricks[targetIndex];
  const blastCenterX = targetBrick.x + targetBrick.width / 2;
  const blastCenterY = targetBrick.y + targetBrick.height / 2;

  for (let i = bricks.length - 1; i >= 0; i--) {
    const brick = bricks[i];
    const brickCenterX = brick.x + brick.width / 2;
    const brickCenterY = brick.y + brick.height / 2;
    const distanceX = Math.abs(brickCenterX - blastCenterX);
    const distanceY = Math.abs(brickCenterY - blastCenterY);

    if (distanceX <= BRICK_WIDTH + BRICK_GAP && distanceY <= BRICK_HEIGHT + BRICK_GAP) {
      applyBrickHitEffects(brick, currentBall);
      applyBrickDestructionEffects(brick);
      bricks.splice(i, 1);
    }
  }
}

// The ball bounces off bricks, which disappear after two hits.
function bounceOffBricks(currentBall = ball) {
  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];
    if (!boxesTouch(currentBall, brick)) {
      continue;  // not touching this brick, check the next one
    }

    // How far has the ball pushed into the brick on each side?
    const overlapX = Math.min(currentBall.x + currentBall.width, brick.x + brick.width) - Math.max(currentBall.x, brick.x);
    const overlapY = Math.min(currentBall.y + currentBall.height, brick.y + brick.height) - Math.max(currentBall.y, brick.y);

    if (overlapX < overlapY) {
      // The ball hit the brick's left or right side.
      currentBall.vx = -currentBall.vx;
      if (currentBall.x < brick.x) {
        currentBall.x = brick.x - currentBall.width;     // left of the brick
      } else {
        currentBall.x = brick.x + brick.width;    // right of the brick
      }
    } else {
      // The ball hit the brick's top or bottom.
      currentBall.vy = -currentBall.vy;
      if (currentBall.y < brick.y) {
        currentBall.y = brick.y - currentBall.height;    // above the brick
      } else {
        currentBall.y = brick.y + brick.height;  // below the brick
      }
    }

    applyBrickHitEffects(brick, currentBall);

    if (brick.isTnt) {
      triggerTntBlast(i, currentBall);
      break;
    }

    brick.hits--;
    if (brick.hits === 0) {
      applyBrickDestructionEffects(brick);
      bricks.splice(i, 1);
    }

    break;  // bounce off one brick per update, then stop looking
  }
}
