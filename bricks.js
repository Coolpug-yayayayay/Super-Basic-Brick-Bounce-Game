// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;     // empty space between bricks
const BRICK_HITS = 2;
const BRICK_MOVE_INTERVAL = 6;
let brickMoveTicks = 0;

const LEVEL_CONFIGS = [
  { rows: 5, regular: 28 },
  { rows: 5, regular: 31 },
  { rows: 6, regular: 34 },
  { rows: 6, regular: 37 },
  { rows: 7, regular: 40 }
];

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index--) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[otherIndex]] = [items[otherIndex], items[index]];
  }
  return items;
}

function makeBricks(levelNumber) {
  const list = [];
  const config = LEVEL_CONFIGS[levelNumber - 1];
  const columns = 8;
  const totalWidth = columns * BRICK_WIDTH + (columns - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;
  const slots = [];
  const types = [
    ...Array(config.regular - 15).fill("#"),
    ...Array(15).fill("R"),
    "G", "G", "B", "Y", "T", "L"
  ];

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < columns; col++) {
      slots.push({ row, col });
    }
  }

  shuffle(slots);
  shuffle(types);
  for (let index = 0; index < types.length; index++) {
    const { row, col } = slots[index];
    const type = types[index];
    list.push({
      x: left + col * (BRICK_WIDTH + BRICK_GAP),
      y: 50 + row * (BRICK_HEIGHT + BRICK_GAP),
      width: BRICK_WIDTH,
      height: BRICK_HEIGHT,
      hits: type === "R" || type === "T" || type === "L" ? 1 : BRICK_HITS,
      isBonus: type === "G",
      isBlueBonus: type === "B",
      isTnt: type === "T",
      isLife: type === "L",
      isSpeed: type === "Y",
      isGray: type === "R",
      bonusGiven: false
    });
  }

  return list;
}

function moveBricks() {
  brickMoveTicks++;
  if (brickMoveTicks < BRICK_MOVE_INTERVAL) {
    return;
  }
  brickMoveTicks = 0;

  const moveAmount = level;

  for (const brick of bricks) {
    brick.x += moveAmount;
    if (brick.x >= WIDTH) {
      brick.x = -brick.width;
    }
  }
}

// Draws every brick in the list.
function drawBricks() {
  for (const brick of bricks) {
    if (brick.isTnt) {
      ctx.fillStyle = "#ff3b30";
    } else if (brick.isLife) {
      ctx.fillStyle = "#ff66c4";
    } else if (brick.isBonus) {
      ctx.fillStyle = brick.hits === BRICK_HITS ? "#00ff66" : "#008833";
    } else if (brick.isBlueBonus) {
      ctx.fillStyle = brick.hits === BRICK_HITS ? "#3399ff" : "#145a9e";
    } else if (brick.isSpeed) {
      ctx.fillStyle = "#ffff00";
    } else if (brick.isGray) {
      ctx.fillStyle = "#999";
    } else {
      ctx.fillStyle = brick.hits === BRICK_HITS ? "white" : "#555";
    }
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  }
}
