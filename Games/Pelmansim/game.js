// Memory Madness Game Logic
(function() {
  'use strict';

  // DOM Elements
  const cardsGrid = document.getElementById('cardsGrid');
  const instructionDiv = document.getElementById('instructionDiv');
  const answerDiv = document.getElementById('answerDiv');
  const controlsDiv = document.getElementById('controlsDiv');
  const scoresEl = document.getElementById('scores');
  
  const bgMusic = document.getElementById('bgMusic');
  const pairFoundSfx = document.getElementById('pairFoundSfx');
  const pairNotFoundSfx = document.getElementById('pairNotFoundSfx');
  const diceSfx = document.getElementById('diceSfx');
  
  const volumeSlider = document.getElementById('volumeSlider');
  const restartBtn = document.getElementById('restartBtn');
  const rulesBtn = document.getElementById('rulesBtn');
  const endGameBtn = document.getElementById('endGameBtn');
  
  const teamCountModal = document.getElementById('teamCountModal');
  const humanCountModal = document.getElementById('humanCountModal');
  const vocabCountModal = document.getElementById('vocabCountModal');
  const vocabCountSelect = document.getElementById('vocabCountSelect');
  const vocabCountConfirmBtn = document.getElementById('vocabCountConfirmBtn');
  const rulesPanel = document.getElementById('rulesPanel');
  const closeRules = document.getElementById('closeRules');

  // Game State
  let payload = null;
  let teams = [];
  let currentTeamIdx = 0;
  let vocabCount = 12;
  let selectedVocab = []; // Store selected vocab items for tooltip access
  let cards = []; // Array of card objects
  let flippedCards = [];
  let matchedPairs = 0;
  let totalPairs = 0;
  let isProcessing = false;
  let turnOrderFinalized = false;
  let diceRollButton = null;
  let victoryTriggered = false;
  let isMuted = false; // Track mute state

  // Team colors
  const teamColors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3'];

  // Helper functions
  const show = (el) => el.classList.add('show');
  const hide = (el) => el.classList.remove('show');

  function setMessage(div, text) {
    if (div) div.textContent = text;
  }

  function parsePayloadFromHash() {
    try {
      const hash = location.hash || '';
      const m = hash.match(/#questions=(.*)$/);
      if (m && m[1]) {
        const decoded = decodeURIComponent(m[1]);
        const obj = JSON.parse(decoded);
        if (obj && obj.listType === 'vocab' && Array.isArray(obj.questions)) {
          payload = {
            id: obj.id || null,
            name: obj.name || 'Untitled',
            listType: 'vocab',
            questions: obj.questions.filter(q => q && q.type === 'vocab')
          };
          return true;
        }
      }
    } catch (err) {
      console.error('Error parsing payload:', err);
    }
    return false;
  }

  function initGame() {
    if (!parsePayloadFromHash()) {
      alert('No valid vocab list found. Please select a vocab list from the editor.');
      window.location.href = '../../index.html';
      return;
    }

    if (payload.questions.length === 0) {
      alert('The vocab list is empty. Please add vocabulary items first.');
      window.location.href = '../../index.html';
      return;
    }

    show(teamCountModal);
  }

  // Modal handlers
  document.querySelectorAll('.teamCountBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const numTeams = parseInt(btn.dataset.teams);
      teams = [];
      for (let i = 0; i < numTeams; i++) {
        teams.push({
          name: `Team ${i + 1}`,
          score: 0,
          isHuman: false,
          color: teamColors[i]
        });
      }
      hide(teamCountModal);
      showHumanCountModal(numTeams);
    });
  });

  function showHumanCountModal(numTeams) {
    const humanButtons = document.getElementById('humanButtons');
    humanButtons.innerHTML = '';
    
    for (let i = 0; i <= numTeams; i++) {
      const btn = document.createElement('button');
      btn.className = 'vpBtn humanCountBtn';
      btn.textContent = i;
      btn.dataset.count = i;
      btn.addEventListener('click', () => {
        const humanCount = parseInt(btn.dataset.count);
        // Set first N teams as human
        for (let j = 0; j < teams.length; j++) {
          teams[j].isHuman = j < humanCount;
        }
        hide(humanCountModal);
        showVocabCountModal();
      });
      humanButtons.appendChild(btn);
    }
    
    show(humanCountModal);
  }

  function showVocabCountModal() {
    // Populate dropdown with options from 6 to 25
    vocabCountSelect.innerHTML = '';
    const maxAvailable = Math.min(25, payload.questions.length);
    
    for (let i = 6; i <= maxAvailable; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      vocabCountSelect.appendChild(option);
    }
    
    // Set default to 12 if available, otherwise the middle option
    const defaultValue = maxAvailable >= 12 ? 12 : Math.floor((6 + maxAvailable) / 2);
    vocabCountSelect.value = defaultValue;
    
    show(vocabCountModal);
  }

  // Vocab count confirm button handler
  vocabCountConfirmBtn.addEventListener('click', () => {
    vocabCount = parseInt(vocabCountSelect.value);
    if (vocabCount > payload.questions.length) {
      vocabCount = payload.questions.length;
    }
    hide(vocabCountModal);
    setupGame(); // Go directly to game setup (always use image mode)
  });

  function setupGame() {
    // Shuffle and select vocab items
    const shuffled = [...payload.questions].sort(() => Math.random() - 0.5);
    selectedVocab = shuffled.slice(0, vocabCount);
    
    totalPairs = selectedVocab.length;
    
    // Create cards
    const leftCards = [];
    const rightCards = [];
    
    selectedVocab.forEach((vocab, idx) => {
      // Left side: word cards (with definition stored for tooltip)
      leftCards.push({
        id: `word-${idx}`,
        type: 'word',
        content: vocab.word || '',
        definition: vocab.definition || '', // Store definition for tooltip
        pairId: idx,
        flipped: false,
        matched: false
      });
      
      // Right side: always use images
      rightCards.push({
        id: `image-${idx}`,
        type: 'image',
        content: vocab.image || '',
        pairId: idx,
        flipped: false,
        matched: false
      });
    });
    
    // Shuffle each side independently
    leftCards.sort(() => Math.random() - 0.5);
    rightCards.sort(() => Math.random() - 0.5);
    
    cards = [...leftCards, ...rightCards];
    
    renderCards(leftCards, rightCards);
    renderScoreboard();
    
    setMessage(instructionDiv, 'Click "Roll Dice" to determine turn order!');
    setMessage(answerDiv, '');
    
    // Add roll dice button
    diceRollButton = document.createElement('button');
    diceRollButton.textContent = 'Roll Dice';
    diceRollButton.className = 'vpBtn';
    diceRollButton.addEventListener('click', rollDiceForTurnOrder);
    controlsDiv.innerHTML = '';
    controlsDiv.appendChild(diceRollButton);
    
    // Set initial volume and play music
    bgMusic.volume = volumeSlider.value / 100;
    bgMusic.play().catch(e => console.log('Audio play failed:', e));
  }

  function renderCards(leftCards, rightCards) {
    cardsGrid.innerHTML = '';
    
    // Calculate grid dimensions for square-like layout (for each side)
    const numCards = leftCards.length;
    
    // Calculate optimal grid dimensions (as square as possible)
    let cols = Math.ceil(Math.sqrt(numCards));
    let rows = Math.ceil(numCards / cols);
    
    // Adjust to ensure all cards fit
    while (rows * cols < numCards) {
      cols++;
    }
    
    const cardsArea = document.getElementById('cardsArea');
    const availableHeight = cardsArea.clientHeight - 20; // Account for reduced padding and coordinate labels
    const availableWidth = cardsArea.clientWidth - 20;
    
    // Estimate gap size
    let estimatedGap = numCards > 16 ? 6 : numCards > 8 ? 8 : 10;
    
    // Calculate card size to fit all cards without scrolling
    const totalVerticalGap = (rows - 1) * estimatedGap + 50; // gaps + padding + coord space
    const maxCardHeight = (availableHeight - totalVerticalGap) / rows;
    
    // Account for two grids side by side with divider
    const dividerSpace = 15; // Space for center divider (reduced from 30)
    const totalHorizontalGap = ((cols - 1) * estimatedGap * 2) + (cols * 2 * 10) + dividerSpace; // gaps for both grids + padding + divider
    const maxCardWidth = (availableWidth - totalHorizontalGap) / (cols * 2);
    
    // Use the smaller dimension to keep cards square - removed max limit to allow cards to fill screen
    let cardSize = Math.min(maxCardHeight, maxCardWidth);
    cardSize = Math.max(cardSize, 60); // Min 60px
    
    // Adjust gap based on final card size
    let gap = cardSize > 120 ? 10 : cardSize > 90 ? 8 : 6;
    
    // Adjust font sizes and styling based on card size
    let cardFontSize = cardSize > 140 ? '1.5rem' : cardSize > 100 ? '1.2rem' : cardSize > 80 ? '0.95rem' : cardSize > 70 ? '0.8rem' : '0.7rem';
    let cardFrontFontSize = cardSize > 140 ? '1.3rem' : cardSize > 100 ? '1rem' : cardSize > 80 ? '0.85rem' : cardSize > 70 ? '0.75rem' : '0.65rem';
    let cardBackFontSize = cardSize > 140 ? '3rem' : cardSize > 100 ? '2rem' : cardSize > 80 ? '1.5rem' : cardSize > 70 ? '1.2rem' : '1rem';
    let coordFontSize = cardSize > 140 ? '1.2rem' : cardSize > 100 ? '1rem' : cardSize > 80 ? '0.85rem' : cardSize > 70 ? '0.7rem' : '0.6rem';
    let cardPadding = cardSize > 120 ? '15px' : cardSize > 90 ? '10px' : cardSize > 70 ? '8px' : '6px';
    let cardBorderWidth = cardSize > 120 ? '4px' : cardSize > 90 ? '3px' : '2px';
    let cardBorderRadius = cardSize > 120 ? '15px' : cardSize > 90 ? '12px' : '10px';
    
    // Set CSS variables
    document.documentElement.style.setProperty('--card-size', `${cardSize}px`);
    document.documentElement.style.setProperty('--card-gap', `${gap}px`);
    document.documentElement.style.setProperty('--card-font-size', cardFontSize);
    document.documentElement.style.setProperty('--card-front-font-size', cardFrontFontSize);
    document.documentElement.style.setProperty('--card-back-font-size', cardBackFontSize);
    document.documentElement.style.setProperty('--coord-font-size', coordFontSize);
    document.documentElement.style.setProperty('--card-padding', cardPadding);
    document.documentElement.style.setProperty('--card-border-width', cardBorderWidth);
    document.documentElement.style.setProperty('--card-border-radius', cardBorderRadius);
    document.documentElement.style.setProperty('--grid-cols', cols);
    document.documentElement.style.setProperty('--grid-rows', rows);
    
    // Create two grids side by side
    const leftGrid = document.createElement('div');
    leftGrid.className = 'card-grid';
    leftGrid.id = 'leftGrid';
    
    const rightGrid = document.createElement('div');
    rightGrid.className = 'card-grid';
    rightGrid.id = 'rightGrid';
    
    // Calculate coordinates for all cards
    // Each grid has its own layout, but coordinates span across both grids
    // Left grid: columns 1 to cols
    // Right grid: columns (cols+1) to (cols*2)
    
    // Add cards to left grid
    leftCards.forEach((card, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const coordinate = getCoordinate(row, col);
      const cardEl = createCardElement(card, coordinate);
      leftGrid.appendChild(cardEl);
    });
    
    // Add cards to right grid (columns continue from left grid)
    rightCards.forEach((card, index) => {
      const row = Math.floor(index / cols);
      const col = (index % cols) + cols; // Offset by cols to continue numbering
      const coordinate = getCoordinate(row, col);
      const cardEl = createCardElement(card, coordinate);
      rightGrid.appendChild(cardEl);
    });
    
    cardsGrid.appendChild(leftGrid);
    cardsGrid.appendChild(rightGrid);
  }
  
  function getCoordinate(row, col) {
    // Convert row to letter (A, B, C, ...)
    const rowLetter = String.fromCharCode(65 + row); // 65 is 'A'
    return `${rowLetter}${col + 1}`;
  }

  function createCardElement(card, coordinate) {
    const cardEl = document.createElement('div');
    cardEl.className = 'memory-card';
    cardEl.dataset.id = card.id;
    cardEl.dataset.coordinate = coordinate;
    cardEl.style.position = 'relative';
    
    // Initially disable cards until dice is rolled
    if (!turnOrderFinalized) {
      cardEl.classList.add('disabled');
    }
    
    // Add coordinate label
    const coordLabel = document.createElement('div');
    coordLabel.className = 'coordinate-label';
    coordLabel.textContent = coordinate;
    cardEl.appendChild(coordLabel);
    
    // Add definition tooltip for word cards
    if (card.type === 'word' && card.definition) {
      const tooltip = document.createElement('div');
      tooltip.className = 'definition-tooltip';
      tooltip.textContent = card.definition;
      cardEl.appendChild(tooltip);
    }
    
    // Card back (face down)
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    cardBack.textContent = coordinate;
    cardEl.appendChild(cardBack);
    
    // Card front (face up)
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    
    if (card.type === 'image' && card.content) {
      const img = document.createElement('img');
      img.className = 'card-image';
      img.src = card.content;
      img.alt = 'Vocabulary image';
      
      // Handle broken image URLs
      img.onerror = function() {
        console.warn('Failed to load image:', card.content);
        // Replace with placeholder text
        cardFront.innerHTML = '';
        cardFront.textContent = '[Image not available]';
        cardFront.style.fontSize = 'var(--card-font-size, 1rem)';
        cardFront.style.color = '#ff6b6b';
      };
      
      cardFront.appendChild(img);
    } else {
      cardFront.textContent = card.content;
    }
    
    cardEl.appendChild(cardFront);
    
    cardEl.addEventListener('click', () => handleCardClick(card.id));
    
    return cardEl;
  }

  function rollDiceForTurnOrder() {
    // Play dice sound
    if (diceSfx) {
      diceSfx.currentTime = 0;
      diceSfx.play().catch(() => {});
    }
    
    // Roll dice for all teams, ensuring no duplicates
    let hasDuplicates = true;
    while (hasDuplicates) {
      teams.forEach(team => {
        team.roll = Math.floor(Math.random() * 6) + 1;
      });
      
      // Check for duplicate rolls
      const rolls = teams.map(t => t.roll);
      hasDuplicates = rolls.length !== new Set(rolls).size;
    }
    
    teams.sort((a, b) => b.roll - a.roll);
    
    const rollResults = teams.map(t => `${t.name}: ${t.roll}`).join(', ');
    setMessage(instructionDiv, `Dice rolls: ${rollResults}`);
    setMessage(answerDiv, `Turn order determined! ${teams[0].name} goes first.`);
    
    turnOrderFinalized = true;
    currentTeamIdx = 0;
    
    // Enable all cards now that turn order is set
    document.querySelectorAll('.memory-card').forEach(card => {
      card.classList.remove('disabled');
    });
    
    if (diceRollButton) {
      diceRollButton.remove();
      diceRollButton = null;
    }
    
    controlsDiv.innerHTML = '';
    renderScoreboard();
    
    setTimeout(() => {
      startTurn();
    }, 2000);
  }

  function renderScoreboard() {
    scoresEl.innerHTML = '';
    teams.forEach((team, idx) => {
      const li = document.createElement('li');
      const aiLabel = team.isHuman ? '' : ' (AI)';
      li.textContent = `${team.name}${aiLabel}: ${team.score}`;
      li.style.borderColor = team.color;
      if (turnOrderFinalized && idx === currentTeamIdx) {
        li.classList.add('current-turn');
      }
      scoresEl.appendChild(li);
    });
  }

  function startTurn() {
    if (victoryTriggered) return;
    
    const team = teams[currentTeamIdx];
    setMessage(instructionDiv, `${team.name}'s turn!`);
    setMessage(answerDiv, 'Select one card from each side.');
    
    // Reset all non-matched cards to unflipped state
    cards.forEach(card => {
      if (!card.matched) {
        card.flipped = false;
        const cardEl = document.querySelector(`[data-id="${card.id}"]`);
        if (cardEl) {
          cardEl.classList.remove('flipped');
        }
      }
    });
    
    flippedCards = [];
    renderScoreboard();
    
    if (!team.isHuman) {
      setTimeout(() => aiTakeTurn(), 1500);
    }
  }

  function handleCardClick(cardId) {
    if (isProcessing || victoryTriggered) return;
    
    // Prevent clicking cards before dice roll
    if (!turnOrderFinalized) return;
    
    const team = teams[currentTeamIdx];
    if (!team.isHuman) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;
    
    // Check if we already have a card from this side
    if (flippedCards.length > 0) {
      const firstCard = cards.find(c => c.id === flippedCards[0]);
      const isSameSide = (firstCard.type === 'word' && card.type === 'word') ||
                         (firstCard.type !== 'word' && card.type !== 'word');
      if (isSameSide) {
        setMessage(answerDiv, 'Please select one card from each side!');
        return;
      }
    }
    
    flipCard(cardId);
  }

  function flipCard(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    card.flipped = true;
    flippedCards.push(cardId);
    
    const cardEl = document.querySelector(`[data-id="${cardId}"]`);
    if (cardEl) {
      cardEl.classList.add('flipped');
    }
    
    if (flippedCards.length === 2) {
      isProcessing = true;
      setTimeout(() => checkMatch(), 500);
    }
  }

  function checkMatch() {
    const card1 = cards.find(c => c.id === flippedCards[0]);
    const card2 = cards.find(c => c.id === flippedCards[1]);
    
    if (!card1 || !card2) {
      isProcessing = false;
      return;
    }
    
    const isMatch = card1.pairId === card2.pairId;
    
    if (isMatch) {
      // Match found!
      card1.matched = true;
      card2.matched = true;
      
      const cardEl1 = document.querySelector(`[data-id="${card1.id}"]`);
      const cardEl2 = document.querySelector(`[data-id="${card2.id}"]`);
      
      if (cardEl1) cardEl1.classList.add('matched');
      if (cardEl2) cardEl2.classList.add('matched');
      
      teams[currentTeamIdx].score++;
      matchedPairs++;
      
      if (!isMuted) {
        pairFoundSfx.play().catch(e => console.log('Audio play failed:', e));
      }
      
      setMessage(answerDiv, `Match found! ${teams[currentTeamIdx].name} scores a point!`);
      renderScoreboard();
      
      flippedCards = [];
      
      if (matchedPairs >= totalPairs) {
        setTimeout(() => endGame(), 1000);
      } else {
        setTimeout(() => {
          isProcessing = false;
          startTurn();
        }, 1500);
      }
    } else {
      // No match
      if (!isMuted) {
        pairNotFoundSfx.play().catch(e => console.log('Audio play failed:', e));
      }
      
      setMessage(answerDiv, 'No match. Next team\'s turn!');
      
      setTimeout(() => {
        // Flip cards back
        card1.flipped = false;
        card2.flipped = false;
        
        const cardEl1 = document.querySelector(`[data-id="${card1.id}"]`);
        const cardEl2 = document.querySelector(`[data-id="${card2.id}"]`);
        
        if (cardEl1) cardEl1.classList.remove('flipped');
        if (cardEl2) cardEl2.classList.remove('flipped');
        
        flippedCards = [];
        isProcessing = false;
        
        // Next team
        currentTeamIdx = (currentTeamIdx + 1) % teams.length;
        startTurn();
      }, 3000);
    }
  }

  function aiTakeTurn() {
    if (isProcessing || victoryTriggered) return;
    
    // Get unmatched cards
    const unmatchedCards = cards.filter(c => !c.matched && !c.flipped);
    const leftCards = unmatchedCards.filter(c => c.type === 'word');
    const rightCards = unmatchedCards.filter(c => c.type !== 'word');
    
    if (leftCards.length === 0 || rightCards.length === 0) return;
    
    // AI randomly selects one from each side
    const leftCard = leftCards[Math.floor(Math.random() * leftCards.length)];
    const rightCard = rightCards[Math.floor(Math.random() * rightCards.length)];
    
    setTimeout(() => {
      flipCard(leftCard.id);
      setTimeout(() => {
        flipCard(rightCard.id);
      }, 800);
    }, 500);
  }

  function endGame() {
    if (victoryTriggered) return;
    victoryTriggered = true;
    
    // Find winner(s)
    const maxScore = Math.max(...teams.map(t => t.score));
    const winners = teams.filter(t => t.score === maxScore);
    
    if (winners.length === 1) {
      setMessage(instructionDiv, `${winners[0].name} wins with ${maxScore} points!`);
    } else {
      const winnerNames = winners.map(w => w.name).join(' and ');
      setMessage(instructionDiv, `It's a tie! ${winnerNames} win with ${maxScore} points each!`);
    }
    
    setMessage(answerDiv, 'Game Over!');
    controlsDiv.innerHTML = '';
    
    // Stop background music before victory celebration
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    
    // Trigger victory celebration
    if (window.VictoryManager && window.VictoryManager.playVictorySequence) {
      const winnerName = winners.length === 1 ? winners[0].name : 'Winners';
      const winnerColor = winners.length === 1 ? winners[0].color : '#FFD700';
      
      window.VictoryManager.playVictorySequence({
        winnerName: winnerName,
        winnerColor: winnerColor,
        isMuted: isMuted
      });
    }
  }

  // Volume slider handler
  volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    bgMusic.volume = volume;
    
    // Update mute state based on volume
    isMuted = (volume === 0);
    
    // Notify Victory Manager of volume change
    if (window.VictoryManager) {
      window.VictoryManager.setMusicVolume(volume);
    }
  });
  
  // Set initial volume for VictoryManager
  const initialVolume = volumeSlider.value / 100;
  if (window.VictoryManager && window.VictoryManager.setMusicVolume) {
    window.VictoryManager.setMusicVolume(initialVolume);
  }

  restartBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to restart the game?')) {
      location.reload();
    }
  });

  rulesBtn.addEventListener('click', () => {
    show(rulesPanel);
  });

  closeRules.addEventListener('click', () => {
    hide(rulesPanel);
  });

  endGameBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to end the game and return to the editor?')) {
      window.location.href = '../../index.html';
    }
  });

  // Initialize
  initGame();
})();