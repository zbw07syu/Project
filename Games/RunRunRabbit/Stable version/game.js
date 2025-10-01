// ----- Config -----
const gridSize = 8;     
const cellSize = 50;    

// Canvas & UI
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const questionDiv = document.getElementById("question");
const answerDiv = document.getElementById("answer");
const controlsDiv = document.getElementById("controls");
const rollDiceBtn = document.getElementById("rollDiceBtn");
const pssBtns = document.querySelectorAll(".pssBtn");
const offset = cellSize; // reserve space for coordinates
const victoryModal = document.getElementById("victoryModal");
const vpBtns = document.querySelectorAll(".vpBtn");
const rabbitKeys = ['rabbit', 'redRabbit', 'blueRabbit', 'blackRabbit'];
const scoresList = document.getElementById('scores');
let bluerabbit = null;
let redrabbit = null;
let blackrabbit = null;

const playerNames2p = {
  rabbit: "🐇 Rabbit",
  wolf: "🐺 Wolf"
};

const playerNames3p = {
  redRabbit: "🔴 Rabbit",
  blueRabbit: "🔵 Rabbit",
  wolf: "🐺 Wolf"
};

const playerNames4p = {
  redRabbit: "🔴 Rabbit",
  blueRabbit: "🔵 Rabbit",
  blackRabbit: "⚫ Rabbit",
  wolf: "🐺 Wolf"
};

// Multiplayer Modal
const teamModal = document.getElementById('teamModal');
const teamBtns = document.querySelectorAll('.teamBtn');

// <-- Paste here -->
canvas.width = (gridSize + 1 + 1) * cellSize; // 8 + safety + coord = 10 cells wide
canvas.height = (gridSize + 1 + 1) * cellSize; // same for height

// ----- Helpers -----
const inGrid = (x, y) => x >= 0 && x < gridSize && y >= 0 && y < gridSize;

// ----- Audio -----
const bgMusic = new Audio('peter-and-the-wolf-chiptune.mp3');
const pssClick = new Audio('PSS.mp3');
const diceRollSound = new Audio('dice.wav');
const winSound = new Audio('cheer.wav');
const loseSound = new Audio('meh.mp3');
const carrotSound = new Audio('carrotappears.wav'); 
const carrotCollectSound = new Audio('carrotcollected.wav'); 
const victoryMusic = new Audio('wearethechampionschiptune.mp3');
victoryMusic.volume = 1;
  // Define global references to all player objects



// Start background music on first user interaction
let musicStarted = false;

function startMusicOnce() {
  if (!musicStarted) {
    bgMusic.loop = true;      // ensure it loops
    bgMusic.volume = 0.3;     // set your desired volume
    bgMusic.play().catch(() => console.log("Autoplay blocked"));
    musicStarted = true;
  }
}

// Trigger music on first user interaction
document.body.addEventListener('click', startMusicOnce, { once: true });

// Mute button
const muteBtn = document.getElementById("muteBtn");
let isMuted = false;

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  bgMusic.muted = isMuted;
  diceRollSound.muted = isMuted;
  pssClick.muted = isMuted;
  winSound.muted = isMuted;
  loseSound.muted = isMuted;

  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
});

// ----- Set initial volumes -----
bgMusic.volume = 0.3; 
pssClick.volume = 0.5;

// ----- Images -----
const rabbitImg = new Image();
rabbitImg.src = 'images/rabbit.png';
const wolfImg = new Image();
wolfImg.src = 'images/wolf.png';
const carrotImg = new Image();
carrotImg.src = 'images/carrot.png';
const bluerabbitImg = new Image();
bluerabbitImg.src = 'images/bluerabbit.png';
const redrabbitImg = new Image();
redrabbitImg.src = 'images/redrabbit.png';
const blackrabbitImg = new Image();
blackrabbitImg.src = 'images/blackrabbit.png';

carrotImg.onload = () => console.log("Carrot loaded");

// ----- Game State -----
let rabbit = { x: 0, y: 0 };
let wolf = { x: 7, y: 7 };
let redRabbit = { x: 0, y: 0 };
let blueRabbit = { x: 0, y: 7 };
let blackRabbit = { x: 7, y: 0 };



const doorBottom = { x: 6, y: 7 }; 
const doorRight = { x: 7, y: 6 };
const waterTiles = [];

const rabbitCorners = [
  { x: 0, y: 0 },
  { x: 0, y: 7 },
  { x: 7, y: 0 }
];

const questions = [
  // Single-choice
  { 
    text: "What is 7 × 6?", 
    answer: "42"
  },
  // Multiple-choice
  { 
    text: "Which of the following is not a prime number?", 
    answer: "1", 
    options: ["1", "2", "3", "5"] 
  },
  // Single-choice
  { 
    text: "What planet is known as the Red Planet?", 
    answer: "Mars"
  },
  // Multiple-choice
  { 
    text: "Which of these animals are mammals?", 
    answer: "Dolphin", 
    options: ["Penguin", "Dolphin", "Crocodile", "Eagle"] 
  },
  // Single-choice
  { 
    text: "Who wrote 'Romeo and Juliet'?", 
    answer: "William Shakespeare"
  },
  // Multiple-choice
  { 
    text: "Which is not a primary color?:", 
    answer: "Green", 
    options: ["Red", "Blue", "Yellow", "Green"] 
  },
  // Single-choice
  { 
    text: "What is the chemical symbol for water?", 
    answer: "H2O"
  },
  // Multiple-choice
  { 
    text: "Which countries are in Europe?", 
    answer: "France, Germany, Spain", 
    options: ["France", "Germany", "Spain", "Brazil"] 
  },
  // Single-choice
  { 
    text: "How many continents are there on Earth?", 
    answer: "7"
  },
  // Multiple-choice
  { 
    text: "Which of these numbers is not even?", 
    answer: "1", 
    options: ["1", "2", "4", "8"] 
  }
];

let questionIndex = 0;
let currentQuestion = null;
let answerRevealed = false;
let stepsRemaining = 0;
let currentPlayer = null;
let [diceQueue] = [];

let pssHuman 
let pssResolved = false;

let rabbitWins = 0;
let wolfWins = 0; // default, can be 5, 10, or 15
let redRabbitWins = 0;
let blueRabbitWins = 0;
let blackRabbitWins = 0;
let carrot = null;        // {x, y, turnsRemaining}
let turnsSinceCarrot = 0; // counts PSS rounds
let carrotPoints = 0;     // rabbit points for collecting carrots
let isDiceTurn = false;
let victoryPoints = 5; // default
let numTeams = 2; // default
let multiplayerQueue = []; // global variable
let currentLoserIndex = 0; // start with first loser
let nextCarrotIn = getRandomInt(3, 6); // rounds until next carrot appears
let pssIndex = 0;  // Tracks whose turn it is
let rabbitRoundCounter = 0; // increment each dice phase

