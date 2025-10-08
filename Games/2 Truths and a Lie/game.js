// 2 Truths and a Lie Game Logic
(function() {
  'use strict';

  // DOM references
  const sentenceA = document.getElementById('sentenceA');
  const sentenceB = document.getElementById('sentenceB');
  const sentenceC = document.getElementById('sentenceC');
  const guessA = document.getElementById('guessA');
  const guessB = document.getElementById('guessB');
  const guessC = document.getElementById('guessC');
  const instructionDiv = document.getElementById('instructionDiv');
  const answerDiv = document.getElementById('answerDiv');
  const controlsDiv = document.getElementById('controlsDiv');
  const scoresEl = document.getElementById('scores');
  const turnsLeftEl = document.getElementById('turnsLeft');

  const bgMusic = document.getElementById('bgMusic');
  const muteBtn = document.getElementById('muteBtn');
  const restartBtn = document.getElementById('restartBtn');
  const endGameBtn = document.getElementById('endGameBtn');
  const rulesBtn = document.getElementById('rulesBtn');

  const teamCountModal = document.getElementById('teamCountModal');
  const turnCountModal = document.getElementById('turnCountModal');
  const turnCountInput = document.getElementById('turnCountInput');
  const turnCountSubmit = document.getElementById('turnCountSubmit');
  const answerModal = document.getElementById('answerModal');
  const rulesPanel = document.getElementById('rulesPanel');
  const closeRules = document.getElementById('closeRules');

  // Game state
  let numTeams = 0;
  let totalTurns = 0;
  let turnsRemaining = 0;
  let teams = []; // [{ name: 'Team 1', score: 0 }, ...]
  let currentRound = 0; // 0 = teacher example, 1+ = team rounds
  let currentTeamIndex = 0; // which team's turn it is
  let gamePhase = 'setup'; // setup, writing, guessing, revealing, nextRound, gameOver
  let isMuted = false;
  let victoryTriggered = false;

  // Initialize
  function init() {
    setupEventListeners();
    showModal(teamCountModal);
  }

  function setupEventListeners() {
    // Team count selection
    document.querySelectorAll('.teamCountBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        numTeams = parseInt(btn.dataset.teams);
        hideModal(teamCountModal);
        showModal(turnCountModal);
        tryPlayMusic(); // Start music on first user interaction
      });
    });

    // Turn count submission
    turnCountSubmit.addEventListener('click', () => {
      const turns = parseInt(turnCountInput.value);
      if (!turns || turns < 1) {
        alert('Please enter a valid number of turns (at least 1)');
        return;
      }
      totalTurns = turns;
      turnsRemaining = totalTurns;
      hideModal(turnCountModal);
      startGame();
    });

    // Allow Enter key to submit turn count
    turnCountInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        turnCountSubmit.click();
      }
    });

    // Answer selection
    document.querySelectorAll('.answerBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const answer = btn.dataset.answer;
        revealAnswer(answer);
        hideModal(answerModal);
      });
    });

    // Control buttons
    muteBtn.addEventListener('click', toggleMute);
    restartBtn.addEventListener('click', restartGame);
    endGameBtn.addEventListener('click', forceEndGame);
    rulesBtn.addEventListener('click', () => showModal(rulesPanel));
    closeRules.addEventListener('click', () => hideModal(rulesPanel));
  }

  function startGame() {
    // Initialize teams
    teams = [{ name: 'Teacher', score: 0 }];
    for (let i = 1; i <= numTeams; i++) {
      teams.push({ name: `Team ${i}`, score: 0 });
    }

    updateScoreboard();
    updateTurnCounter();
    startTeacherRound();
  }

  function startTeacherRound() {
    currentRound = 0;
    gamePhase = 'writing';
    currentTeamIndex = 0; // Teacher

    clearSentences();
    enableSentenceInputs();
    disableGuessInputs();

    instructionDiv.textContent = 'Teacher, write 3 sentences (2 true, 1 false)';
    answerDiv.textContent = '';
    
    // Create submit button
    controlsDiv.innerHTML = '';
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click', onSubmitSentences);
    controlsDiv.appendChild(submitBtn);

    updateScoreboard();
  }

  function onSubmitSentences() {
    // Check if all sentences are filled
    if (!sentenceA.value.trim() || !sentenceB.value.trim() || !sentenceC.value.trim()) {
      alert('Please fill in all three sentences!');
      return;
    }

    gamePhase = 'guessing';
    disableSentenceInputs();
    enableGuessInputs();

    if (currentRound === 0) {
      // Teacher example round - teams guess
      instructionDiv.textContent = 'Teams decide: which sentence is false?';
      answerDiv.textContent = 'Teams can ask questions. Teacher: enter team numbers in the guess boxes below each sentence.';
    } else {
      // Team round - other teams and teacher guess
      const currentTeam = teams[currentTeamIndex];
      instructionDiv.textContent = `Other teams and teacher: which sentence is false?`;
      answerDiv.textContent = `Enter team numbers (or "t" for teacher) in the guess boxes.`;
    }

    // Create submit guesses button
    controlsDiv.innerHTML = '';
    const submitGuessesBtn = document.createElement('button');
    submitGuessesBtn.textContent = 'Submit Guesses';
    submitGuessesBtn.addEventListener('click', onSubmitGuesses);
    controlsDiv.appendChild(submitGuessesBtn);
  }

  function onSubmitGuesses() {
    // Check if at least one guess is entered
    if (!guessA.value.trim() && !guessB.value.trim() && !guessC.value.trim()) {
      alert('Please enter at least one guess!');
      return;
    }

    gamePhase = 'revealing';
    disableGuessInputs();

    instructionDiv.textContent = 'Teacher: select which sentence is false';
    answerDiv.textContent = '';
    controlsDiv.innerHTML = '';

    // Show answer modal
    showModal(answerModal);
  }

  function revealAnswer(falseSentence) {
    gamePhase = 'revealed';

    // Parse guesses and award points
    const guesses = {
      A: parseGuesses(guessA.value),
      B: parseGuesses(guessB.value),
      C: parseGuesses(guessC.value)
    };

    const correctGuessers = guesses[falseSentence];
    
    // Award points
    const winners = [];
    correctGuessers.forEach(guesser => {
      if (guesser === 't' || guesser === 'T') {
        teams[0].score++; // Teacher
        winners.push('Teacher');
      } else {
        const teamNum = parseInt(guesser);
        if (teamNum >= 1 && teamNum <= numTeams) {
          teams[teamNum].score++; // Team index is teamNum (since Teacher is at index 0)
          winners.push(`Team ${teamNum}`);
        }
      }
    });

    // Update display
    instructionDiv.textContent = `${falseSentence} was the false sentence!`;
    
    if (winners.length > 0) {
      answerDiv.textContent = `${winners.join(', ')} got a point!`;
    } else {
      answerDiv.textContent = 'No one guessed correctly!';
    }

    updateScoreboard();

    // Create next round button
    controlsDiv.innerHTML = '';
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next Round';
    nextBtn.addEventListener('click', nextRound);
    controlsDiv.appendChild(nextBtn);
  }

  function parseGuesses(guessString) {
    // Parse comma-separated guesses (e.g., "1,2,t" or "1, 2, T")
    if (!guessString.trim()) return [];
    
    return guessString
      .split(',')
      .map(g => g.trim().toLowerCase())
      .filter(g => g);
  }

  function nextRound() {
    if (currentRound === 0) {
      // After teacher example, start team rounds
      currentRound = 1;
      currentTeamIndex = 1; // Start with Team 1
      startTeamRound();
    } else {
      // Move to next team
      turnsRemaining--;
      updateTurnCounter();

      if (turnsRemaining <= 0) {
        endGame();
        return;
      }

      currentTeamIndex++;
      if (currentTeamIndex > numTeams) {
        currentTeamIndex = 1; // Wrap back to Team 1
      }
      currentRound++;
      startTeamRound();
    }
  }

  function startTeamRound() {
    gamePhase = 'writing';

    clearSentences();
    enableSentenceInputs();
    disableGuessInputs();

    const currentTeam = teams[currentTeamIndex];
    instructionDiv.textContent = `Someone from ${currentTeam.name}: tell the teacher 3 sentences (2 true, 1 false)`;
    answerDiv.textContent = 'Teacher: write the sentences in boxes A, B, and C';

    // Create submit button
    controlsDiv.innerHTML = '';
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click', onSubmitSentences);
    controlsDiv.appendChild(submitBtn);

    updateScoreboard();
  }

  function forceEndGame() {
    // Only allow ending the game if it has started (not in setup phase)
    if (gamePhase === 'setup' || teams.length === 0) {
      alert('The game hasn\'t started yet!');
      return;
    }

    // Confirm the action
    if (!confirm('Are you sure you want to end the game now? The team with the most points will win.')) {
      return;
    }

    // Set turns to 0 and trigger end game
    turnsRemaining = 0;
    updateTurnCounter();
    endGame();
  }

  function endGame() {
    gamePhase = 'gameOver';
    victoryTriggered = true;

    // Find winner(s)
    const maxScore = Math.max(...teams.map(t => t.score));
    const winners = teams.filter(t => t.score === maxScore);

    instructionDiv.textContent = 'Game Over!';
    
    if (winners.length === 1) {
      answerDiv.textContent = `${winners[0].name} wins with ${maxScore} points!`;
    } else {
      const winnerNames = winners.map(w => w.name).join(', ');
      answerDiv.textContent = `Tie! ${winnerNames} win with ${maxScore} points!`;
    }

    controlsDiv.innerHTML = '';

    updateScoreboard();

    // Stop background music to avoid clashing with victory music
    bgMusic.pause();

    // Trigger victory celebration
    if (window.VictoryManager && window.VictoryManager.playVictorySequence) {
      const winnerText = winners.length === 1 ? winners[0].name : 'TIE!';
      const winnerColor = winners.length === 1 ? getTeamColor(winners[0].name) : '#FFD700';
      
      window.VictoryManager.playVictorySequence({
        muted: isMuted,
        winnerText: winnerText,
        winnerColor: winnerColor
      });
    }
  }

  function getTeamColor(teamName) {
    const colors = {
      'Teacher': '#5cd0ff',
      'Team 1': '#ff6b6b',
      'Team 2': '#4ecdc4',
      'Team 3': '#ffe66d',
      'Team 4': '#a8e6cf'
    };
    return colors[teamName] || '#FFD700';
  }

  function updateScoreboard() {
    scoresEl.innerHTML = '';
    teams.forEach((team, index) => {
      const li = document.createElement('li');
      li.textContent = `${team.name}: ${team.score}`;
      
      // Highlight current team's turn (only during team rounds)
      if (currentRound > 0 && index === currentTeamIndex && !victoryTriggered) {
        li.classList.add('current');
      }
      
      // Highlight winner at end
      if (victoryTriggered) {
        const maxScore = Math.max(...teams.map(t => t.score));
        if (team.score === maxScore) {
          li.classList.add('winner');
        }
      }
      
      scoresEl.appendChild(li);
    });
  }

  function updateTurnCounter() {
    turnsLeftEl.textContent = turnsRemaining;
  }

  function clearSentences() {
    sentenceA.value = '';
    sentenceB.value = '';
    sentenceC.value = '';
    guessA.value = '';
    guessB.value = '';
    guessC.value = '';
  }

  function enableSentenceInputs() {
    sentenceA.disabled = false;
    sentenceB.disabled = false;
    sentenceC.disabled = false;
  }

  function disableSentenceInputs() {
    sentenceA.disabled = true;
    sentenceB.disabled = true;
    sentenceC.disabled = true;
  }

  function enableGuessInputs() {
    guessA.disabled = false;
    guessB.disabled = false;
    guessC.disabled = false;
  }

  function disableGuessInputs() {
    guessA.disabled = true;
    guessB.disabled = true;
    guessC.disabled = true;
  }

  function showModal(modal) {
    modal.classList.add('show');
    // Auto-focus the turn count input when that modal opens
    if (modal === turnCountModal && turnCountInput) {
      setTimeout(() => turnCountInput.focus(), 100);
    }
  }

  function hideModal(modal) {
    modal.classList.remove('show');
  }

  function toggleMute() {
    isMuted = !isMuted;
    bgMusic.muted = isMuted;
    
    if (window.VictoryManager && window.VictoryManager.updateMuteState) {
      window.VictoryManager.updateMuteState(isMuted);
    }
  }

  function tryPlayMusic() {
    if (!isMuted) {
      bgMusic.volume = 0.3; // Set volume to 30%
      bgMusic.play().catch(err => {
        console.log('Music autoplay prevented:', err);
      });
    }
  }

  function restartGame() {
    // Stop victory effects if active
    if (window.VictoryManager && window.VictoryManager.stopVictorySequence) {
      window.VictoryManager.stopVictorySequence();
    }

    // Reset state
    numTeams = 0;
    totalTurns = 0;
    turnsRemaining = 0;
    teams = [];
    currentRound = 0;
    currentTeamIndex = 0;
    gamePhase = 'setup';
    victoryTriggered = false;

    // Clear UI
    clearSentences();
    instructionDiv.textContent = 'Welcome! Set up the game to begin.';
    answerDiv.textContent = '';
    controlsDiv.innerHTML = '';
    scoresEl.innerHTML = '';
    turnsLeftEl.textContent = '-';

    // Stop background music and reset it
    bgMusic.pause();
    bgMusic.currentTime = 0;

    // Restart setup
    showModal(teamCountModal);
  }

  // Start the game
  init();
})();