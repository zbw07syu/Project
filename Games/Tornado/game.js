// ==== CONFIGURABLE GAME STATE (dynamic 3-4 team support) ====

// Grid and questions (default fallback set; can be overridden by Editor payload)
let questions = [
  { type: "multiple", q: "What is the capital of France?", a: "Paris", options: ["Paris", "London", "Berlin", "Rome"], points: 10 },
  { type: "multiple", q: "5 + 7 = ?", a: "12", options: ["10", "12", "14", "15"], points: 10 },
  { type: "multiple", q: "What planet is known as the Red Planet?", a: "Mars", options: ["Mars", "Venus", "Jupiter", "Saturn"], points: 10 },
  { type: "single", q: "What gas do plants breathe in?", a: "Carbon Dioxide", points: 25 },
  { type: "single", q: "Who wrote 'Hamlet'?", a: "Shakespeare", points: 25 },
  { type: "single", q: "What is the largest mammal?", a: "Blue Whale", points: 50 },
  { type: "multiple", q: "What is H2O?", a: "Water", options: ["Water", "Hydrogen", "Oxygen", "Salt"], points: 10 },
  { type: "single", q: "Which ocean is the largest?", a: "Pacific", points: 25 },
  { type: "multiple", q: "What is 9 x 9?", a: "81", options: ["72", "81", "99", "90"], points: 10 },
  { type: "single", q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci", points: 25 },
  { type: "single", q: "What is the tallest mountain?", a: "Mount Everest", points: 50 },
  { type: "multiple", q: "Which continent is Egypt in?", a: "Africa", options: ["Africa", "Asia", "Europe", "South America"], points: 10 },
  { type: "single", q: "What is the fastest land animal?", a: "Cheetah", points: 25 },
  { type: "single", q: "Who discovered gravity?", a: "Isaac Newton", points: 25 },
  { type: "multiple", q: "What is the square root of 144?", a: "12", options: ["10", "12", "14", "16"], points: 10 },
  { type: "multiple", q: "Which planet is closest to the sun?", a: "Mercury", options: ["Mercury", "Venus", "Earth", "Mars"], points: 10 },
  { type: "single", q: "Who wrote '1984'?", a: "George Orwell", points: 25 },
  { type: "single", q: "What is the chemical symbol for gold?", a: "Au", points: 25 },
  { type: "multiple", q: "Which animal is known as King of the Jungle?", a: "Lion", options: ["Lion", "Tiger", "Elephant", "Giraffe"], points: 10 },
  { type: "single", q: "What is the largest desert?", a: "Sahara", points: 25 },
  { type: "single", q: "Which country has the Great Barrier Reef?", a: "Australia", points: 50 },
  { type: "single", q: "Who invented the telephone?", a: "Alexander Graham Bell", points: 25 },
  { type: "multiple", q: "What is 15 + 27?", a: "42", options: ["32", "42", "45", "52"], points: 10 },
  { type: "multiple", q: "Which planet has rings?", a: "Saturn", options: ["Saturn", "Jupiter", "Uranus", "Neptune"], points: 10 },
  { type: "single", q: "Who is the author of 'Harry Potter'?", a: "J.K. Rowling", points: 25 },
  { type: "multiple", q: "What is the boiling point of water in Celsius?", a: "100", options: ["90", "100", "110", "120"], points: 10 },
  { type: "single", q: "Which is the largest internal organ?", a: "Liver", points: 25 },
  { type: "multiple", q: "What is the smallest prime number?", a: "2", options: ["1", "2", "3", "5"], points: 10 },
  { type: "single", q: "What is the capital of Japan?", a: "Tokyo", points: 25 },
  { type: "multiple", q: "Which planet is known for its red color?", a: "Mars", options: ["Mars", "Venus", "Jupiter", "Mercury"], points: 10 }
];

// Offset index for question cycling (per list id), stored in localStorage
let questionCycleOffset = 0;

// Dynamic board order — will be 1..N once configured
let gridOrder = [];

// Team and game state
let teams = []; // [{score:0, isHuman:true|false}, ...]
let currentTeam = null;
let started = false;
let gameOver = false;
let tornadoBoxes = [];
let pickedBoxesCount = 0;
let currentQuestionIndex = 0;

// Derived from selection
let totalTeams = 0;
let humanTeamsCount = 0;
let totalSquares = 9;     // 3p => 12, 4p => 15
let totalTornados = 3;    // 3p => 4, 4p => 5
let gridCols = 3;         // 12->4, 15->5
let gridRows = 3;         // fixed to 3 rows for 12/15

// AI behavior knobs
const AI_CONFIG = {
  clickSquareDelay: 800,
  answerDelay: 800,
  postAnswerDelay: 700,
  correctChance: 0.6,   // probability to click "Correct" on single-answer
  continueChance: 0.7,  // probability to click "Continue" after a correct answer
  speed: 1              // 1x default (higher = faster AI)
};

// ==== DOM ELEMENTS ====
const grid = document.getElementById("grid");
const questionDiv = document.getElementById("question");
const answerDiv = document.getElementById("answer");
const controlsDiv = document.getElementById("controls");
const scoresList = document.getElementById("scores");
const diceResult = document.getElementById("diceResult");
let rollDiceBtn = null; // dynamically created when needed

const bgMusic = document.getElementById("bgMusic");
const correctSfx = document.getElementById("correctSfx");
const incorrectSfx = document.getElementById("incorrectSfx");
const tornadoSfx = document.getElementById("tornadoSfx");
const diceSfx = document.getElementById("diceSfx");
const passSfx = document.getElementById("passSfx");
const victorySfx = document.getElementById("victorySfx");

// Set initial volumes
bgMusic.volume = 1;
correctSfx.volume = 0.5;
incorrectSfx.volume = 0.5;
tornadoSfx.volume = 0.5;
diceSfx.volume = 0.5;
passSfx.volume = 0.5;
victorySfx.volume = 0.2; // lower celebration volume

// Track music mute state
let musicMuted = false;

// ==== UTILS ====
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildGrid() {
  // Compute gridOrder and layout
  gridOrder = Array.from({ length: totalSquares }, (_, i) => i + 1);

  // Layout: 12 => 4x3, 15 => 5x3
  if (totalSquares === 12) { gridCols = 4; gridRows = 3; }
  else if (totalSquares === 15) { gridCols = 5; gridRows = 3; }
  else { gridCols = 3; gridRows = 3; }

  // Apply layout
  grid.style.gridTemplateColumns = `repeat(${gridCols}, 100px)`;
  grid.style.gridTemplateRows = `repeat(${gridRows}, 100px)`;

  // Clear previous grid
  grid.innerHTML = "";

  // Build buttons
  gridOrder.forEach(num => {
    const btn = document.createElement("button");
    btn.textContent = num;
    btn.id = "square" + num;
    btn.onclick = () => pickBox(btn, num);
    btn.disabled = true; // disabled until dice roll
    grid.appendChild(btn);
  });
}

function assignTornadoes() {
  tornadoBoxes = [];
  // Ensure tornado count matches team selection
  const desired = (totalTeams === 4 ? 5 : (totalTeams === 3 ? 4 : 3));
  totalTornados = desired;

  const boxes = [...gridOrder];
  while (tornadoBoxes.length < desired && boxes.length) {
    const idx = Math.floor(Math.random() * boxes.length);
    tornadoBoxes.push(boxes[idx]);
    boxes.splice(idx, 1);
  }
  console.log(`Tornado boxes this game (${desired}):`, tornadoBoxes);
}

function allSquaresPicked() {
  return gridOrder.every(num => {
    const btn = document.getElementById("square" + num);
    if (!btn) return false;
    // Prefer explicit picked flag; fallback to color match in case of older saves/styles
    if (btn.dataset.picked === "1") return true;
    const bg = btn.style.background || btn.style.backgroundColor;
    return bg === "#ccc" || bg === "rgb(204, 204, 204)";
  });
}

function updateScores() {
  scoresList.innerHTML = '';
  teams.forEach((team, idx) => {
    const li = document.createElement('li');
    const aiLabel = team.isHuman ? '' : ' (AI)';
    li.textContent = `Team ${idx + 1}${aiLabel}: ${team.score}`;

    if (started && currentTeam === idx) {
      li.classList.add('active');
    }
    scoresList.appendChild(li);
  });
}

function updateTurnMessage() {
  if (!started) return;
  questionDiv.textContent = `Team ${currentTeam + 1}, choose a square!`;
  answerDiv.textContent = "";
  controlsDiv.textContent = "";
}

function revealTornado(squareId) {
  const squareBtn = document.getElementById(squareId);
  squareBtn.innerHTML = `<img src="images/tornado.png" alt="Tornado!" style="width:100%; height:100%; object-fit:cover;">`;

  const img = squareBtn.querySelector("img");
  img.classList.add("tornado-fade-in");
  setTimeout(() => { img.classList.add("tornado-shake"); }, 500);

  tornadoSfx.currentTime = 0;
  tornadoSfx.play();

  const flashDiv = document.createElement("div");
  flashDiv.classList.add("screen-flash");
  document.body.appendChild(flashDiv);
  setTimeout(() => document.body.removeChild(flashDiv), 200);

  teams[currentTeam].score = 0;
  updateScores();

  setTimeout(() => endTurn(), 800);
}

function setButtonsState({ grid: gridEnabled = false, revealAnswer = false, correctIncorrect = false }) {
  gridOrder.forEach(num => {
    const el = document.getElementById("square" + num);
    if (!el) return;
    if (gridEnabled) {
      // Keep already-picked/revealed squares disabled
      const bg = el.style.background || el.style.backgroundColor || "";
      const picked = el.dataset.picked === "1" || bg === "#ccc" || bg === "rgb(204, 204, 204)";
      el.disabled = picked; // enable only unpicked
    } else {
      el.disabled = true; // disable all when grid is not enabled
    }
  });
  document.querySelectorAll(".answer-btn").forEach(btn => btn.disabled = !revealAnswer);
  document.querySelectorAll(".correct-btn, .incorrect-btn").forEach(btn => btn.disabled = !correctIncorrect);
}

function rollDice() {
  if (rollDiceBtn) rollDiceBtn.disabled = true;

  bgMusic.volume = 0.3;
  bgMusic.play().catch(() => {});
  diceSfx.currentTime = 0;
  diceSfx.play().catch(() => {});

  assignTornadoes();

  // Determine how many questions are needed this game (non-tornado squares)
  const needed = Math.max(1, totalSquares - totalTornados);

  // Apply cycling offset if coming from Editor payload
  if (Array.isArray(questions) && questions.length > 0) {
    const pool = [...questions];
    const cycleKey = window.__TORNADO_CYCLE_KEY__ || 'tornado_default_cycle';
    const saved = Number(localStorage.getItem(cycleKey) || '0') || 0;

    const slice = [];
    for (let i = 0; i < needed; i++) {
      const idx = (saved + i) % pool.length;
      slice.push(pool[idx]);
    }
    questions = slice;

    const next = (saved + needed) % pool.length;
    localStorage.setItem(cycleKey, String(next));
  }

  const rolls = teams.map(() => Math.ceil(Math.random() * 6));
  diceResult.textContent = rolls.map((v, i) => `Team ${i + 1} rolled ${v}`).join('\n');

  const max = Math.max(...rolls);
  const winners = rolls.map((v, i) => v === max ? i : -1).filter(i => i >= 0);
  if (winners.length !== 1) {
    diceResult.textContent += "\n— Tie! Roll again.";
    if (rollDiceBtn) rollDiceBtn.disabled = false;
    return;
  }

  currentTeam = winners[0];
  started = true;
  updateScores();

  try { if (bgMusic && bgMusic.paused) bgMusic.play().catch(() => {}); } catch {}

  gridOrder.forEach(num => {
    const btn = document.getElementById("square" + num);
    if (!btn) return;
    const bg = btn.style.background || btn.style.backgroundColor || "";
    const picked = btn.dataset.picked === "1" || bg === "#ccc" || bg === "rgb(204, 204, 204)";
    btn.disabled = picked ? true : false;
  });

  answerDiv.textContent = "";
  controlsDiv.textContent = "";
  updateTurnMessage();

  triggerAITurnIfNeeded();
}

function pickBox(btn, num) {
  if (!started) return;
  if (!btn || btn.disabled) return;

  btn.disabled = true;
  btn.style.background = "#ccc";
  btn.dataset.picked = "1"; // explicit picked marker for endgame detection
  pickedBoxesCount++;

  if (tornadoBoxes.includes(num)) {
    revealTornado("square" + num);
    return;
  }

  const question = questions[currentQuestionIndex % questions.length];
  
  // Clear the question area (question will be shown in modal)
  questionDiv.textContent = `Team ${currentTeam + 1} is answering a question...`;
  answerDiv.textContent = "";
  controlsDiv.innerHTML = "";

  // Initialize modal system if not already done
  if (window.MultipleChoiceModal) {
    window.MultipleChoiceModal.createModal();
  }

  if (question.type === "multiple") {
    // Multiple choice - always show in modal
    const handleOptionSelect = (selectedOption, index) => {
      // Ensure we're in a valid game state before processing the answer
      if (!started || gameOver) return;
      
      checkMultipleAnswer(selectedOption, question);
    };

    if (window.MultipleChoiceModal) {
      window.MultipleChoiceModal.showModal(
        question.q,
        question.options,
        handleOptionSelect
      );
    } else {
      // Fallback to inline if modal system not available
      questionDiv.textContent = question.q;
      question.options.forEach(option => {
        const optionBtn = document.createElement("button");
        optionBtn.textContent = option;
        optionBtn.classList.add("option-btn");
        optionBtn.onclick = () => checkMultipleAnswer(option, question);
        controlsDiv.appendChild(optionBtn);
      });
    }

    setButtonsState({ grid: false });
  } else {
    // Open answer - always show in modal
    if (window.MultipleChoiceModal) {
      const alts = Array.isArray(question.alts) ? question.alts : [];
      window.MultipleChoiceModal.showOpenAnswerModal(
        question.q,
        question.a,
        alts,
        {
          onCorrect: () => markAnswer(true, question.points),
          onIncorrect: () => markAnswer(false, question.points)
        }
      );
    } else {
      // Fallback to inline if modal system not available
      questionDiv.textContent = question.q;
      const showBtn = document.createElement('button');
      showBtn.className = 'answer-btn';
      showBtn.textContent = 'Show Answer';
      showBtn.onclick = () => showAnswer(question);
      controlsDiv.appendChild(showBtn);
    }
    
    setButtonsState({ grid: false, revealAnswer: true, correctIncorrect: false });
  }

  currentQuestionIndex++;
}

function checkMultipleAnswer(selected, question) {
  controlsDiv.innerHTML = "";

  if (selected === question.a) {
    correctSfx.currentTime = 0;
    correctSfx.play();
    teams[currentTeam].score += question.points;
    updateScores();

    const message = `Correct! The answer is: ${question.a}\n\n+${question.points} points`;
    
    // Check if this is the last question
    if (allSquaresPicked()) {
      // Last question - close modal and end game
      if (window.MultipleChoiceModal) {
        window.MultipleChoiceModal.showAnswerInModal(message, () => {
          checkGameEnd();
        });
      } else {
        answerDiv.textContent = message;
        setTimeout(() => checkGameEnd(), 2000);
      }
    } else {
      // Not the last question - show Continue/Pass buttons in modal
      if (window.MultipleChoiceModal) {
        window.MultipleChoiceModal.showContinuePassModal(message, {
          onContinue: continueTurn,
          onPass: passTurn
        });
      } else {
        // Fallback to inline
        answerDiv.textContent = message;
        controlsDiv.innerHTML = `
          <button class="continue-btn" onclick="continueTurn()">Continue</button>
          <button class="pass-btn" onclick="passTurn()">Pass</button>
        `;
      }
    }
  } else {
    incorrectSfx.currentTime = 0;
    incorrectSfx.play();
    
    const message = `Incorrect. You selected: ${selected}\n\nThe correct answer is: ${question.a}`;
    
    // Show incorrect message in modal and close after delay
    if (window.MultipleChoiceModal) {
      window.MultipleChoiceModal.showAnswerInModal(message, () => {
        if (allSquaresPicked()) {
          checkGameEnd();
        } else {
          endTurn();
        }
      });
    } else {
      // Fallback to inline
      answerDiv.textContent = message;
      setTimeout(() => {
        if (allSquaresPicked()) {
          checkGameEnd();
        } else {
          endTurn();
        }
      }, 2000);
    }
  }
}

function showAnswer(question) {
  const alts = Array.isArray(question.alts) ? question.alts.filter(a => a && a.trim() !== '') : [];
  const suffix = alts.length ? `\n(Also accepted: ${alts.join(', ')})` : '';
  answerDiv.textContent = `Answer: ${question.a}${suffix}`;
  controlsDiv.innerHTML = `
    <button class="correct-btn" onclick="markAnswer(true, ${question.points})">Correct</button>
    <button class="incorrect-btn" onclick="markAnswer(false, ${question.points})">Incorrect</button>
  `;
  setButtonsState({ grid: false, revealAnswer: false, correctIncorrect: true });
}

function markAnswer(correct, points) {
  answerDiv.textContent = "";

  if (correct) {
    correctSfx.currentTime = 0;
    correctSfx.play();
    teams[currentTeam].score += points;
    updateScores();

    const message = `Correct! +${points} points`;
    
    // Check if this is the last question
    if (allSquaresPicked()) {
      // Last question - close modal and end game
      if (window.MultipleChoiceModal) {
        window.MultipleChoiceModal.showAnswerInModal(message, () => {
          checkGameEnd();
        });
      } else {
        answerDiv.textContent = message;
        setTimeout(() => checkGameEnd(), 2000);
      }
    } else {
      // Not the last question - show Continue/Pass buttons in modal
      if (window.MultipleChoiceModal) {
        window.MultipleChoiceModal.showContinuePassModal(message, {
          onContinue: continueTurn,
          onPass: passTurn
        });
      } else {
        // Fallback to inline
        controlsDiv.innerHTML = `
          <button class="continue-btn" onclick="continueTurn()">Continue</button>
          <button class="pass-btn" onclick="passTurn()">Pass</button>
        `;
        setButtonsState({ grid: false, revealAnswer: false, correctIncorrect: false });
        document.querySelectorAll(".continue-btn, .pass-btn").forEach(btn => btn.disabled = false);
      }
    }
  } else {
    incorrectSfx.currentTime = 0;
    incorrectSfx.play().catch(() => {});
    
    // Close modal if it's open, then end turn or end game
    if (window.MultipleChoiceModal) {
      window.MultipleChoiceModal.closeModal();
    }
    
    setTimeout(() => {
      if (allSquaresPicked()) {
        checkGameEnd();
      } else {
        endTurn();
      }
    }, 200);
  }
}

function continueTurn() {
  answerDiv.textContent = "";
  controlsDiv.textContent = "";
  questionDiv.textContent = `Team ${currentTeam + 1}, choose another square!`;
  setButtonsState({ grid: true, revealAnswer: false, correctIncorrect: false });
  triggerAITurnIfNeeded();
}

function passTurn() {
  passSfx.currentTime = 0;
  passSfx.play().catch(() => {});
  endTurn();
}

function endTurn() {
  questionDiv.textContent = "";
  answerDiv.textContent = "";
  controlsDiv.textContent = "";

  currentTeam = (currentTeam + 1) % teams.length;
  updateScores();

  if (allSquaresPicked()) {
    checkGameEnd();
  } else {
    updateTurnMessage();
    // enable only unpicked grid buttons
    gridOrder.forEach(num => {
      const btn = document.getElementById("square" + num);
      if (!btn) return;
      const bg = btn.style.background || btn.style.backgroundColor || "";
      const picked = btn.dataset.picked === "1" || bg === "#ccc" || bg === "rgb(204, 204, 204)";
      btn.disabled = picked ? true : false;
    });
    setButtonsState({ grid: true });
    triggerAITurnIfNeeded();
  }
}

function checkGameEnd() {
  if (gameOver) return;
  if (allSquaresPicked()) {
    gameOver = true;
    started = false;

    // Determine winner
    let topScore = Math.max(...teams.map(t => t.score));
    const winners = teams
      .map((t, i) => (t.score === topScore ? i : -1))
      .filter(i => i >= 0);

    let winnerText = '';
    if (winners.length === 1) winnerText = `Team ${winners[0] + 1} are the winners!`;
    else winnerText = `It's a tie between ${winners.map(i => `Team ${i + 1}`).join(', ')}!`;

    // Clear the questionDiv before showing victory message
    questionDiv.textContent = "";

    const victoryEl = document.createElement('div');
    victoryEl.classList.add('victory-text');
    victoryEl.textContent = `🎉 ${winnerText} 🎉`;

    questionDiv.appendChild(victoryEl);

    // Play celebration audio and confetti
    try {
      // Stop background music to avoid clashing with victory music
      if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        bgMusic.loop = false;
      }
      if (victorySfx && !musicMuted) {
        victorySfx.currentTime = 0;
        victorySfx.play().catch(() => {});
      }
    } catch {}

    triggerVictoryCelebration();

    // Disable grid
    gridOrder.forEach(num => {
      const btn = document.getElementById("square" + num);
      if (btn) btn.disabled = true;
    });

    if (rollDiceBtn) rollDiceBtn.disabled = true;
    updateScores();
  }
}