// Assuming your player objects have a `name` property
let pssOrder;

let players = [];      // Global array for all players
let activeKeys = [];   // Global array for active keys
  // Determine which playerNames object to use
  let namesMap;
  if (numTeams === 2) {
    namesMap = playerNames2p; // 2-player mode
  } else if (numTeams === 3) {
    namesMap = playerNames3p; // 3-player mode
  } else {
    namesMap = playerNames4p; // 4-player mode
  }

const rabbits = [rabbit, redRabbit, blueRabbit, blackRabbit];
// ----- Safety zone helpers -----
const inSafetyZone = (x,y) => (y===8 && x>=6) || (x===8 && y>=6);

// ----- Respawn all rabbits to the farthest unoccupied corners -----
function respawnRabbit(rabbitObj) {
  // Only active rabbits in the game
  const activeRabbits = players
    .filter(p => p.name !== 'wolf')  // all rabbit players
    .map(p => p.obj)
    .filter(r => r && r !== rabbitObj);

  const occupied = [wolf, ...activeRabbits];

  // Filter out occupied corners
  const freeCorners = rabbitCorners.filter(c =>
    !occupied.some(o => o.x === c.x && o.y === c.y)
  );

  if (freeCorners.length === 0) return; // nothing to do

  // Pick the corner farthest from the wolf
  let maxDist = -1;
  let bestCorner = freeCorners[0];
  freeCorners.forEach(c => {
    const dist = Math.abs(c.x - wolf.x) + Math.abs(c.y - wolf.y);
    if (dist > maxDist) {
      maxDist = dist;
      bestCorner = c;
    }
  });

  rabbitObj.x = bestCorner.x;
  rabbitObj.y = bestCorner.y;

  // Auto-collect carrot if one exists here
  if (carrot && carrot.x === rabbitObj.x && carrot.y === rabbitObj.y) {
    collectCarrot(rabbitObj);
  }
}


// --- Helper: ensure we always work with player-wrapper {name, obj}
function ensureWrapper(item) {
  if (!item) return null;
  // already a wrapper
  if (item.name && item.obj) return item;
  // try to find the wrapper that has this obj
  return players.find(p => p.obj === item) || null;
}

// ----- Water generation -----
function pathExists(start, target){
  const queue = [start];
  const visited = new Set();
  while(queue.length){
    const {x,y} = queue.shift();
    const key = `${x},${y}`;
    if(visited.has(key)) continue;
    visited.add(key);
    if(x===target.x && y===target.y) return true;
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(const [dx,dy] of dirs){
      const nx=x+dx, ny=y+dy;
      if(nx>=0 && nx<gridSize && ny>=0 && ny<gridSize &&
         !waterTiles.some(t=>t.x===nx&&t.y===ny) &&
         !visited.has(`${nx},${ny}`)){
        queue.push({x:nx,y:ny});
      }
    }
  }
  return false;
}

function generateWaterTiles(){
  let safe=false;
  while(!safe){
    waterTiles.length=0;
    while(waterTiles.length<8){
      const x=Math.floor(Math.random()*gridSize);
      const y=Math.floor(Math.random()*gridSize);
      const occupied =
        (x===0 && y===0) || 
        (x===0 && y===7) || 
        (x===7 && y===0) || 
        (x===7 && y===7) || 
        (x===doorBottom.x && y===doorBottom.y) || 
        (x===doorRight.x && y===doorRight.y) || 
        waterTiles.some(t => t.x===x && t.y===y);
      if(!occupied) waterTiles.push({x,y});
    }
safe =
  (pathExists({x:0,y:0}, doorBottom) || pathExists({x:0,y:0}, doorRight)) &&
  (pathExists({x:0,y:7}, doorBottom) || pathExists({x:0,y:7}, doorRight)) &&
  (pathExists({x:7,y:0}, doorBottom) || pathExists({x:7,y:0}, doorRight)) &&
  (pathExists({x:7,y:7}, doorBottom) || pathExists({x:7,y:7}, doorRight));
  }
}

function generateCarrot() {
  let x, y;
  do {
    x = Math.floor(Math.random() * gridSize);
    y = Math.floor(Math.random() * gridSize);
  } while (
    (wolf && wolf.x === x && wolf.y === y) ||
    rabbits.some(r => r && r.x === x && r.y === y) ||
    waterTiles.some(t => t.x === x && t.y === y) ||
    (x === doorBottom.x && y === doorBottom.y) ||
    (x === doorRight.x && y === doorRight.y)
  );

  carrot = { x, y, turnsRemaining: 1 }; // will be immediately overwritten in endTurnUpdate
  try { carrotSound.play(); } catch(e) {}
  drawBoard();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function shuffleScoreboard() {
    const list = Array.from(document.querySelectorAll('.scoreboard-item'));
    if (list.length === 0) return []; // safety check
    const parent = list[0].parentNode;

    // Shuffle using Fisher–Yates
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }

    // Re-append shuffled elements
    list.forEach(item => parent.appendChild(item));
    return list;
}

function collectCarrot(rabbit) {
  if (carrot && rabbit.x === carrot.x && rabbit.y === carrot.y) {
    carrot = null; 
    carrotCollectSound.play(); // 🔊 play collection sound
    // optional: reset spawn counter if you want
  }
}

function resetCarrotCounter() {
  carrotTurnCounter = 0;   // or whatever variable you’re using
}

// Helper: get random integer between min and max inclusive
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function endTurnUpdate() {
  turnsSinceCarrot++;

  // --- Carrot spawning ---
  if (!carrot && turnsSinceCarrot >= nextCarrotIn) {
    // Spawn carrot
    generateCarrot();
    // Randomize how long it will stay (1–3 rounds)
    carrot.turnsRemaining = getRandomInt(1, 3);
    turnsSinceCarrot = 0; // reset counter
    // Schedule next carrot spawn
    nextCarrotIn = getRandomInt(3, 6);
  }

  // --- Carrot lifespan countdown ---
  if (carrot) {
    carrot.turnsRemaining--;
    if (carrot.turnsRemaining <= 0) {
      carrot = null;
      // Next carrot still uses nextCarrotIn as planned
    }
  }

  drawBoard();
}

