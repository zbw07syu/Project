// Reconstructing Icebreak game logic with victory celebration enhancements.
(function(){
  // DOM references
  const gridEl = document.getElementById('grid');
  const revealedEl = document.getElementById('revealed');
  const questionImageEl = document.getElementById('questionImage');
  const inputArea = document.getElementById('inputArea');
  const guessInput = document.getElementById('guessInput');
  const submitGuess = document.getElementById('submitGuess');
  const feedbackEl = document.getElementById('feedback');
  const feedbackText = document.getElementById('feedbackText');
  const scoresEl = document.getElementById('scores');
  const controlsDiv = document.getElementById('feedback');

  function setFeedbackMessage(message = '') {
    const shouldHide = diceRollButton && controlsDiv && controlsDiv.contains(diceRollButton);
    const finalMessage = shouldHide ? '' : message;
    if (feedbackText) {
      feedbackText.textContent = finalMessage;
    } else if (feedbackEl) {
      feedbackEl.textContent = finalMessage;
    }
  }

  function clearFeedbackMessage() {
    setFeedbackMessage('');
  }

  const bgMusic = document.getElementById('bgMusic');
  const correctSfx = document.getElementById('correctSfx');
  const incorrectSfx = document.getElementById('incorrectSfx');
  const winSfx = document.getElementById('winSfx');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d', { alpha: true }) : null;
  const strobeOverlay = document.getElementById('strobeOverlay');

  const volumeSlider = document.getElementById('volumeSlider');
  const restartBtn = document.getElementById('restartBtn');
  const rulesBtn = document.getElementById('rulesBtn');

  const gridSizeModal = document.getElementById('gridSizeModal');
  const teamCountModal = document.getElementById('teamCountModal');
  const humanCountModal = document.getElementById('humanCountModal');
  const humanButtons = document.getElementById('humanButtons');
  const humanBack = document.getElementById('humanBack');
  const startGameBtn = document.getElementById('startGame');
  const rulesPanel = document.getElementById('rulesPanel');
  const closeRules = document.getElementById('closeRules');

  // State
  let payload = null; // { id, name, questions: [{ type:'single', text, answer, alternates }] }
  let gridSize = 16;  // 8 | 12 | 16
  let teams = [];     // [{ name, score, isHuman, roll: number|null, displayOrder?: number }]
  let currentTeamIdx = 0;
  let squares = [];   // [{ prompt, accepted:[], points, revealed:false, claimedBy:null }]
  let turnOrderFinalized = false;
  let diceRollButton = null;
  let selectedSquareIdx = null; // index of current selected square pending answer
  let advancedAfterAnswer = false; // track if nextTeam was called for current answer cycle
  let aiGuessHandle = null; // timeout id for pending AI guesses
  let aiTypingHandle = null; // timeout id for AI typing simulation
  let victoryTriggered = false;
  let victoryScore = null;
  let consecutiveCorrectCount = 0;
  let lastCorrectTeamIdx = null;
  let aiIsActing = false; // flag to indicate AI is currently taking a turn

  const confettiParticles = [];
  let confettiAnimationId = null;
  let confettiHideTimeout = null;
  const confettiColors = ['#ffd54a', '#5cd0ff', '#ff6b6b', '#a5d6a7', '#ffffff'];
  let strobeIntervalId = null;

  // Helpers
  const show = (el, v=true) => el.classList.toggle('show', !!v);
  const hide = (el) => el.classList.remove('show');

  function resizeConfettiCanvas() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  const normalizeText = (s) => {
    return (s || '')
      .toLowerCase()
      .normalize('NFD') // split diacritics
      .replace(/\p{Diacritic}+/gu, '')
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  function clearAiTimers({ clearInput = false } = {}) {
    if (aiGuessHandle) {
      clearTimeout(aiGuessHandle);
      aiGuessHandle = null;
    }
    if (aiTypingHandle) {
      clearTimeout(aiTypingHandle);
      aiTypingHandle = null;
    }
    if (clearInput) {
      guessInput.value = '';
    }
    aiIsActing = false;
    updateCursorForAI();
  }

  function updateCursorForAI() {
    if (aiIsActing) {
      document.body.style.cursor = 'wait';
      if (gridEl) gridEl.style.pointerEvents = 'none';
      if (guessInput) guessInput.disabled = true;
      if (submitGuess) submitGuess.disabled = true;
    } else {
      document.body.style.cursor = '';
      if (gridEl) gridEl.style.pointerEvents = '';
      const team = currentTeam();
      if (guessInput && selectedSquareIdx != null && team && team.isHuman) {
        guessInput.disabled = false;
      }
      if (submitGuess && selectedSquareIdx != null && team && team.isHuman) {
        submitGuess.disabled = false;
      }
    }
  }

  function parsePayloadFromHash() {
    try {
      const hash = location.hash || '';
      const m = hash.match(/#questions=(.*)$/);
      if (m && m[1]) {
        const decoded = decodeURIComponent(m[1]);
        const obj = JSON.parse(decoded);
        if (obj && Array.isArray(obj.questions)) {
          payload = {
            id: obj.id || null,
            name: obj.name || 'Untitled',
            listType: obj.listType || 'regular',
            questions: obj.questions
              .filter(q => q && (q.type === 'single' || q.type === 'icebreak'))
              .map(q => {
                if (q.type === 'icebreak') {
                  return {
                    type: 'icebreak',
                    prompt: q.prompt || '',
                    accepted: Array.isArray(q.accepted) ? q.accepted.filter(a => a && a.trim() !== '') : [],
                    image: q.image || null
                  };
                }
                return {
                  type: 'single',
                  text: q.text || '',
                  answer: q.answer || '',
                  alternates: Array.isArray(q.alternates) ? q.alternates.filter(a => a && a.trim() !== '') : [],
                  image: q.image || null
                };
              })
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse payload:', e);
    }
  }

  // Scoring distributions
  const scoreDist = {
    16: [50,50,50, 25,25,25,25,25, 10,10,10,10,10,10,10,10],
    12: [50,50, 25,25,25,25, 10,10,10,10,10,10],
     8: [50, 25,25,25, 10,10,10,10]
  };

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildSquares() {
    const needed = gridSize;
    const src = (payload?.questions || []).slice(0, needed);
    const baseSquares = src.map(q => ({
      prompt: q.text || '(no prompt)',
      accepted: [q.answer, ...(q.alternates||[])].filter(Boolean),
      points: 10,
      revealed: false,
      claimedBy: null,
    }));

    while (baseSquares.length < needed) {
      baseSquares.push({ prompt: 'Bonus', accepted: ['bonus'], points: 10, revealed: false, claimedBy: null });
    }

    const dist = scoreDist[gridSize].slice();
    shuffle(dist);
    baseSquares.forEach((sq, i) => { sq.points = dist[i] || 10; });

    squares = baseSquares;
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    const cols = 4;
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    squares.forEach((sq, i) => {
      const div = document.createElement('div');
      div.className = 'square' + (sq.revealed ? ' revealed' : '');
      div.textContent = sq.revealed ? `${sq.prompt}\n(+${sq.points})` : `${i+1}`;
      div.addEventListener('click', () => onSquareClick(i));
      div.dataset.index = i;
      gridEl.appendChild(div);
    });
  }

  function onSquareClick(idx) {
    if (!turnOrderFinalized) {
      setFeedbackMessage('Roll to decide the turn order first!');
      return;
    }
    if (victoryTriggered) return;
    
    // Prevent human interference during AI turns
    const team = currentTeam();
    if (aiIsActing || (team && !team.isHuman)) {
      return;
    }
    
    const sq = squares[idx];
    if (!sq || sq.revealed) return;

    clearAiTimers({ clearInput: true });

    if (advancedAfterAnswer) {
      advancedAfterAnswer = false;
    }

    selectedSquareIdx = idx;
    revealedEl.textContent = sq.prompt;
    
    // Handle image display
    if (questionImageEl) {
      if (sq.image) {
        questionImageEl.innerHTML = `<img src="${sq.image}" alt="Question image" onerror="this.parentElement.classList.remove('show')">`;
        questionImageEl.classList.add('show');
      } else {
        questionImageEl.innerHTML = '';
        questionImageEl.classList.remove('show');
      }
    }
    
    feedbackEl.textContent = '';
    guessInput.value = '';
    guessInput.disabled = false;
    submitGuess.disabled = false;
    guessInput.focus();
  }

  function currentTeam() { return teams[currentTeamIdx] || null; }

  function updateScores() {
    scoresEl.innerHTML = '';
    teams.forEach((t, i) => {
      const li = document.createElement('li');
      const displayName = t.isHuman ? t.name : `${t.name} [AI]`;
      li.textContent = `${displayName}: ${t.score}`;
      if (i === currentTeamIdx && turnOrderFinalized) li.classList.add('current');
      scoresEl.appendChild(li);
    });
    highlightWinningTeam();
  }

  function setupDiceRollButton() {
    if (!controlsDiv) return;
    if (!diceRollButton) {
      diceRollButton = document.createElement('button');
      diceRollButton.type = 'button';
      diceRollButton.className = 'diceRollBtn';
      diceRollButton.textContent = 'Roll Dice';
      diceRollButton.addEventListener('click', handleDiceRollClick);
    } else {
      diceRollButton.textContent = 'Roll Dice';
    }
    diceRollButton.disabled = false;
    if (!controlsDiv.contains(diceRollButton)) {
      controlsDiv.appendChild(diceRollButton);
    }
  }

  function handleDiceRollClick() {
    if (turnOrderFinalized || !teams.length) return;
    if (diceRollButton) diceRollButton.disabled = true;

    let rolls = [];
    do {
      rolls = Array.from({ length: teams.length }, () => 1 + Math.floor(Math.random() * 6));
    } while (hasDuplicateRolls(rolls));

    teams.forEach((team, idx) => {
      team.roll = rolls[idx];
    });

    finalizeTurnOrderAfterRolls();
  }

  function hasDuplicateRolls(values) {
    return new Set(values).size !== values.length;
  }

  function finalizeTurnOrderAfterRolls() {
    clearFeedbackMessage();
    const ordered = teams
      .map((team) => team)
      .sort((a, b) => (b.roll ?? 0) - (a.roll ?? 0));

    ordered.forEach((team, orderIdx) => {
      team.displayOrder = orderIdx + 1;
    });

    turnOrderFinalized = true;
    const firstTeam = ordered[0] || null;
    currentTeamIdx = firstTeam ? teams.indexOf(firstTeam) : 0;

    updateScores();

    if (diceRollButton && diceRollButton.parentNode) {
      diceRollButton.parentNode.removeChild(diceRollButton);
    }

    setFeedbackMessage(`${currentTeam().name} goes first.`);
    promptTeamToSelect();
  }

  function promptTeamToSelect() {
    if (!turnOrderFinalized) return;
    if (!teams.length) return;
    if (victoryTriggered) return;
    if (currentTeamIdx == null || currentTeamIdx < 0 || currentTeamIdx >= teams.length) return;
    if (selectedSquareIdx != null) return;
    if (allClaimed()) return;
    revealedEl.textContent = `${currentTeam().name}, select a square to reveal the prompt.`;
    updateCursorForAI();
  }

  function nextTeam() {
    if (!turnOrderFinalized) return;
    currentTeamIdx = (currentTeamIdx + 1) % teams.length;
    updateScores();
    promptTeamToSelect();
    clearAiTimers({ clearInput: false });
    updateCursorForAI();
  }

  function allClaimed() { return squares.every(s => s.revealed); }

  function highlightWinningTeam() {
    if (!scoresEl) return;
    const items = Array.from(scoresEl.children);
    items.forEach((li, idx) => {
      li.classList.toggle('current', turnOrderFinalized && idx === currentTeamIdx);
      li.classList.remove('winner');
    });
    if (victoryScore == null) return;
    const winningTeams = teams.filter(t => t.score === victoryScore);
    winningTeams.forEach(team => {
      const idx = teams.indexOf(team);
      if (idx >= 0 && items[idx]) {
        items[idx].classList.add('winner');
      }
    });
  }

  function endIfDone() {
    if (victoryTriggered) return;
    if (allClaimed()) {
      triggerVictory();
    }
  }

  function checkGuess(forcedGuess, allowEmptyForForced = false) {
    if (!turnOrderFinalized) {
      feedbackEl.textContent = 'Roll the dice to decide the turn order!';
      return;
    }
    if (victoryTriggered) return;
    if (selectedSquareIdx == null) {
      feedbackEl.textContent = 'Pick a square first, then submit your answer.';
      promptTeamToSelect();
      return;
    }
    const sq = squares[selectedSquareIdx];
    if (!sq || sq.revealed) {
      promptTeamToSelect();
      return;
    }

    const usingForcedGuess = typeof forcedGuess === 'string';
    const rawGuess = usingForcedGuess ? forcedGuess : guessInput.value;
    const typed = normalizeText(rawGuess);
    if (!usingForcedGuess && !rawGuess.trim()) {
      feedbackEl.textContent = 'Please enter an answer before submitting.';
      guessInput.focus();
      return;
    }
    if (usingForcedGuess && !allowEmptyForForced && !typed) {
      feedbackEl.textContent = `${currentTeam().name} appears to be thinking...`;
      return;
    }

    const accepted = sq.accepted.map(normalizeText);

    if (typed && accepted.includes(typed)) {
      sq.revealed = true;
      sq.claimedBy = currentTeamIdx;
      correctSfx.currentTime = 0;
      correctSfx.play();
      currentTeam().score += sq.points;
      updateScores();
      feedbackEl.textContent = `Correct! +${sq.points} points.`;
      renderGrid();
      guessInput.value = '';
      selectedSquareIdx = null;
      advancedAfterAnswer = false;

      if (lastCorrectTeamIdx === currentTeamIdx) {
        consecutiveCorrectCount += 1;
      } else {
        consecutiveCorrectCount = 1;
        lastCorrectTeamIdx = currentTeamIdx;
      }

      if (consecutiveCorrectCount >= 3) {
        nextTeam();
        consecutiveCorrectCount = 0;
        lastCorrectTeamIdx = null;
      } else {
        promptTeamToSelect();
      }

      endIfDone();
    } else {
      incorrectSfx.currentTime = 0;
      incorrectSfx.play();
      feedbackEl.textContent = `Incorrect.`;
      clearAiTimers({ clearInput: true });
      selectedSquareIdx = null;
      consecutiveCorrectCount = 0;
      lastCorrectTeamIdx = null;
      nextTeam();
      advancedAfterAnswer = true;
    }
  }

  function autoAIGuessIfNeeded() {
    if (victoryTriggered) return;
    const team = currentTeam();
    if (!team || team.isHuman) {
      // If it's a human's turn, ensure AI mode is off
      if (aiIsActing) {
        aiIsActing = false;
        updateCursorForAI();
      }
      return;
    }
    if (advancedAfterAnswer) {
      advancedAfterAnswer = false;
    }
    if (aiTypingHandle || aiGuessHandle) {
      return;
    }
    if (selectedSquareIdx != null) {
      return;
    }
    const availableIndices = squares.reduce((acc, sq, idx) => {
      if (!sq.revealed) acc.push(idx);
      return acc;
    }, []);
    if (!availableIndices.length) return;
    
    // Set AI acting flag and update cursor
    aiIsActing = true;
    updateCursorForAI();
    
    const remainingIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    
    // Directly select the square for AI (bypass onSquareClick checks)
    selectedSquareIdx = remainingIdx;
    const sq = squares[remainingIdx];
    revealedEl.textContent = sq.prompt;
    
    // Handle image display for AI
    if (questionImageEl) {
      if (sq.image) {
        questionImageEl.innerHTML = `<img src="${sq.image}" alt="Question image" onerror="this.parentElement.classList.remove('show')">`;
        questionImageEl.classList.add('show');
      } else {
        questionImageEl.innerHTML = '';
        questionImageEl.classList.remove('show');
      }
    }
    
    feedbackEl.textContent = '';
    guessInput.value = '';

    const targetSquare = squares[remainingIdx];
    const acceptedAnswers = (targetSquare?.accepted || []).filter(ans => typeof ans === 'string' && ans.trim() !== '');
    const normalizedAccepted = acceptedAnswers.map(normalizeText);

    const remainingSquares = squares.filter(s => !s.revealed);
    const wrongCandidates = remainingSquares
      .map(s => s.prompt)
      .concat(targetSquare?.prompt ? [targetSquare.prompt] : [])
      .concat([`Guess ${remainingIdx + 1}`, 'No idea', 'Pass', 'We have no clue']);

    let guess = '';
    const shouldAnswerCorrectly = acceptedAnswers.length > 0 && Math.random() < 0.5;
    if (shouldAnswerCorrectly) {
      guess = acceptedAnswers[Math.floor(Math.random() * acceptedAnswers.length)];
    } else {
      guess = wrongCandidates.find(candidate => candidate && !normalizedAccepted.includes(normalizeText(candidate))) || 'Incorrect guess';
    }

    aiTypingHandle = setTimeout(() => {
      guessInput.value = guess;
      aiTypingHandle = null;
      aiGuessHandle = setTimeout(() => {
        aiGuessHandle = null;
        checkGuess(undefined, true);
        // Clear AI acting flag after guess is processed
        aiIsActing = false;
        updateCursorForAI();
      }, 350);
    }, 250);
  }

  function tryStartBG() {
    bgMusic.volume = volumeSlider.value / 100;
    bgMusic.play().catch(()=>{});
  }





  function startStrobe() {
    if (!strobeOverlay) return;
    strobeOverlay.classList.remove('hidden');
    strobeOverlay.classList.remove('flash');
    clearInterval(strobeIntervalId);
    strobeIntervalId = setInterval(() => {
      strobeOverlay.classList.toggle('flash');
    }, 400);
  }

  function stopStrobe() {
    if (!strobeOverlay) return;
    clearInterval(strobeIntervalId);
    strobeIntervalId = null;
    strobeOverlay.classList.remove('flash');
    strobeOverlay.classList.add('hidden');
  }

  function triggerVictory() {
    victoryTriggered = true;
    clearAiTimers({ clearInput: true });
    guessInput.disabled = true;
    submitGuess.disabled = true;
    
    // Reset cursor to normal
    aiIsActing = false;
    document.body.style.cursor = '';
    if (gridEl) gridEl.style.pointerEvents = '';

    const sorted = teams.slice().sort((a,b) => b.score - a.score);
    victoryScore = sorted[0]?.score ?? 0;
    const winners = sorted.filter(t => t.score === victoryScore);

    // Team colors for Icebreak game (matching team order)
    const teamColors = ['#5CD0FF', '#FF6B6B', '#FFD54A', '#A5D6A7']; // Blue, Red, Yellow, Green
    
    // Determine winner text and color
    let winnerText, winnerColor;
    if (winners.length === 1) {
      // Single winner
      const winnerIndex = teams.findIndex(t => t.name === winners[0].name);
      winnerText = `Team ${winnerIndex + 1} are the winners!`;
      winnerColor = (winnerIndex >= 0 && winnerIndex < teamColors.length) ? teamColors[winnerIndex] : '#FFD700';
    } else {
      // Tie
      winnerText = "It's a tie!";
      winnerColor = '#FFD700'; // Gold for ties
    }

    // Clear feedback text (no more plain text victory message)
    feedbackEl.textContent = '';

    highlightWinningTeam();
    
    // Stop background music before victory celebration
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    
    // Use Victory Manager for enhanced celebration
    console.log('🎉 Victory triggered! VictoryManager available:', typeof VictoryManager !== 'undefined');
    console.log('🎉 Winner text:', winnerText);
    console.log('🎉 Winner color:', winnerColor);
    
    if (typeof VictoryManager !== 'undefined') {
      console.log('🎉 Calling VictoryManager.playVictorySequence...');
      VictoryManager.playVictorySequence({
        getMuteState: () => bgMusic.muted,
        winnerText: winnerText,
        winnerColor: winnerColor
      });
    } else {
      console.log('⚠️ VictoryManager not loaded, using fallback');
      // Fallback to old celebration if Victory Manager not loaded
      launchConfetti();
      startStrobe();
      playWinMusic();
    }
  }

  function playWinMusic() {
    // Stop background music before playing celebration music
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    if (!winSfx) return;
    winSfx.currentTime = 0;
    winSfx.play().catch(()=>{});
  }

  function launchConfetti() {
    if (!confettiCanvas || !confettiCtx) return;
    resizeConfettiCanvas();
    confettiCanvas.classList.add('show');
    confettiCanvas.classList.remove('hidden');

    const particleCount = Math.floor((confettiCanvas.width * confettiCanvas.height) / 9000);
    confettiParticles.length = 0;

    for (let i = 0; i < particleCount; i++) {
      confettiParticles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        radius: 4 + Math.random() * 4,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        speedX: (Math.random() - 0.5) * 6,
        speedY: 2 + Math.random() * 4,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = requestAnimationFrame(drawConfetti);
  }

  function drawConfetti() {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParticles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      if (p.y > confettiCanvas.height + 20) p.y = -20;
      if (p.x < -20) p.x = confettiCanvas.width + 20;
      if (p.x > confettiCanvas.width + 20) p.x = -20;

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rotation);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
      confettiCtx.restore();
    });
    confettiAnimationId = requestAnimationFrame(drawConfetti);
  }

  function stopConfetti() {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
    confettiParticles.length = 0;
    if (!confettiCanvas) return;
    confettiCanvas.classList.remove('show');
    clearTimeout(confettiHideTimeout);
    confettiHideTimeout = setTimeout(() => {
      confettiCanvas.classList.add('hidden');
      if (confettiCtx) confettiCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    }, 400);
  }

  // Event wiring
  submitGuess.addEventListener('click', () => checkGuess());
  guessInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkGuess();
  });

  // Volume slider handler
  volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    bgMusic.volume = volume;
    winSfx.volume = volume;
    
    // Notify Victory Manager of volume change
    if (window.VictoryManager) {
      window.VictoryManager.setMusicVolume(volume);
    }
  });

  restartBtn.addEventListener('click', () => {
    // Stop Victory Manager effects
    if (typeof VictoryManager !== 'undefined') {
      VictoryManager.stopVictorySequence();
    }
    stopConfetti();
    stopStrobe();
    location.reload();
  });

  rulesBtn.addEventListener('click', () => show(rulesPanel, true));
  closeRules.addEventListener('click', () => hide(rulesPanel));

  window.addEventListener('resize', resizeConfettiCanvas);

  // Setup flow
  document.querySelectorAll('.gridSizeBtn').forEach(btn => btn.addEventListener('click', () => {
    gridSize = Number(btn.dataset.size) || 16;
    hide(gridSizeModal);
    show(teamCountModal, true);
  }));

  document.querySelectorAll('.teamCountBtn').forEach(btn => btn.addEventListener('click', () => {
    const count = Number(btn.dataset.teams) || 2;
    hide(teamCountModal);
    humanButtons.innerHTML = '';
    for (let i=1;i<=count;i++) {
      const b = document.createElement('button');
      b.className = 'vpBtn'; b.textContent = `${i} human`;
      b.addEventListener('click', () => {
        startGameBtn.dataset.total = String(count);
        startGameBtn.dataset.humans = String(i);
        startGameBtn.disabled = false;
      });
      humanButtons.appendChild(b);
    }
    show(humanCountModal, true);
  }));

  humanBack.addEventListener('click', () => {
    hide(humanCountModal);
    show(teamCountModal, true);
  });

  startGameBtn.addEventListener('click', () => {
    const total = Number(startGameBtn.dataset.total || '2');
    const humans = Number(startGameBtn.dataset.humans || '2');
    hide(humanCountModal);

    teams = Array.from({ length: total }, (_, i) => ({ name: `Team ${i+1}`, score: 0, isHuman: i < humans, roll: null }));
    currentTeamIdx = null;
    advancedAfterAnswer = false;
    victoryTriggered = false;
    victoryScore = null;
    turnOrderFinalized = false;

    selectedSquareIdx = null;

    buildSquares();
    renderGrid();

    guessInput.disabled = true;
    submitGuess.disabled = true;
    revealedEl.textContent = 'Time to roll!';
    feedbackEl.textContent = 'Roll to decide the turn order!';

    setupDiceRollButton();
    updateScores();

    tryStartBG();
    resizeConfettiCanvas();
  });

  // Init
  parsePayloadFromHash();
  show(gridSizeModal, true);

  const aiTick = () => {
    autoAIGuessIfNeeded();
    requestAnimationFrame(aiTick);
  };
  aiTick();
})();