const confettiParticles = [];
let confettiAnimationId = null;
let confettiHideTimeout = null;
let strobeIntervalId = null;

function triggerVictoryCelebration() {
  const canvas = document.getElementById('confettiCanvas');
  const strobeOverlay = document.getElementById('strobeOverlay');
  if (!canvas || !strobeOverlay) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  resizeConfettiCanvas(canvas);

  canvas.classList.remove('hidden');
  canvas.classList.add('show');
  strobeOverlay.classList.remove('hidden');
  strobeOverlay.classList.add('is-active');
  strobeOverlay.classList.remove('flash');

  // Delay flash toggle so opacity transition plays from baseline
  requestAnimationFrame(() => {
    if (!strobeOverlay) return;
    strobeOverlay.classList.add('flash');
  });

  const colors = ['#ffd54a', '#5cd0ff', '#ff6b6b', '#a5d6a7', '#ffffff'];
  const particlesNeeded = Math.floor((canvas.width * canvas.height) / 9000);

  confettiParticles.length = 0;
  for (let i = 0; i < particlesNeeded; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      radius: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 6,
      speedY: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    });
  }

  const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      if (p.y > canvas.height + 20) p.y = -20;
      if (p.x < -20) p.x = canvas.width + 20;
      if (p.x > canvas.width + 20) p.x = -20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
      ctx.restore();
    });
    confettiAnimationId = requestAnimationFrame(draw);
  };

  cancelAnimationFrame(confettiAnimationId);
  confettiAnimationId = requestAnimationFrame(draw);

  clearInterval(strobeIntervalId);
  strobeIntervalId = setInterval(() => {
    strobeOverlay.classList.toggle('flash');
  }, 400);
}

