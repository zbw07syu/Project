// ==== VARIABLES ====
const gridOrder = [1, 6, 4, 7, 2, 8, 3, 9, 5];
let questions = [
  { q: "What is the capital of France?", a: "Paris", points: 10 },
  { q: "5 + 7 = ?", a: "12", points: 10 },
  { q: "What planet is known as the Red Planet?", a: "Mars", points: 10 },
  { q: "What gas do plants breathe in?", a: "Carbon Dioxide", points: 25 },
  { q: "Who wrote 'Hamlet'?", a: "Shakespeare", points: 25 },
  { q: "What is the largest mammal?", a: "Blue Whale", points: 50 },
  { q: "What is H2O?", a: "Water", points: 10 },
  { q: "Which ocean is the largest?", a: "Pacific", points: 25 },
  { q: "What is 9 x 9?", a: "81", points: 10 },
  { q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci", points: 25 },
  { q: "What is the tallest mountain?", a: "Mount Everest", points: 50 },
  { q: "Which continent is Egypt in?", a: "Africa", points: 10 },
  { q: "What is the fastest land animal?", a: "Cheetah", points: 25 },
  { q: "Who discovered gravity?", a: "Isaac Newton", points: 25 },
  { q: "What is the square root of 144?", a: "12", points: 10 },
  { q: "Which planet is closest to the sun?", a: "Mercury", points: 10 },
  { q: "Who wrote '1984'?", a: "George Orwell", points: 25 },
  { q: "What is the chemical symbol for gold?", a: "Au", points: 25 },
  { q: "Which animal is known as King of the Jungle?", a: "Lion", points: 10 },
  { q: "What is the largest desert?", a: "Sahara", points: 25 },
  { q: "Which country has the Great Barrier Reef?", a: "Australia", points: 50 },
  { q: "Who invented the telephone?", a: "Alexander Graham Bell", points: 25 },
  { q: "What is 15 + 27?", a: "42", points: 10 },
  { q: "Which planet has rings?", a: "Saturn", points: 10 },
  { q: "Who is the author of 'Harry Potter'?", a: "J.K. Rowling", points: 25 },
  { q: "What is the boiling point of water in Celsius?", a: "100", points: 10 },
  { q: "Which is the largest internal organ?", a: "Liver", points: 25 },
  { q: "What is the smallest prime number?", a: "2", points: 10 },
  { q: "What is the capital of Japan?", a: "Tokyo", points: 25 },
  { q: "Which planet is known for its red color?", a: "Mars", points: 10 }
];

let currentQuestionIndex = 0;
let teams = [
  { score: 0 },
  { score: 0 }
]; // 2 teams
let currentTeam = null;
let started = false;
let tornadoBoxes = [];
let pickedBoxesCount = 0;


// ==== DOM ELEMENTS ====
const grid = document.getElementById("grid");
const questionDiv = document.getElementById("question");
const answerDiv = document.getElementById("answer");
const controlsDiv = document.getElementById("controls");
const scoresList = document.getElementById("scores");
const diceResult = document.getElementById("diceResult");

const bgMusic = document.getElementById("bgMusic");
const correctSfx = document.getElementById("correctSfx");
const incorrectSfx = document.getElementById("incorrectSfx");
const tornadoSfx = document.getElementById("tornadoSfx");
const diceSfx = document.getElementById("diceSfx");
const passSfx = document.getElementById("passSfx");
const rollDiceBtn = document.getElementById("rollDiceBtn");

// ==== FUNCTIONS ====

// ----- Set initial volumes -----
bgMusic.volume = 1;        // background music lower
correctSfx.volume = 0.5;
incorrectSfx.volume = 0.5;
tornadoSfx.volume = 0.5;
diceSfx.volume = 0.5;
passSfx.volume = 0.5;

function loadFontAndBackground() {
  const body = document.body;
  const bgImage = new Image();
  bgImage.src = 'images/tornadobackground.jpg';

  // Font loading promise
  const fontLoad = document.fonts.load('1em "Bangers"');

  // Background image loading promise
  const bgLoad = new Promise((resolve) => {
    bgImage.onload = resolve;
    bgImage.onerror = resolve; // don't block if image fails
  });

  // Wait for both, but always show content after a short timeout
  const fallbackTimeout = new Promise(resolve => setTimeout(resolve, 500)); // 0.5s max wait

  Promise.race([Promise.all([fontLoad, bgLoad]), fallbackTimeout]).then(() => {
    // Add class for font-loaded styling
    body.classList.add('font-loaded');

    // Make sure key elements are visible
    ['grid', 'question', 'answer', 'scores', 'controls', 'diceResult'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.style.opacity = 1;
      if(el) el.style.visibility = 'visible';
    });
  });
}