// ----- Reachable squares -----
function getReachableSquares(player, steps) {
  const visited = new Set();
  const queue = [{ x: player.x, y: player.y, remaining: steps }];
  const reachable = [];

  while (queue.length) {
    const { x, y, remaining } = queue.shift();
    const key = `${x},${y},${remaining}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (remaining === 0) {
      reachable.push({ x, y });
      continue;
    }

    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;

      if (!inGrid(nx, ny) && !inSafetyZone(nx, ny)) continue;

      // Rabbits movement rules
      const isRabbit = rabbits.includes(player.obj || player);

      if (isRabbit) {
        const outsideSafety = !inSafetyZone(x, y);
        const enteringSafety = inSafetyZone(nx, ny);
        if (outsideSafety && enteringSafety) {
          const isDoor = (x === doorBottom.x && y === doorBottom.y) || (x === doorRight.x && y === doorRight.y);
          if (!isDoor) continue;
        }

        // Avoid wolf
        if (wolf.x === nx && wolf.y === ny) continue;

        // Avoid water
        if (waterTiles.some(t => t.x === nx && t.y === ny)) continue;

        // Avoid other rabbits
        if (rabbits.some(r => r !== player && r.x === nx && r.y === ny)) continue;

        // Blocked by wolf in single-cell gaps (must go around)
        if (isSingleCellGapBlocked(x, y, nx, ny)) continue;

      } else {
        // Wolf movement rules
        if (waterTiles.some(t => t.x === nx && t.y === ny)) continue;
        if (inSafetyZone(nx, ny)) continue;
        //if (carrot && carrot.x === nx && carrot.y === ny) continue;
      }

      queue.push({ x: nx, y: ny, remaining: remaining - 1 });
    }
  }
  return reachable;
}

// Helper: check if wolf blocks a single-cell path
function isSingleCellGapBlocked(x, y, nx, ny) {
  // Horizontal gap
  if ((ny === y) && Math.abs(nx - x) === 1) {
    if ((nx < wolf.x && wolf.x < x) || (x < wolf.x && wolf.x < nx)) return true;
  }
  // Vertical gap
  if ((nx === x) && Math.abs(ny - y) === 1) {
    if ((ny < wolf.y && wolf.y < y) || (y < wolf.y && wolf.y < ny)) return true;
  }
  return false;
}

// Draw A–I and 1–9 coordinates on the canvas (non-invasive)


function drawCoordinates(ctx, cellSize, gridSize) {
  const letters = 'ABCDEFGHI'.split('');  // A to I
  const numbers = Array.from({ length: 9 }, (_, i) => i + 1);  // 1 to 9

  const offset = cellSize;  // match the offset used for the grid

  ctx.save();
  ctx.font = `${cellSize / 3}px Bangers, cursive`;  // adjust size
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'black';  // coordinates color

  // Draw letters above columns
  for (let col = 0; col < letters.length; col++) {
    const x = offset + col * cellSize + cellSize / 2;
    const y = cellSize / 2;  // centered in extra top cell
    ctx.fillText(letters[col], x, y);
  }

  // Draw numbers to the left of rows
  for (let row = 0; row < numbers.length; row++) {
    const x = cellSize / 2;  // centered in extra left cell
    const y = offset + row * cellSize + cellSize / 2;
    ctx.fillText(numbers[row], x, y);
  }

  ctx.restore();
}

// ----- Drawing -----
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawCoordinates(ctx, cellSize, gridSize)

  const offset = cellSize; // leave space for coordinates

// Draw grid
for (let y = 0; y < gridSize; y++) {
  for (let x = 0; x < gridSize; x++) {
    ctx.fillStyle = "#fff"; // normal grid color
    ctx.fillRect(offset + x*cellSize, offset + y*cellSize, cellSize, cellSize);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(offset + x*cellSize, offset + y*cellSize, cellSize, cellSize);
  }
}

// Draw safety zone (backwards L)
ctx.fillStyle = "#ffd54a";
// Right column
for (let y = 6; y <= 8; y++) {
  ctx.fillRect(offset + gridSize*cellSize, offset + y*cellSize, cellSize, cellSize);
}
// Bottom row
for (let x = 6; x <= 8; x++) {
  ctx.fillRect(offset + x*cellSize, offset + gridSize*cellSize, cellSize, cellSize);
}

  // ----- Draw water tiles -----
  ctx.fillStyle = "#3a7afe";
  waterTiles.forEach(tile => {
    ctx.fillRect(
      offset + tile.x * cellSize,
      offset + tile.y * cellSize,
      cellSize,
      cellSize
    );
  });

// Draw carrot
if (carrot) {
  ctx.drawImage(
    carrotImg,
    offset + carrot.x * cellSize,
    offset + carrot.y * cellSize,
    cellSize,
    cellSize
  );
}

// ----- Highlight reachable squares -----
if (currentPlayer && stepsRemaining > 0 && isDiceTurn) {
  const playerObj = ensureWrapper(currentPlayer)?.obj || currentPlayer;
  const squares = getReachableSquares(playerObj, stepsRemaining);
  ctx.fillStyle = "rgba(0,255,0,0.3)";
  squares.forEach(sq => {
    ctx.fillRect(
      offset + sq.x * cellSize,
      offset + sq.y * cellSize,
      cellSize,
      cellSize
    );
  });
}

// ----- Draw characters -----
const imgMap = {
  rabbit: rabbitImg,
  wolf: wolfImg,
  redRabbit: redrabbitImg,
  blueRabbit: bluerabbitImg,
  blackRabbit: blackrabbitImg
};

for (const player of players) {
  if (!activeKeys.includes(player.name)) continue; // only draw active players
  const img = imgMap[player.name]; // use name, not type
  if (img) safeDrawRabbit(img, player.obj);
}

// Ensure images exist and only draw if everything is ready
function safeDrawRabbit(img, rabbit) {
  try {
    if (!img || !rabbit || !ctx) return; // safety check
    if (img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(
        img,
        offset + rabbit.x * cellSize,
        offset + rabbit.y * cellSize,
        cellSize,
        cellSize
      );
    } else {
      img.onload = () => {
        if (!ctx || !rabbit) return;
        ctx.drawImage(
          img,
          offset + rabbit.x * cellSize,
          offset + rabbit.y * cellSize,
          cellSize,
          cellSize
        );
      };
    }
  } catch (e) {
    console.error("Rabbit drawing error:", e);
  }
}






// ----- Draw border with door gaps -----
ctx.fillStyle = "#000";
const borderThickness = 4;

// Top border
ctx.fillRect(offset, offset, gridSize * cellSize, borderThickness);

// Left border
ctx.fillRect(offset, offset, borderThickness, gridSize * cellSize);

// Bottom border (with door gap at doorBottom)
ctx.fillRect(offset, offset + gridSize * cellSize - borderThickness, gridSize * cellSize, borderThickness);
ctx.clearRect(offset + doorBottom.x * cellSize, offset + gridSize * cellSize - borderThickness, cellSize, borderThickness);

// Right border (with door gap at doorRight)
ctx.fillRect(offset + gridSize * cellSize - borderThickness, offset, borderThickness, gridSize * cellSize);
ctx.clearRect(offset + gridSize * cellSize - borderThickness, offset + doorRight.y * cellSize, borderThickness, cellSize);
}

// ----- Check Win -----
// ----- Check if any score triggers victory -----
function checkWin() {
  const localRabbitKeys = ['rabbit','redRabbit','blueRabbit','blackRabbit'];
  const namesMap = (numTeams === 2) ? playerNames2p : (numTeams === 3) ? playerNames3p : playerNames4p;

  function getWrapper(key) {
    const w = players.find(p => p.name === key);
    if (!w || !w.obj) return null;
    return w;
  }

  const winsMap = {
    rabbit: () => { rabbitWins++; },
    redRabbit: () => { redRabbitWins++; },
    blueRabbit: () => { blueRabbitWins++; },
    blackRabbit: () => { blackRabbitWins++; }
  };

  // --- 1) Wolf catches a rabbit ---
  for (const key of localRabbitKeys) {
    const wrapper = getWrapper(key);
    if (!wrapper) continue;
    const r = wrapper.obj;

    if (!Number.isFinite(r.x) || !Number.isFinite(r.y)) continue;
    if (!Number.isFinite(wolf.x) || !Number.isFinite(wolf.y)) continue;

    if (wolf.x === r.x && wolf.y === r.y) {
      try { loseSound.play(); } catch(e) {}
      wolfWins++;
      updateScores();
      drawBoard();
      answerDiv.textContent = `🐺 Wolf caught ${namesMap[key] || key}!`;

      // Pause dice & movement immediately
      rollDiceBtn.disabled = true;
      currentPlayer = null;
      stepsRemaining = 0;

      // ✅ Check for victory
      checkMatchWin();

      // Only respawn rabbit if the game is NOT over
      if (wolfWins < victoryPoints) {
        setTimeout(() => {
          respawnRabbit(r);
          drawBoard();
          resumeGamePhase();
        }, 2000);
      }

      return true;
    }
  }

  // --- 2) Rabbit reaches safety ---
  for (const key of localRabbitKeys) {
    const wrapper = getWrapper(key);
    if (!wrapper) continue;
    const r = wrapper.obj;

    if (!Number.isFinite(r.x) || !Number.isFinite(r.y)) continue;

    if (inSafetyZone(r.x, r.y)) {
      try { winSound.play(); } catch(e) {}
      if (winsMap[key]) winsMap[key]();
      updateScores();
      drawBoard();
      answerDiv.textContent = `${namesMap[key] || key} reached safety!`;

      // Pause dice & movement
      rollDiceBtn.disabled = true;
      currentPlayer = null;
      stepsRemaining = 0;

      // ✅ Check for victory
      checkMatchWin();

      // Only respawn rabbit if game NOT over
      const rabbitWinCount = {
        rabbit: rabbitWins,
        redRabbit: redRabbitWins,
        blueRabbit: blueRabbitWins,
        blackRabbit: blackRabbitWins
      }[key];

      if (rabbitWinCount < victoryPoints) {
        setTimeout(() => {
          respawnRabbit(r);
          drawBoard();
          resumeGamePhase();
        }, 2000);
      }

      return true;
    }
  }

  return false;
}

// ----- Resume dice queue or PSS -----
function resumeGamePhase() {
  if (diceQueue.length > 0) {
    const nextPlayer = ensureWrapper(diceQueue[0]);
    currentPlayer = nextPlayer;
    rollDiceBtn.disabled = false;
    pssBtns.forEach(btn => btn.disabled = true);
    const namesMap = (numTeams === 2) ? playerNames2p : (numTeams === 3) ? playerNames3p : playerNames4p;
    questionDiv.textContent = `${namesMap[nextPlayer.name] || nextPlayer.name}, roll the dice!`;
  } else {
    currentPlayer = null;
    rollDiceBtn.disabled = true;
    pssBtns.forEach(btn => btn.disabled = false);
    startPSSRound();
  }
}

// ----- Check for match victory -----
function checkMatchWin() {
  const scores = {
    rabbit: rabbitWins,
    redRabbit: redRabbitWins,
    blueRabbit: blueRabbitWins,
    blackRabbit: blackRabbitWins,
    wolf: wolfWins
  };

  const namesMap = (numTeams === 2) ? playerNames2p 
                : (numTeams === 3) ? playerNames3p 
                : playerNames4p;

  for (const [key, score] of Object.entries(scores)) {
    if (score >= victoryPoints && activeKeys.includes(key)) {
      declareVictory(namesMap[key] || key, score);
      return;
    }
  }
}

// ----- Handle victory: confetti, music, and end match -----
function declareVictory(winnerName, points) {
  updateMessage(`${winnerName} wins the match with ${points} points! 🎉`);
  answerDiv.textContent = ''; // clear previous messages
  triggerConfetti();

  // Stop background music
  bgMusic.pause();
  bgMusic.currentTime = 0;

  // Play victory music
  victoryMusic.pause();
  victoryMusic.currentTime = 0;
  victoryMusic.volume = 0.3;
  victoryMusic.play().catch(err => {
    console.log("Victory music playback was blocked:", err);
  });

  resetCarrotCounter();
  endMatch();
}

// ----- End match: disable movement & PSS -----
function endMatch() {
  currentPlayer = null;
  stepsRemaining = 0;
  rollDiceBtn.disabled = true;
  pssBtns.forEach(btn => btn.disabled = true);
  diceQueue = [];
}

// ----- Confetti -----
function triggerConfetti() {
  // Simple confetti using canvas-confetti library
  // If you don’t want external libraries, you can make small falling rectangles on a canvas overlay
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
  });
}

function enableDiceButton() {
  rollDiceBtn.disabled = false;
}

function enablePSSButtons() {
  pssBtns.forEach(btn => btn.disabled = false);
}



// ----- Build Dice Queue for a Round -----

// ----- Build Dice Queue for a Round -----
function buildDiceQueue() {
    const wolfWrapper = players.find(p => p.name === "wolf");
    const rabbitOrder = getRabbitOrder(); // cyclic rotation
    const rabbitWrappers = rabbitOrder.map(name => players.find(p => p.name === name));

    // Wolf always first
    diceQueue = [wolfWrapper, ...rabbitWrappers];
    currentPlayer = diceQueue[0];
    stepsRemaining = 0;
    isDiceTurn = false;
    rollDiceBtn.disabled = false;

    updateScoreboard();
    highlightCurrentPlayer(currentPlayer.name);

    const namesMap = (numTeams === 2) ? playerNames2p
                    : (numTeams === 3) ? playerNames3p
                    : playerNames4p;
    questionDiv.textContent = `${namesMap[currentPlayer.name] || currentPlayer.name}, roll the dice first!`;
}

// ----- Get Rabbit Order (Cyclic Rotation) -----
function getRabbitOrder() {
    const activeRabbits = players.filter(p => rabbitKeys.includes(p.name)).map(p => p.name);

    const rotationIndex = rabbitRoundCounter % activeRabbits.length;
    const rotated = activeRabbits.slice(rotationIndex).concat(activeRabbits.slice(0, rotationIndex));

    rabbitRoundCounter++; // increment after rotation
    return rotated;
}

// ----- Advance Dice Queue After a Turn -----
function advanceDiceQueue() {
    if (!diceQueue || diceQueue.length < 2) return;

    // Move first rabbit (index 1) to the end for cyclic rotation
    const firstRabbit = diceQueue.splice(1, 1)[0];
    diceQueue.push(firstRabbit);

    normalizeDiceQueue();

    currentPlayer = diceQueue[0]; // Wolf always first
    stepsRemaining = 0;
    isDiceTurn = false;
    rollDiceBtn.disabled = false;

    updateScoreboard();
    highlightCurrentPlayer(currentPlayer.name);

    const namesMap = (numTeams === 2) ? playerNames2p
                   : (numTeams === 3) ? playerNames3p
                   : playerNames4p;
    questionDiv.textContent = `${namesMap[currentPlayer.name] || currentPlayer.name}, roll the dice!`;
}

// ----- Update Scoreboard -----
function updateScoreboard(queue = diceQueue) {
    const scoreboard = document.getElementById("scoreboard");
    if (!scoreboard) return;
    scoreboard.innerHTML = "";

    queue.forEach(p => {
        if (!p) return;

        let emoji = "";
        switch(p.name) {
            case 'wolf': emoji = '🐺'; break;
            case 'rabbit': emoji = '🐇'; break;
            case 'redRabbit': emoji = '🔴'; break;
            case 'blueRabbit': emoji = '🔵'; break;
            case 'blackRabbit': emoji = '⚫'; break;
        }

        const li = document.createElement("li");
        li.textContent = `${emoji} ${p.name} — Score: ${p.score ?? 0}`;
        li.classList.add("score-item");
        scoreboard.appendChild(li);
    });
}

// ----- Normalize Dice Queue -----
function normalizeDiceQueue() {
    diceQueue = diceQueue
        .map(p => {
            if (!p) return null;
            if (p.name) return p;
            if (p.obj) {
                const found = players.find(pl => pl.obj === p.obj);
                if (found && found.name) return found;
            }
            console.warn("Removed invalid diceQueue entry:", p);
            return null;
        })
        .filter(p => p && p.name);
}

// Helper: create a scoreboard <li> if missing
function createScoreItem(player) {
  const li = document.createElement('li');
  li.id = player.name + '-score';
  li.textContent = player.name; // optionally use namesMap[player.name]
  li.classList.add('score-item');
  scoresList.appendChild(li);
  return li;
}

// Optional CSS to highlight current player
/*
.score-item.current-turn {
  font-weight: bold;
  color: #e91e63;
}
*/

// ----- Start Dice Move -----
function startDiceMove(playerWrapper) {
  
  currentPlayer = playerWrapper; 
  isDiceTurn = true;
  highlightCurrentPlayer(playerWrapper.name);

  const roll = Math.floor(Math.random() * 6) + 1;
  const bonus = rabbitKeys.includes(playerWrapper.name) ? 1 : 0;
  stepsRemaining = roll + bonus;

  diceRollSound.play();

  const namesMap = (numTeams === 2) ? playerNames2p 
                : (numTeams === 3) ? playerNames3p 
                : playerNames4p;

  questionDiv.textContent = `${namesMap[playerWrapper.name] || playerWrapper.name} rolled ${roll}${bonus ? ` + 1 = ${stepsRemaining}` : ""}.`;

  drawBoard(); // redraw board with highlights
}
// ----- Click to move -----
// --- Robust canvas click handler (tolerant of wrapper/raw currentPlayer)
canvas.addEventListener("click", (e) => {
  if (!currentPlayer || stepsRemaining <= 0) return;

  const rect = canvas.getBoundingClientRect();
  const cellX = Math.floor((e.clientX - rect.left - cellSize) / cellSize);
  const cellY = Math.floor((e.clientY - rect.top - cellSize) / cellSize);

  const wrapper = ensureWrapper(currentPlayer);
  const playerObj = wrapper ? wrapper.obj : currentPlayer;
  if (!playerObj) return;

  const reachable = getReachableSquares(playerObj, stepsRemaining);
  if (!reachable.some(sq => sq.x === cellX && sq.y === cellY)) return;

  // Move player
  playerObj.x = cellX;
  playerObj.y = cellY;
  stepsRemaining = 0;
  isDiceTurn = false;

  // Carrot collection
  const playerName = wrapper ? wrapper.name : (players.find(p => p.obj === playerObj) || {}).name;
  if (carrot && rabbitKeys.includes(playerName) && playerObj.x === carrot.x && playerObj.y === carrot.y) {
    carrot = null;
    carrotCollectSound.play();
    switch (playerName) {
      case 'rabbit': rabbitWins++; break;
      case 'redRabbit': redRabbitWins++; break;
      case 'blueRabbit': blueRabbitWins++; break;
      case 'blackRabbit': blackRabbitWins++; break;
    }
    updateScores();
    const namesMap = (numTeams === 2) ? playerNames2p : (numTeams === 3) ? playerNames3p : playerNames4p;
    updateMessage(`🐇 ${namesMap[playerName] || playerName} collected a carrot!`);
    checkMatchWin();
    endMovementPhase();
  }

  // Redraw board
  drawBoard();

  // Check if win handled something
  if (checkWin()) {
    rollDiceBtn.disabled = true;
    currentPlayer = null;
    stepsRemaining = 0;
    return;
  }

  // Move to next player in diceQueue
// Move to next player in diceQueue
if (diceQueue && diceQueue.length > 0) {
  let nextPeek = diceQueue[0];
  const normalized = ensureWrapper(nextPeek);

  if (normalized) {
    diceQueue[0] = normalized; // update queue
    nextPeek = normalized;
  } else {
    const recovered = players.find(p => p.obj === nextPeek);
    if (recovered) {
      diceQueue[0] = recovered; // update queue
      nextPeek = recovered;
    }
  }

  if (nextPeek && nextPeek.name) {
    highlightCurrentPlayer(nextPeek.name); // ✅ highlight next active player
    rollDiceBtn.disabled = false;
    const namesMap = (numTeams === 2) ? playerNames2p : (numTeams === 3) ? playerNames3p : playerNames4p;
    questionDiv.textContent = `${namesMap[nextPeek.name] || nextPeek.name}, roll the dice!`;
    return;
  }
}

  // ✅ All players have moved — end dice phase
  endTurnUpdate(); // <- run after every player in diceQueue has moved

  rollDiceBtn.disabled = true;
  currentPlayer = null;
  stepsRemaining = 0;
  startPSSRound();
});


// ----- Setup players -----
function setupPlayers(numTeams) {
  activeKeys = [];
  players = [];

  if (numTeams === 2) {
    activeKeys = ['rabbit', 'wolf'];
    players = [
      { name: 'rabbit', obj: rabbit },
      { name: 'wolf', obj: wolf }
    ];
  } else if (numTeams === 3) {
  activeKeys = ['redRabbit', 'blueRabbit', 'wolf']; // no 'rabbit'
  players = [
    { name: 'redRabbit', obj: redRabbit },
    { name: 'blueRabbit', obj: blueRabbit },
    { name: 'wolf', obj: wolf }
  ];
  } else if (numTeams === 4) {
    activeKeys = ['redRabbit', 'blueRabbit', 'blackRabbit', 'wolf'];
    players = [
      { name: 'redRabbit', obj: redRabbit },
      { name: 'blueRabbit', obj: blueRabbit },
      { name: 'blackRabbit', obj: blackRabbit },
      { name: 'wolf', obj: wolf }
    ];
  }

  resetRabbitPositions();
  currentLoserIndex = 0;
  drawBoard();
}

function initPSSOrder() {
  // Only include active player names
  if (numTeams === 2) {
    pssOrder = ['rabbit', 'wolf'];
  } else if (numTeams === 3) {
    pssOrder = ['redRabbit', 'blueRabbit', 'wolf']; // rabbit removed
  } else if (numTeams === 4) {
    pssOrder = ['redRabbit', 'blueRabbit', 'blackRabbit', 'wolf']; // rabbit removed
  }

  pssIndex = 0;
  pssHuman = pssOrder[pssIndex];
}

function getNextPSSHuman(current) {
  const index = players.indexOf(current);
  return players[(index + 1) % players.length];
}

function startTurn() {
  console.log("🐾 Full players array:", players);
  const wolfWrapper = players.find(p => p.name?.toLowerCase() === "wolf");
  console.log("🐺 Wolf wrapper:", wolfWrapper);

  const rabbitOrderNames = getRabbitOrder();
  console.log("🐇 Rabbit order names:", rabbitOrderNames);

  const rabbitOrder = rabbitOrderNames
    .map(name => {
      const found = players.find(p => p.name === name);
      console.log(`Looking for ${name}, found:`, found);
      return found;
    })
    .filter(Boolean);

  diceQueue = [wolfWrapper, ...rabbitOrder].filter(Boolean);
  console.log("🎲 Dice queue:", diceQueue);

  normalizeDiceQueue();

  currentPlayer = diceQueue[0];
  if (!currentPlayer) {
    console.warn("⚠️ No valid currentPlayer in diceQueue — check logs above!");
    return;
  }

  // 🟢 Now that diceQueue is ready, update scoreboard
  updateScoreboard(diceQueue);
}


// ----- Start PSS round -----
function startPSSRound() {
    pssBtns.forEach(btn => btn.disabled = false);
    rollDiceBtn.disabled = true;
    pssResolved = false;


    // Determine which playerNames object to use
    let namesMap;
    if (numTeams === 2) {
        namesMap = playerNames2p;    // 2-player mode
        pssOrder = players.map(p => p.name); // include rabbit
    } else if (numTeams === 3) {
        namesMap = playerNames3p;  // 3-player mode
        pssOrder = players.map(p => p.name).filter(name => name !== 'rabbit'); // exclude rabbit
    } else {
        namesMap = playerNames4p;  // 4-player mode
        pssOrder = players.map(p => p.name).filter(name => name !== 'rabbit'); // exclude rabbit
    }

    // Indicate whose turn it is
    const humanName = namesMap[pssHuman] || pssHuman;
    answerDiv.textContent = `${humanName}, play paper-scissors-stone!`;
    highlightCurrentPlayer(pssHuman);
}
startTurn(); // shuffle scoreboard visually
// ----- PSS button click -----
pssBtns.forEach(btn => {
  btn.addEventListener("click", e => {
    if (pssResolved) return;

    const humanMove = btn.dataset.move; // e.g., "rock", "paper", "scissors"

    // 🔊 Play PSS sound
    try { pssClick.currentTime = 0; pssClick.play(); } catch (err) {
      console.log("PSS sound blocked:", err);
    }

    const moves = {};

    // Current human move
    moves[pssHuman] = humanMove;

    // Other players moves (random)
    players.forEach(p => {
      if (p.name !== pssHuman) {
        moves[p.name] = randomPSSMove();
      }
    });
questionDiv.innerHTML = Object.entries(moves)
  .map(([name, move]) => `${namesMap[name] || name} chose ${move}`)
  .join(" | ");
    // Determine losers
    losers = getLosers(moves);

    if (losers.length > 0) {
      currentLoserIndex = 0;
      currentQuestion = questions[questionIndex];
      questionIndex = (questionIndex + 1) % questions.length;

 // Display losers
const loserNames = losers.map(p => namesMap[p] || p).join(", ");
answerDiv.textContent = `${loserNames} must answer!`;

      controlsDiv.innerHTML = "";
      const showBtn = document.createElement("button");
      showBtn.textContent = "Show Question";
      showBtn.classList.add("controlsBtn");
      controlsDiv.appendChild(showBtn);

      showBtn.addEventListener("click", () => {
        controlsDiv.innerHTML = "";
        answerShown = false;
        askNextLoserQuestion();
      });

      pssBtns.forEach(b => (b.disabled = true));
      pssResolved = true;
    } else {
      // Tie → move to next human
      nextPSSHuman();
      startPSSRound();
    }
  });
});

function endMovementPhase() {
  // Clear previous buttons/messages
  controlsDiv.innerHTML = "";

  // Disable dice until PSS is completed
  rollDiceBtn.disabled = true;
}

// ----- Ask each losing player a question -----
function askNextLoserQuestion() {
  if (currentLoserIndex >= losers.length) {
    endPSSRound();
    return;
  }

  const currentLoser = losers[currentLoserIndex];

  // ✅ Highlight the current loser immediately
  highlightCurrentPlayer(currentLoser);

  currentQuestion = questions[questionIndex];
  questionIndex = (questionIndex + 1) % questions.length;

  // Show question text and current loser
  questionDiv.textContent = currentQuestion.text;
  answerDiv.textContent = `${namesMap[currentLoser] || currentLoser} must answer!`;
  controlsDiv.innerHTML = "";
  answerShown = false;

  // ✅ Create the buttons for the current question
  showNextStep();
}

  // --- Define button creation ---
function showNextStep() {
  controlsDiv.innerHTML = ""; // clear previous buttons/messages
  answerShown = false;

  const hasOptions = currentQuestion.options && currentQuestion.options.length > 0;
  const isMoreLosers = currentLoserIndex < losers.length - 1; // strictly less than last index

  if (hasOptions) {
    currentQuestion.options.forEach(opt => {
      const optBtn = document.createElement("button");
      optBtn.textContent = opt;
      optBtn.classList.add("controlsBtn");
      controlsDiv.appendChild(optBtn);

      optBtn.addEventListener("click", () => {
        if (!answerShown) {
          answerDiv.textContent = `Answer: ${currentQuestion.answer}`;
          answerShown = true;

          controlsDiv.innerHTML = "";
          const nextBtn = document.createElement("button");
          nextBtn.textContent = isMoreLosers ? "Next Question" : "End PSS";
          nextBtn.classList.add("controlsBtn");
          controlsDiv.appendChild(nextBtn);

          nextBtn.addEventListener("click", showNextOrEnd);
        }
      });
    });
  } else {
    const showAnswerBtn = document.createElement("button");
    showAnswerBtn.textContent = "Show Answer";
    showAnswerBtn.classList.add("controlsBtn");
    controlsDiv.appendChild(showAnswerBtn);

    showAnswerBtn.addEventListener("click", () => {
      if (!answerShown) {
        answerDiv.textContent = `Answer: ${currentQuestion.answer}`;
        answerShown = true;

        controlsDiv.innerHTML = "";
        const nextBtn = document.createElement("button");
        nextBtn.textContent = isMoreLosers ? "Next Question" : "End PSS";
        nextBtn.classList.add("controlsBtn");
        controlsDiv.appendChild(nextBtn);

        nextBtn.addEventListener("click", showNextOrEnd);
      }
    });
  }
}



// --- Handles "Next Question" or end-of-round ---
function showNextOrEnd() {
  controlsDiv.innerHTML = "";

  if (currentLoserIndex < losers.length - 1) {
    // Next loser in this PSS round
    currentLoserIndex++;
    askNextLoserQuestion();
  } else {
    // All losers finished → resume dice phase
    losers = [];
    currentLoserIndex = 0;

    // 🔄 Advance PSS human for the NEXT round
    pssIndex = (pssIndex + 1) % pssOrder.length;
    pssHuman = pssOrder[pssIndex];

    // ✅ Update UI: move message to questionDiv & clear answerDiv
    questionDiv.textContent = `🐺 Wolf, roll the dice!`;
    answerDiv.textContent = "";

    rollDiceBtn.disabled = false;

if (numTeams === 2) {
  diceQueue = [
    players.find(p => p.name === "wolf").obj,
    players.find(p => p.name === "rabbit").obj
  ];
} else {
  const rabbitNames = getRabbitOrder(); // <-- rotated list
  const rabbitObjs = rabbitNames.map(name => players.find(p => p.name === name).obj);
  diceQueue = [
    players.find(p => p.name === "wolf").obj,
    ...rabbitObjs
  ];
}
  }
}



function randomPSSMove() {
  const moves = ["rock", "paper", "scissors"];
  return moves[Math.floor(Math.random() * moves.length)];
}

// ----- End PSS round -----
function endPSSRound() {
  pssIndex = (pssIndex + 1) % pssOrder.length;
  pssHuman = pssOrder[pssIndex];

// Update PSS prompt
answerDiv.textContent = `${namesMap[pssHuman] || pssHuman}, play paper-scissors-stone!`;
updateScoreboard(diceQueue);
highlightCurrentPlayer(pssHuman);

  pssBtns.forEach(btn => btn.disabled = false);
}



function getLosers(moves) {
  const beats = { rock: "scissors", scissors: "paper", paper: "rock" };
  const moveSet = new Set(Object.values(moves));

  // If everyone chose the same move → true tie
  if (moveSet.size === 1) return [];

  let losersArr = [];
  for (let [player, move] of Object.entries(moves)) {
    // Check if any other player's move beats this player's move
    const beatenBySomeone = Object.values(moves).some(
      otherMove => beats[otherMove] === move
    );
    if (beatenBySomeone) losersArr.push(player);
  }

  return losersArr;
}



// ----- Helper to highlight current PSS human -----
function highlightCurrentPlayer(playerName) {
  const allScores = ["rabbitScore","redRabbitScore","blueRabbitScore","blackRabbitScore","wolfScore"];
  allScores.forEach(id => document.getElementById(id).classList.remove("currentTurn"));

  switch(playerName){
    case 'rabbit': document.getElementById("rabbitScore").classList.add("currentTurn"); break;
    case 'redRabbit': document.getElementById("redRabbitScore").classList.add("currentTurn"); break;
    case 'blueRabbit': document.getElementById("blueRabbitScore").classList.add("currentTurn"); break;
    case 'blackRabbit': document.getElementById("blackRabbitScore").classList.add("currentTurn"); break;
    case 'wolf': document.getElementById("wolfScore").classList.add("currentTurn"); break;
  }
}


// ----- Scoreboard -----
function updateScores() {
  document.getElementById("rabbitScore").textContent = `🐇 Rabbit: ${rabbitWins}`;
  document.getElementById("redRabbitScore").textContent = `🔴 Rabbit: ${redRabbitWins}`;
  document.getElementById("blueRabbitScore").textContent = `🔵 Rabbit: ${blueRabbitWins}`;
  document.getElementById("blackRabbitScore").textContent = `⚫ Rabbit: ${blackRabbitWins}`;
  document.getElementById("wolfScore").textContent = `🐺 Wolf: ${wolfWins}`;
}

function updateScoreDisplay() {
  const rabbitScore = document.getElementById("rabbitScore");
  const wolfScore = document.getElementById("wolfScore");
  const blueRabbitScore = document.getElementById("blueRabbitScore");
  const redRabbitScore = document.getElementById("redRabbitScore");
  const blackRabbitScore = document.getElementById("blackRabbitScore");

  // Hide everything first
  rabbitScore.style.display = "none";
  wolfScore.style.display = "none";
  blueRabbitScore.style.display = "none";
  redRabbitScore.style.display = "none";
  blackRabbitScore.style.display = "none";

  // Wolf is always shown
  wolfScore.style.display = "list-item";
  wolfScore.textContent = `🐺 Wolf: ${wolfWins}`;

  // Show according to numTeams
  if (numTeams === 2) {
    // Keep 2-player exactly as before
    rabbitScore.style.display = "list-item";
    rabbitScore.textContent = `🐇 Rabbit: ${rabbitWins}`;
  } else if (numTeams === 3) {
    // 3-player: red rabbit + blue rabbit + wolf
    redRabbitScore.style.display = "list-item";
    blueRabbitScore.style.display = "list-item";

    // Use per-rabbit counters (start at 0). You can map rabbitWins to redRabbitWins if desired.
    redRabbitScore.textContent = `🐇 Red Rabbit: ${redRabbitWins}`;
    blueRabbitScore.textContent = `🐇 Blue Rabbit: ${blueRabbitWins}`;
  } else if (numTeams === 4) {
    // 4-player: red, blue, black, wolf
    redRabbitScore.style.display = "list-item";
    blueRabbitScore.style.display = "list-item";
    blackRabbitScore.style.display = "list-item";

    redRabbitScore.textContent = `🐇 Red Rabbit: ${redRabbitWins}`;
    blueRabbitScore.textContent = `🐇 Blue Rabbit: ${blueRabbitWins}`;
    blackRabbitScore.textContent = `🐇 Black Rabbit: ${blackRabbitWins}`;
  }
}

function resetRabbitPositions() {
  const startingPositions = {
    rabbit: { x: 0, y: 0 },       // Default rabbit (2-player mode)
    blueRabbit: { x: 0, y: 0 },
    redRabbit: { x: 0, y: 7 },
    blackRabbit: { x: 7, y: 0 },
    wolf: { x: 7, y: 7 }          // add wolf position
  };

  activeKeys.forEach(key => {
    if (startingPositions[key]) {
      switch (key) {
        case "rabbit":
          rabbit.x = startingPositions[key].x;
          rabbit.y = startingPositions[key].y;
          break;
        case "wolf":
          wolf.x = startingPositions[key].x;
          wolf.y = startingPositions[key].y;
          break;
        case "redRabbit":
          redRabbit.x = startingPositions[key].x;
          redRabbit.y = startingPositions[key].y;
          break;
        case "blueRabbit":
          blueRabbit.x = startingPositions[key].x;
          blueRabbit.y = startingPositions[key].y;
          break;
        case "blackRabbit":
          blackRabbit.x = startingPositions[key].x;
          blackRabbit.y = startingPositions[key].y;
          break;
      }
    } else {
      console.warn(`No starting position for key: ${key}`);
    }
  });
}

function nextPSSHuman() {
  if (pssOrder.length === 0) return; // fallback

  pssIndex = (pssIndex + 1) % pssOrder.length; // cycle through rabbits
  pssHuman = pssOrder[pssIndex];
}

// ----- Reset -----
function reset() {
  // 🛑 Stop victory music if it's playing
  if (!victoryMusic.paused) {
    victoryMusic.pause();
    victoryMusic.currentTime = 0;
  }

  // 🎵 Restart background music if needed
  if (!musicStarted) {
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    bgMusic.play().catch(() => console.log("Autoplay blocked"));
    musicStarted = true;
  }

  // 🐇 Reset all player positions
  resetRabbitPositions();

  // 🏆 Reset all scores
  rabbitWins = 0;
  redRabbitWins = 0;
  blueRabbitWins = 0;
  blackRabbitWins = 0;
  wolfWins = 0;
  updateScores();

  // 💧 Regenerate water tiles
  waterTiles.length = 0;
  generateWaterTiles();

 const rabbitNames = getRabbitOrder();
const rabbitObjs = rabbitNames.map(name => players.find(p => p.name === name));
diceQueue = [
  players.find(p => p.name === "wolf"),
  ...rabbitObjs
];

  currentPlayer = null;
  stepsRemaining = 0;
  rollDiceBtn.disabled = false;

  // ✂️ Reset PSS order
  initPSSOrder();

  // 🖼️ Redraw board & clear messages
  drawBoard();
  answerDiv.textContent = '';
  questionDiv.textContent = "Play paper-scissors-stone to start!";

  // 🚀 Start next PSS round
  startPSSRound();
}


// ----- Update message -----
function updateMessage(msg){
  questionDiv.textContent = msg;
}

// ----- Restart Button -----
const restartBtn = document.getElementById("restartBtn");
restartBtn.addEventListener("click", reset);

// Initial setup
// ----- Initial Setup -----
window.addEventListener("load", () => {
  // Generate water tiles and draw initial board
  generateWaterTiles();
    // Setup players with default 2-player mode before first draw
  setupPlayers(numTeams); 
initPSSOrder();
  drawBoard();

  // Show the multiplayer modal
  teamModal.classList.add("show");

  // Handle team selection
  teamBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      numTeams = parseInt(btn.dataset.teams);
      teamModal.classList.remove("show");
      updateMessage(`${numTeams}-player mode selected`);

      updateScoreDisplay();

      // Show victory points modal
      victoryModal.classList.add("show");
    });
  });

  // Handle victory points selection
  vpBtns.forEach(vpBtn => {
    vpBtn.addEventListener("click", () => {
      victoryPoints = parseInt(vpBtn.dataset.points);
      victoryModal.classList.remove("show");
      updateMessage(`First to ${victoryPoints} points wins!`);

if (numTeams === 2) {
    // 2-player mode
    setupPlayers(numTeams); 
    startPSSRound();
} else {
    // 3- or 4-player mode
    setupPlayers(numTeams);

    // Pick the first player as current human
    currentPlayer = 0;
    pssHuman = players[currentPlayer].name;

    // Use the correct playerNames object depending on mode
    const namesMap = (numTeams === 3) ? playerNames3p : playerNames4p;

    // Update answerDiv immediately
    answerDiv.textContent = `${namesMap[pssHuman] || pssHuman}, play paper-scissors-stone!`;

    // Start the PSS round for multiplayer
    startPSSRound();
}

    });
  });
});

// ----- Roll Dice -----
// --- Robust roll dice button handler (accepts wrapper or raw obj in diceQueue)
rollDiceBtn.addEventListener("click", () => {
  if (!diceQueue || diceQueue.length === 0) return;

  // pop next item and normalize to wrapper form
  let next = diceQueue.shift();
  next = ensureWrapper(next) || next; // if we couldn't find wrapper, keep next as-is to avoid throwing

  // If we still don't have a wrapper, try to create a temporary one using name lookup
  if (!next || !next.name || !next.obj) {
    console.warn("rollDiceBtn: expected a player wrapper but got:", next, " - trying to recover.");
    // fallback: if next matches a players.obj, convert it
    const recovered = players.find(p => p.obj === next);
    if (recovered) next = recovered;
    else {
      // give up safely
      rollDiceBtn.disabled = true;
      return;
    }
  }

  // Start dice move with a proper wrapper
  startDiceMove(next);
  rollDiceBtn.disabled = true;
});

// ----- Rules Panel -----
const rulesBtn = document.getElementById("rulesBtn");
const rulesPanel = document.getElementById("rulesPanel");
const closeRulesBtn = document.getElementById("closeRulesBtn");

rulesBtn.addEventListener("click", () => {
  rulesPanel.classList.add("show");   // slide in
});

closeRulesBtn.addEventListener("click", () => {
  rulesPanel.classList.remove("show"); // slide out
});