function stopVictoryEffects() {
  const canvas = document.getElementById('confettiCanvas');
  const strobeOverlay = document.getElementById('strobeOverlay');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
    confettiParticles.length = 0;
    canvas.classList.remove('show');
    clearTimeout(confettiHideTimeout);
    confettiHideTimeout = setTimeout(() => {
      canvas.classList.add('hidden');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }, 400);
  }

  if (strobeOverlay) {
    clearInterval(strobeIntervalId);
    strobeIntervalId = null;
    strobeOverlay.classList.remove('flash');
    strobeOverlay.classList.remove('is-active');
    strobeOverlay.classList.add('hidden');
  }
}

function resizeConfettiCanvas(canvas) {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function toggleMusic() {
  musicMuted = !musicMuted;
  
  if (musicMuted) {
    // Mute both background music and victory music
    bgMusic.pause();
    if (victorySfx) victorySfx.pause();
  } else {
    // Unmute - play appropriate music based on game state
    const victoryShowing = document.querySelector('.victory-text');
    if (victoryShowing) {
      // Game is over - play victory music
      if (victorySfx) {
        victorySfx.play().catch(() => {});
      }
    } else {
      // Game is ongoing - play background music
      bgMusic.play().catch(() => {});
    }
  }
}

function restartGame() {
  stopVictoryEffects();
  location.reload();
}

// ==== AI TURN LOGIC ====
function triggerAITurnIfNeeded() {
  if (!started) return;
  const team = teams[currentTeam];
  if (!team || team.isHuman) return;

  // Step 1: choose an available square
  const sp = Math.max(0.1, Number(AI_CONFIG.speed) || 1);
  const d1 = AI_CONFIG.clickSquareDelay / sp;
  const d2 = AI_CONFIG.answerDelay / sp;
  const d3 = AI_CONFIG.postAnswerDelay / sp;
  setTimeout(() => {
    const available = gridOrder.filter(num => {
      const btn = document.getElementById("square" + num);
      return btn && btn.style.background !== "#ccc" && !btn.disabled;
    });
    if (available.length === 0) return; // nothing to click

    const pick = available[Math.floor(Math.random() * available.length)];
    const btn = document.getElementById("square" + pick);
    if (btn) btn.click();

    // Step 2: after question appears, answer
    setTimeout(() => {
      // Check for modal options first (modal system), then fallback to inline
      let optionButtons = Array.from(document.querySelectorAll('.mc-modal-option:not(.answer-btn):not(.correct-btn):not(.incorrect-btn):not(.continue-btn):not(.pass-btn)'));
      if (optionButtons.length === 0) {
        optionButtons = Array.from(document.querySelectorAll('.option-btn'));
      }
      
      if (optionButtons.length > 0) {
        // Multiple choice: pick random option
        const ob = optionButtons[Math.floor(Math.random() * optionButtons.length)];
        ob.click();

        // After result, check for Continue/Pass buttons (correct answer) or Close button (incorrect answer)
        setTimeout(() => {
          // Check modal first, then inline
          let continueBtn = document.querySelector('.mc-modal-answer .continue-btn');
          let passBtn = document.querySelector('.mc-modal-answer .pass-btn');
          if (!continueBtn) continueBtn = document.querySelector('.continue-btn');
          if (!passBtn) passBtn = document.querySelector('.pass-btn');
          
          if (continueBtn && passBtn) {
            // Correct answer - decide to Continue/Pass
            if (Math.random() < AI_CONFIG.continueChance) continueBtn.click();
            else passBtn.click();
          } else {
            // Incorrect answer - look for Close button
            const closeBtns = Array.from(document.querySelectorAll('.mc-modal-answer .mc-modal-option'));
            const closeBtn = closeBtns.find(btn => btn.textContent.trim() === 'Close');
            if (closeBtn) {
              closeBtn.click();
            }
          }
        }, d3);
      } else {
        // Single-answer: reveal, then mark correct/incorrect
        // Check modal first, then inline
        let revealBtn = document.querySelector('.mc-modal-option.answer-btn');
        if (!revealBtn) revealBtn = document.querySelector('.answer-btn');
        if (revealBtn) revealBtn.click();

        setTimeout(() => {
          const correct = Math.random() < AI_CONFIG.correctChance;
          const btnSel = correct ? '.correct-btn' : '.incorrect-btn';
          
          // Check modal first, then inline
          let markBtn = document.querySelector('.mc-modal-answer ' + btnSel);
          if (!markBtn) markBtn = document.querySelector(btnSel);
          if (markBtn) markBtn.click();

          // After marking correct, decide Continue/Pass
          setTimeout(() => {
            // Check modal first, then inline
            let continueBtn = document.querySelector('.mc-modal-answer .continue-btn');
            let passBtn = document.querySelector('.mc-modal-answer .pass-btn');
            if (!continueBtn) continueBtn = document.querySelector('.continue-btn');
            if (!passBtn) passBtn = document.querySelector('.pass-btn');
            
            if (continueBtn && Math.random() < AI_CONFIG.continueChance) continueBtn.click();
            else if (passBtn) passBtn.click();
          }, d3);
        }, d2);
      }
    }, d2);
  }, d1);
}

// ==== MODALS + INITIALIZATION ====
document.addEventListener("DOMContentLoaded", () => {
  // Create Roll Dice button dynamically only when needed
  function injectRollDiceButton() {
    controlsDiv.textContent = "";
    rollDiceBtn = document.createElement("button");
    rollDiceBtn.id = "rollDiceBtn";
    rollDiceBtn.textContent = "🎲 Roll Dice";
    rollDiceBtn.addEventListener("click", rollDice);
    controlsDiv.appendChild(rollDiceBtn);
  }

  const toggleModal = (el, open) => {
    if (!el) return;
    el.classList.toggle('is-open', !!open);
    el.classList.toggle('hidden', !open);
  };

  // initially do not show roll dice in left panel; inject when game setup completes

  // AI speed slider wiring
  try {
    const speedInput = document.getElementById('aiSpeed');
    const speedLabel = document.getElementById('aiSpeedLabel');
    if (speedInput && speedLabel) {
      const apply = () => {
        const v = Math.max(0.25, Math.min(2, Number(speedInput.value) || 1));
        AI_CONFIG.speed = v;
        speedLabel.textContent = `${v}x`;
      };
      speedInput.addEventListener('input', apply);
      apply();
    }
  } catch {}

  // Clear panels
  updateScores();
  questionDiv.textContent = "Select number of teams to begin";
  answerDiv.textContent = "";
  controlsDiv.textContent = "";

  // Ingest payload from Editor if present in URL hash
  try {
    const hash = decodeURIComponent(location.hash || '');
    const m = hash.match(/#questions=(.*)$/);
    if (m && m[1]) {
      const payload = JSON.parse(m[1]);
      if (payload && Array.isArray(payload.questions)) {
        // Normalize incoming to Tornado's question schema
        const normalized = payload.questions.map(q => {
          if (q.type === 'single') {
            return { type: 'single', q: q.text || '', a: q.answer || '', alts: Array.isArray(q.alternates) ? q.alternates.filter(a => a && a.trim() !== '') : [], points: 25 };
          } else {
            return { type: 'multiple', q: q.text || '', a: (q.options||[])[(q.correct||[])[0]] || '', options: (q.options||[]).slice(0,4), points: 10 };
          }
        });
        questions = normalized;
        // Build a cycle key per list id if available
        if (payload.id) {
          window.__TORNADO_CYCLE_KEY__ = `tornado_cycle_${payload.id}`;
        }
        // Update title to reflect list name
        if (payload.name) {
          const title = document.getElementById('gameTitle');
          if (title) title.textContent = `Tornado — ${payload.name}`;
        }
      }
    }
  } catch {}

  // Rules panel toggle
  const rulesBtn = document.getElementById("rulesBtn");
  const rulesPanel = document.getElementById("rulesPanel");
  const closeRulesBtn = document.getElementById("closeRulesBtn");
  rulesBtn.addEventListener("click", () => rulesPanel.classList.add("is-open"));
  closeRulesBtn.addEventListener("click", () => rulesPanel.classList.remove("is-open"));

  // Modals
  const teamCountModal = document.getElementById('teamCountModal');
  const humanTeamModal = document.getElementById('humanTeamModal');
  const humanTeamOptions = document.getElementById('humanTeamOptions');
  const humanBack = document.getElementById('humanBack');
  const humanStart = document.getElementById('humanStart');

  // Show first modal (centered overlay)
  toggleModal(teamCountModal, true);
  toggleModal(humanTeamModal, false);
  // Reset per-game counters
  pickedBoxesCount = 0;

  // Handle 2/3/4 buttons
  document.querySelectorAll('.team-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      totalTeams = parseInt(btn.getAttribute('data-teams'), 10);

      // Map team count to board size and tornados
      if (totalTeams === 2) { totalSquares = 9; totalTornados = 3; }
      else if (totalTeams === 3) { totalSquares = 12; totalTornados = 4; }
      else if (totalTeams === 4) { totalSquares = 15; totalTornados = 5; }

      // Build human team options (1..totalTeams)
      humanTeamOptions.innerHTML = '';
      for (let i = 1; i <= totalTeams; i++) {
        const id = `humanTeams_${i}`;
        const label = document.createElement('label');
        label.innerHTML = `<input type=\"radio\" name=\"humanTeams\" id=\"${id}\" value=\"${i}\"> ${i} human${i>1? ' teams' : ' team'}`;
        humanTeamOptions.appendChild(label);
      }

      humanStart.disabled = true;

      toggleModal(teamCountModal, false);
      toggleModal(humanTeamModal, true);

      document.querySelectorAll('input[name="humanTeams"]').forEach(r => {
        r.addEventListener('change', () => {
          humanStart.disabled = false;
        });
      });
    });
  });

  humanBack.addEventListener('click', () => {
    toggleModal(humanTeamModal, false);
    toggleModal(teamCountModal, true);
  });

  humanStart.addEventListener('click', () => {
    const selected = document.querySelector('input[name="humanTeams"]:checked');
    if (!selected) return;
    humanTeamsCount = parseInt(selected.value, 10);
    if (humanTeamsCount > totalTeams) humanTeamsCount = totalTeams; // safety

    // Initialize teams: first N are human
    teams = Array.from({ length: totalTeams }, (_, i) => ({ score: 0, isHuman: i < humanTeamsCount }));

    // Build grid and update UI
    buildGrid();
    updateScores();

    questionDiv.textContent = "🎲 Roll the dice to begin the game!";
    answerDiv.textContent = "";
    controlsDiv.textContent = "";

    // Show Roll Dice button in controls and enable it
    injectRollDiceButton();
    if (rollDiceBtn) rollDiceBtn.disabled = false;

    // Close modal
    toggleModal(humanTeamModal, false);
  });
});

// Ensure key elements visible (fallback for font loading)
['grid', 'question', 'answer', 'scores', 'controls', 'diceResult'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.style.opacity = 1;
    el.style.visibility = 'visible';
  }
});