// Shuffle array
function shuffleArray(array) {
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Assign tornadoes
function assignTornadoes() {
  tornadoBoxes = [];
  const boxes = [...gridOrder];
  while (tornadoBoxes.length < 3) {
    const idx = Math.floor(Math.random()*boxes.length);
    tornadoBoxes.push(boxes[idx]);
    boxes.splice(idx,1);
  }
  console.log("Tornado boxes this game:", tornadoBoxes);
}

function updateScores() {
  scoresList.innerHTML = '';
  teams.forEach((team, idx) => {
    const li = document.createElement('li');
    li.textContent = `Team ${idx + 1}: ${team.score}`;

    // Highlight using the correct class
    if (started && currentTeam === idx) {
      li.classList.add('active'); // <-- matches your CSS
    }

    scoresList.appendChild(li);
  });
}

// Update turn message
function updateTurnMessage() {
  if (!started) return; // skip if game hasn't started yet
  questionDiv.textContent = `Team ${currentTeam + 1}, choose a square!`;
  answerDiv.textContent = "";
  controlsDiv.textContent = "";
}

// Reveal tornado
function revealTornado(squareId) {
  const squareBtn = document.getElementById(squareId);

  // Insert tornado image
  squareBtn.innerHTML = `<img src="images/tornado.png" alt="Tornado!" style="width:100%; height:100%; object-fit:cover;">`;

  // Add fade + spin animation
  const img = squareBtn.querySelector("img");
  img.classList.add("tornado-fade-in");

  // Add shake effect after spin
  setTimeout(() => {
    img.classList.add("tornado-shake");
  }, 500);

  // Play tornado sound
  tornadoSfx.currentTime = 0;
  tornadoSfx.play();

  // Flash the screen
  const flashDiv = document.createElement("div");
  flashDiv.classList.add("screen-flash");
  document.body.appendChild(flashDiv);
  setTimeout(() => document.body.removeChild(flashDiv), 200);

  // Deduct all points from current team
  teams[currentTeam].score = 0;
  updateScores();

  // End turn after animations
  setTimeout(() => endTurn(), 800); // small delay so animations finish
}

// Dice roll to start
function rollDice() {
  // Disable Roll Dice during game
  rollDiceBtn.disabled = true;

  bgMusic.volume = 0.3;
  bgMusic.play().catch(err => console.log("Music play blocked:", err));
  diceSfx.currentTime = 0;
  diceSfx.play().catch(err => console.log("Dice play blocked:", err));

  assignTornadoes();
  questions = shuffleArray([...questions]);

  const rolls = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
  diceResult.textContent = `Team 1 rolled ${rolls[0]}\nTeam 2 rolled ${rolls[1]}`;

  if (rolls[0] > rolls[1]) currentTeam = 0;
  else if (rolls[1] > rolls[0]) currentTeam = 1;
  else {
    diceResult.textContent += " — Tie! Roll again.";
    rollDiceBtn.disabled = false; // re-enable for tie
    return;
  }

  started = true;            // first dice roll completed
  updateScores();            // highlight current team

  // Enable all grid buttons for first turn
  gridOrder.forEach(num => {
    const btn = document.getElementById("square" + num);
    btn.disabled = false;
    btn.style.background = ""; // reset visual
  });

  // Clear previous messages
  answerDiv.textContent = "";
  controlsDiv.textContent = "";

  // Show which team chooses a square
  updateTurnMessage();
}

// ----- Pick a box -----
function pickBox(btn, num) {
  if (!started) { 
    alert("Roll the dice first!"); 
    return;
  }
  if (btn.disabled) return;

  btn.disabled = true;
  btn.style.background = "#ccc";
  pickedBoxesCount++;

  if (tornadoBoxes.includes(num)) {
    revealTornado("square" + num);
    return;
  }

  const question = questions[currentQuestionIndex % questions.length];
  questionDiv.textContent = question.q;

  // Show "Reveal Answer" button
  answerDiv.innerHTML = `<button class="answer-btn" onclick="showAnswer('${question.a}', ${question.points})">Show Answer</button>`;

  // Disable everything except "Reveal Answer"
  setButtonsState({ grid: false, revealAnswer: true, correctIncorrect: false });

  currentQuestionIndex++;
}

// ----- Show answer -----
function showAnswer(answer, points){ 
  answerDiv.textContent = `Answer: ${answer}`;

  // Enable only Correct/Incorrect buttons
  controlsDiv.innerHTML = `
    <button class="correct-btn" onclick="markAnswer(true, ${points})">Correct</button>
    <button class="incorrect-btn" onclick="markAnswer(false, ${points})">Incorrect</button>
  `;
  setButtonsState({ grid: false, revealAnswer: false, correctIncorrect: true });
}

// ----- Mark answer -----
function markAnswer(correct, points){
  // Clear answer display
  answerDiv.textContent = "";

  if (correct) {
    correctSfx.currentTime = 0; 
    correctSfx.play();
    teams[currentTeam].score += points;
    updateScores();

    // Show Continue + Pass buttons
    controlsDiv.innerHTML = `
      <button class="continue-btn" onclick="continueTurn()">Continue</button>
      <button class="pass-btn" onclick="passTurn()">Pass</button>
    `;
    // Disable all other buttons
    setButtonsState({ grid: false, revealAnswer: false, correctIncorrect: false });
    document.querySelectorAll(".continue-btn, .pass-btn").forEach(btn => btn.disabled = false);

  } else {
    incorrectSfx.currentTime = 0; 
    incorrectSfx.play().catch(err => console.log("Incorrect sound blocked:", err));
    endTurn();
  }

  if (pickedBoxesCount >= 9) checkGameEnd();
}

// ----- Continue turn -----
function continueTurn() {
  // Clear previous answer and controls
  answerDiv.textContent = "";
  controlsDiv.textContent = "";

  // Show message for the same team to choose another square
  questionDiv.textContent = `Team ${currentTeam + 1}, choose another square!`;

  // Enable only grid buttons
  setButtonsState({ grid: true, revealAnswer: false, correctIncorrect: false });
}

// ----- Pass turn -----
function passTurn() {
  passSfx.currentTime = 0;
  passSfx.play().catch(err => console.log("Pass sound blocked:", err));
  endTurn();
}

// ----- Manage which buttons are enabled/disabled -----
function setButtonsState({ grid = false, revealAnswer = false, correctIncorrect = false }) {
  gridOrder.forEach(num => {
    document.getElementById("square" + num).disabled = !grid;
  });

  document.querySelectorAll(".answer-btn").forEach(btn => btn.disabled = !revealAnswer);
  document.querySelectorAll(".correct-btn, .incorrect-btn").forEach(btn => btn.disabled = !correctIncorrect);
}

// End turn
function endTurn() {
  questionDiv.textContent = "";
  answerDiv.textContent = "";
  controlsDiv.textContent = "";

  currentTeam = (currentTeam + 1) % teams.length;
  updateScores();

  if(pickedBoxesCount >= 9) {
    checkGameEnd();
  } else {
    updateTurnMessage(); // "Team X, choose a square!"
    // Enable only unpicked grid buttons
    gridOrder.forEach(num => {
      const btn = document.getElementById("square" + num);
      if(btn.style.background !== "#ccc") btn.disabled = false;
    });
    setButtonsState({ grid: true });
  }
}

// Restart game
function restartGame() {
  location.reload();
}

function checkGameEnd() {
  if (pickedBoxesCount >= 9) {
    let winnerText = '';
    if (teams[0].score > teams[1].score) winnerText = "Team 1 are the winners!";
    else if (teams[1].score > teams[0].score) winnerText = "Team 2 are the winners!";
    else winnerText = "It's a tie!";

    // Clear previous content
    questionDiv.innerHTML = '';
    answerDiv.innerHTML = '';
    controlsDiv.innerHTML = '';

    // Victory message
    const victoryEl = document.createElement('div');
    victoryEl.classList.add('victory-text');
    victoryEl.textContent = `🎉 ${winnerText} 🎉`;
    questionDiv.appendChild(victoryEl);

    // Trigger confetti
    launchConfetti(document.body);

    // Disable all grid buttons
    gridOrder.forEach(num => {
      const btn = document.getElementById("square" + num);
      btn.disabled = true;
    });

    // Keep Roll Dice disabled
    rollDiceBtn.disabled = true;

    // Remove team highlight
    updateScores(); 
  }
}

// ---- Highlight Current Team ----
function highlightCurrentTeam(teamIndex) {
  const lis = scoresList.querySelectorAll("li");
  lis.forEach((li, idx) => {
    if (teamIndex === null) li.style.background = "";
    else li.style.background = (idx === teamIndex) ? "#ff0" : "";
  });
}
  
function launchConfetti(container) {
  const colors = ["#ff0", "#f00", "#0f0", "#00f", "#ff69b4", "#ffa500"];
  const numPieces = 100;

  // Hide scrollbars temporarily
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  for (let i = 0; i < numPieces; i++) {
    const confetti = document.createElement("div");
    confetti.style.position = "absolute";
    confetti.style.width = "8px";
    confetti.style.height = "8px";
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * container.clientWidth + "px";
    confetti.style.top = "-10px";
    confetti.style.opacity = Math.random();
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(confetti);

    const fallDuration = 3000 + Math.random() * 2000;
    confetti.animate([
      { transform: `translateY(0px) rotate(${Math.random() * 360}deg)` },
      { transform: `translateY(${container.clientHeight + 50}px) rotate(${Math.random() * 720}deg)` }
    ], { duration: fallDuration, iterations: 1, easing: "linear" });

    setTimeout(() => confetti.remove(), fallDuration); 
  }

  // Restore scrollbars after confetti duration
  setTimeout(() => {
    document.body.style.overflow = originalOverflow;
  }, 5000); // slightly longer than max fallDuration
}

// Toggle background music
function toggleMusic() {
  if(bgMusic.paused) bgMusic.play();
  else bgMusic.pause();
}

// Show initial scoreboard on load
document.addEventListener("DOMContentLoaded", () => {

  console.log("DOM fully loaded, initializing game...");

  // ==== DOM ELEMENTS ====
  const grid = document.getElementById("grid");
  const questionDiv = document.getElementById("question");
  const answerDiv = document.getElementById("answer");
  const scoresList = document.getElementById("scores");
  const diceResult = document.getElementById("diceResult");
  const rollDiceBtn = document.getElementById("rollDiceBtn");

  // ==== Build grid buttons ====
  gridOrder.forEach(num => {
    const btn = document.createElement("button");
    btn.textContent = num;
    btn.id = "square" + num;
    btn.onclick = () => pickBox(btn, num);
    btn.disabled = true; // initially disabled until dice roll
    grid.appendChild(btn);
  });

  // ==== Show initial scoreboard ====
  updateScores();

  // ==== Initial message ====
  questionDiv.textContent = "🎲 Roll the dice to begin the game!";
  answerDiv.textContent = "";
  controlsDiv.textContent = "";

  // ==== Disable all grid buttons at start ====
  gridOrder.forEach(num => {
    const btn = document.getElementById("square" + num);
    btn.disabled = true;
    btn.style.background = "";
  });

  // ==== Enable only roll dice button ====
  rollDiceBtn.disabled = false;
  rollDiceBtn.addEventListener("click", rollDice);

  // ==== Ensure other buttons hidden ====
  setButtonsState({ grid: false, revealAnswer: false, correctIncorrect: false });

  // ==== Rules panel toggle ====
  const rulesBtn = document.getElementById("rulesBtn");
  const rulesPanel = document.getElementById("rulesPanel");
  const closeRulesBtn = document.getElementById("closeRulesBtn");

  rulesBtn.addEventListener("click", () => {
    rulesPanel.classList.add("show");   // slide in
  });

  closeRulesBtn.addEventListener("click", () => {
    rulesPanel.classList.remove("show"); // slide out
  });

});

['grid', 'question', 'answer', 'scores', 'controls', 'diceResult'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.style.opacity = 1;
    el.style.visibility = 'visible';
  }
});