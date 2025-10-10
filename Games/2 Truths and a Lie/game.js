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
  const volumeSlider = document.getElementById('volumeSlider');
  const restartBtn = document.getElementById('restartBtn');
  const endGameBtn = document.getElementById('endGameBtn');
  const rulesBtn = document.getElementById('rulesBtn');

  const teamCountModal = document.getElementById('teamCountModal');
  const humanTeamModal = document.getElementById('humanTeamModal');
  const humanTeamButtons = document.getElementById('humanTeamButtons');
  const turnCountModal = document.getElementById('turnCountModal');
  const turnCountInput = document.getElementById('turnCountInput');
  const turnCountSubmit = document.getElementById('turnCountSubmit');
  const answerModal = document.getElementById('answerModal');
  const rulesPanel = document.getElementById('rulesPanel');
  const closeRules = document.getElementById('closeRules');

  // Game state
  let numTeams = 0;
  let numHumanTeams = 0;
  let totalTurns = 0;
  let turnsRemaining = 0;
  let teams = []; // [{ name: 'Team 1', score: 0, isAI: false }, ...]
  let currentRound = 0; // 0 = teacher example, 1+ = team rounds
  let currentTeamIndex = 0; // which team's turn it is
  let gamePhase = 'setup'; // setup, writing, guessing, revealing, nextRound, gameOver
  let victoryTriggered = false;
  let aiCorrectAnswer = null; // Tracks which sentence (A, B, or C) is false when AI submits
  let isMuted = false; // Track music mute state

  // AI fact pool - pre-defined true/false facts about various topics
  const aiFacts = [
    // Geography - Capitals
    { truth1: "The capital of France is Paris", truth2: "The capital of Japan is Tokyo", lie: "The capital of Australia is Sydney" },
    { truth1: "The capital of Canada is Ottawa", truth2: "The capital of Brazil is Brasília", lie: "The capital of USA is New York" },
    { truth1: "The capital of Germany is Berlin", truth2: "The capital of Italy is Rome", lie: "The capital of Switzerland is Zurich" },
    
    // Science - Solar System
    { truth1: "Earth has one moon", truth2: "Mars is called the Red Planet", lie: "Venus is the largest planet in our solar system" },
    { truth1: "Saturn has rings", truth2: "Jupiter is the largest planet", lie: "The Sun is a planet" },
    { truth1: "Mercury is closest to the Sun", truth2: "Neptune is blue in color", lie: "Mars has more moons than Jupiter" },
    
    // Animals
    { truth1: "Elephants are mammals", truth2: "Penguins cannot fly", lie: "Sharks are mammals" },
    { truth1: "Dolphins breathe air", truth2: "Octopuses have three hearts", lie: "Spiders are insects" },
    { truth1: "Bats are mammals", truth2: "Snakes are reptiles", lie: "Whales are fish" },
    
    // History
    { truth1: "World War II ended in 1945", truth2: "The Titanic sank in 1912", lie: "The first moon landing was in 1959" },
    { truth1: "The Great Wall of China is over 2000 years old", truth2: "The pyramids are in Egypt", lie: "The Eiffel Tower was built in 1789" },
    
    // Mathematics
    { truth1: "A triangle has three sides", truth2: "A circle has 360 degrees", lie: "A square has five corners" },
    { truth1: "10 multiplied by 10 equals 100", truth2: "Half of 50 is 25", lie: "7 plus 8 equals 16" },
    
    // Human Body
    { truth1: "Humans have 206 bones", truth2: "The heart pumps blood", lie: "Humans have four lungs" },
    { truth1: "The brain controls the body", truth2: "Skin is the largest organ", lie: "Humans have three eyes" },
    
    // General Knowledge
    { truth1: "Water freezes at 0 degrees Celsius", truth2: "There are 7 days in a week", lie: "A year has 400 days" }
  ];
  let usedAIFacts = []; // Track which facts have been used

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
        showHumanTeamModal();
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
    volumeSlider.addEventListener('input', handleVolumeChange);
    
    // Set initial volume for VictoryManager
    const initialVolume = volumeSlider.value / 100;
    if (window.VictoryManager && window.VictoryManager.setMusicVolume) {
      window.VictoryManager.setMusicVolume(initialVolume);
    }
    
    restartBtn.addEventListener('click', restartGame);
    endGameBtn.addEventListener('click', forceEndGame);
    rulesBtn.addEventListener('click', () => showModal(rulesPanel));
    closeRules.addEventListener('click', () => hideModal(rulesPanel));
  }

  function showHumanTeamModal() {
    // Generate buttons for human team selection (0 to numTeams)
    humanTeamButtons.innerHTML = '';
    for (let i = 0; i <= numTeams; i++) {
      const btn = document.createElement('button');
      btn.className = 'vpBtn humanTeamBtn';
      btn.textContent = i.toString();
      btn.dataset.humanTeams = i;
      btn.addEventListener('click', () => {
        numHumanTeams = parseInt(btn.dataset.humanTeams);
        hideModal(humanTeamModal);
        showModal(turnCountModal);
      });
      humanTeamButtons.appendChild(btn);
    }
    showModal(humanTeamModal);
  }

  function startGame() {
    // Initialize teams
    teams = [{ name: 'Teacher', score: 0, isAI: false }];
    for (let i = 1; i <= numTeams; i++) {
      const isAI = i > numHumanTeams;
      teams.push({ 
        name: `Team ${i}`, 
        score: 0, 
        isAI: isAI 
      });
    }

    updateScoreboard();
    updateTurnCounter();
    startTeacherRound();
  }

  function startTeacherRound() {
    currentRound = 0;
    gamePhase = 'writing';
    currentTeamIndex = 0; // Teacher
    aiCorrectAnswer = null; // Reset AI answer tracking

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

    if (currentRound === 0) {
      // Teacher example round - teams guess (including AI teams)
      instructionDiv.textContent = 'Teams decide: which sentence is false?';
      answerDiv.textContent = 'AI teams are making their guesses... Teacher: enter human team numbers in the guess boxes.';
      
      enableGuessInputs();
      
      // AI teams make their guesses automatically
      setTimeout(() => {
        addAIGuessesForTeacherRound();
      }, 1000);
    } else {
      // Team round - other teams and teacher guess
      const currentTeam = teams[currentTeamIndex];
      instructionDiv.textContent = `Other teams and teacher: which sentence is false?`;
      
      if (currentTeam.isAI) {
        // If AI team submitted, only human teams and teacher guess
        answerDiv.textContent = 'AI teams are making their guesses... Teacher: enter human team numbers (or "t" for teacher) in the guess boxes.';
      } else {
        // If human team submitted, AI teams and teacher guess
        answerDiv.textContent = 'AI teams are making their guesses... Teacher: enter human team numbers (or "t" for teacher) in the guess boxes.';
      }
      
      enableGuessInputs();
      
      // AI teams make their guesses automatically (excluding the current team if it's AI)
      setTimeout(() => {
        addAIGuessesForTeamRound();
      }, 1000);
    }

    // Create submit guesses button
    controlsDiv.innerHTML = '';
    const submitGuessesBtn = document.createElement('button');
    submitGuessesBtn.textContent = 'Submit Guesses';
    submitGuessesBtn.addEventListener('click', onSubmitGuesses);
    controlsDiv.appendChild(submitGuessesBtn);
  }

  function addAIGuessesForTeacherRound() {
    // All AI teams guess during teacher round
    const aiGuesses = { A: [], B: [], C: [] };
    
    teams.forEach((team, index) => {
      if (index > 0 && team.isAI) { // Skip teacher (index 0)
        const guess = aiMakeGuess();
        aiGuesses[guess].push(index); // Store team index
      }
    });
    
    // Add AI guesses to the guess inputs
    if (aiGuesses.A.length > 0) {
      const existing = guessA.value.trim();
      guessA.value = existing ? `${existing}, ${aiGuesses.A.join(', ')}` : aiGuesses.A.join(', ');
    }
    if (aiGuesses.B.length > 0) {
      const existing = guessB.value.trim();
      guessB.value = existing ? `${existing}, ${aiGuesses.B.join(', ')}` : aiGuesses.B.join(', ');
    }
    if (aiGuesses.C.length > 0) {
      const existing = guessC.value.trim();
      guessC.value = existing ? `${existing}, ${aiGuesses.C.join(', ')}` : aiGuesses.C.join(', ');
    }
  }

  function addAIGuessesForTeamRound() {
    // AI teams guess (excluding the current team if it's AI)
    const aiGuesses = { A: [], B: [], C: [] };
    
    teams.forEach((team, index) => {
      if (index > 0 && team.isAI && index !== currentTeamIndex) { // Skip teacher and current team
        const guess = aiMakeGuess();
        aiGuesses[guess].push(index); // Store team index
      }
    });
    
    // Add AI guesses to the guess inputs
    if (aiGuesses.A.length > 0) {
      const existing = guessA.value.trim();
      guessA.value = existing ? `${existing}, ${aiGuesses.A.join(', ')}` : aiGuesses.A.join(', ');
    }
    if (aiGuesses.B.length > 0) {
      const existing = guessB.value.trim();
      guessB.value = existing ? `${existing}, ${aiGuesses.B.join(', ')}` : aiGuesses.B.join(', ');
    }
    if (aiGuesses.C.length > 0) {
      const existing = guessC.value.trim();
      guessC.value = existing ? `${existing}, ${aiGuesses.C.join(', ')}` : aiGuesses.C.join(', ');
    }
  }

  function onSubmitGuesses() {
    // Check if at least one guess is entered
    if (!guessA.value.trim() && !guessB.value.trim() && !guessC.value.trim()) {
      alert('Please enter at least one guess!');
      return;
    }

    gamePhase = 'revealing';
    disableGuessInputs();

    // If AI team submitted sentences, automatically reveal the answer
    if (aiCorrectAnswer !== null) {
      revealAnswer(aiCorrectAnswer);
      aiCorrectAnswer = null; // Reset for next round
    } else {
      // Human team submitted, teacher needs to select the answer
      instructionDiv.textContent = 'Teacher: select which sentence is false';
      answerDiv.textContent = '';
      controlsDiv.innerHTML = '';

      // Show answer modal
      showModal(answerModal);
    }
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
    aiCorrectAnswer = null; // Reset AI answer tracking for new round

    clearSentences();
    disableGuessInputs();

    const currentTeam = teams[currentTeamIndex];
    
    // Check if current team is AI
    if (currentTeam.isAI) {
      // AI team automatically submits sentences
      disableSentenceInputs();
      instructionDiv.textContent = `${currentTeam.name} (AI) is submitting sentences...`;
      answerDiv.textContent = '';
      controlsDiv.innerHTML = '';
      
      updateScoreboard();
      
      // Delay for realism
      setTimeout(() => {
        aiSubmitSentences();
      }, 1500);
    } else {
      // Human team
      enableSentenceInputs();
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
  }

  function aiSubmitSentences() {
    // Get a random unused fact, or reuse if all have been used
    if (usedAIFacts.length >= aiFacts.length) {
      usedAIFacts = []; // Reset if all facts used
    }
    
    let fact;
    do {
      fact = aiFacts[Math.floor(Math.random() * aiFacts.length)];
    } while (usedAIFacts.includes(fact));
    
    usedAIFacts.push(fact);
    
    // Randomly arrange the sentences in A, B, C and track which one is the lie
    const sentences = [
      { text: fact.truth1, isLie: false },
      { text: fact.truth2, isLie: false },
      { text: fact.lie, isLie: true }
    ];
    const shuffled = shuffleArray([...sentences]);
    
    sentenceA.value = shuffled[0].text;
    sentenceB.value = shuffled[1].text;
    sentenceC.value = shuffled[2].text;
    
    // Track which position has the lie
    if (shuffled[0].isLie) aiCorrectAnswer = 'A';
    else if (shuffled[1].isLie) aiCorrectAnswer = 'B';
    else aiCorrectAnswer = 'C';
    
    // Automatically proceed to guessing phase
    onSubmitSentences();
  }

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function aiMakeGuess() {
    // AI makes a random guess (A, B, or C)
    const choices = ['A', 'B', 'C'];
    return choices[Math.floor(Math.random() * choices.length)];
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
      let winnerText;
      if (winners.length === 1) {
        // Add "wins" suffix for all winners
        winnerText = `${winners[0].name} wins`;
      } else {
        winnerText = 'TIE!';
      }
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
      const aiLabel = team.isAI ? ' (AI)' : '';
      li.textContent = `${team.name}${aiLabel}: ${team.score}`;
      
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

  function handleVolumeChange(e) {
    const volume = e.target.value / 100;
    bgMusic.volume = volume;
    
    // Update mute state based on volume
    isMuted = (volume === 0);
    
    if (window.VictoryManager && window.VictoryManager.setMusicVolume) {
      window.VictoryManager.setMusicVolume(volume);
    }
  }

  function tryPlayMusic() {
    bgMusic.volume = volumeSlider.value / 100;
    bgMusic.play().catch(err => {
      console.log('Music autoplay prevented:', err);
    });
  }

  function restartGame() {
    // Stop victory effects if active
    if (window.VictoryManager && window.VictoryManager.stopVictorySequence) {
      window.VictoryManager.stopVictorySequence();
    }

    // Reset state
    numTeams = 0;
    numHumanTeams = 0;
    totalTurns = 0;
    turnsRemaining = 0;
    teams = [];
    currentRound = 0;
    currentTeamIndex = 0;
    gamePhase = 'setup';
    victoryTriggered = false;
    usedAIFacts = [];
    aiCorrectAnswer = null;

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