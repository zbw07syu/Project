/**
 * Snake in a Box - Team-based tile uncovering game
 * Find the snake's head and tail hidden in a grid
 */

(function() {
  'use strict';

  // DOM Elements
  const gridEl = document.getElementById('grid');
  const message1El = document.getElementById('message1');
  const message2El = document.getElementById('message2');
  const message3El = document.getElementById('message3');
  const scoresEl = document.getElementById('scores');
  const bgMusic = document.getElementById('bgMusic');
  const diceSfx = document.getElementById('diceSfx');
  const muteBtn = document.getElementById('muteBtn');
  const restartBtn = document.getElementById('restartBtn');
  const rulesBtn = document.getElementById('rulesBtn');
  const teamCountModal = document.getElementById('teamCountModal');
  const humanTeamsModal = document.getElementById('humanTeamsModal');
  const humanTeamOptions = document.getElementById('humanTeamOptions');
  const teamSelectModal = document.getElementById('teamSelectModal');
  const teamSelectMsg = document.getElementById('teamSelectMsg');
  const teamOptions = document.getElementById('teamOptions');
  const teamConfirmBtn = document.getElementById('teamConfirmBtn');
  const rulesPanel = document.getElementById('rulesPanel');
  const closeRules = document.getElementById('closeRules');

  // Game State
  let teams = []; // [{ name, color, score, roll, isAI }]
  let gridSize = 5; // 5x5 for 2 teams, 6x6 for 3, 7x7 for 4
  let grid = []; // 2D array of tiles
  let snakeHead = null; // {row, col}
  let snakeTail = null; // {row, col}
  let snakePath = []; // Array of {row, col, type} for the snake body
  let currentTurnIndex = 0;
  let turnOrder = []; // Sorted team indices by dice roll
  let gameActive = false;
  let tilesEnabled = false; // Track if tiles can be clicked
  let headFound = false;
  let tailFound = false;
  let isMuted = false;
  let payload = null; // Question list
  let usedQuestions = new Set();
  
  // AI State
  let numTeams = 2;
  let numHumanTeams = 0;
  let humanTeams = new Set(); // Set of team indices that are human-controlled
  let aiActionInProgress = false;

  // Team colors
  const teamColors = ['red', 'blue', 'green', 'yellow'];
  const teamNames = ['Team 1', 'Team 2', 'Team 3', 'Team 4'];

  // Initialize
  function init() {
    parsePayloadFromHash();
    setupEventListeners();
    showModal(teamCountModal);
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
            questions: obj.questions.filter(q => q && q.type)
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse payload:', e);
    }
  }

  function setupEventListeners() {
    // Team count selection
    document.querySelectorAll('.teamCountBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        numTeams = parseInt(btn.dataset.teams);
        hideModal(teamCountModal);
        showHumanTeamsModal();
      });
    });

    // Control buttons
    muteBtn.addEventListener('click', toggleMute);
    restartBtn.addEventListener('click', () => location.reload());
    rulesBtn.addEventListener('click', () => showModal(rulesPanel));
    closeRules.addEventListener('click', () => hideModal(rulesPanel));
  }

  function showHumanTeamsModal() {
    humanTeamOptions.innerHTML = '';
    // 1..numTeams options (at least 1 human team required)
    for (let i = 1; i <= numTeams; i++) {
      const btn = document.createElement('button');
      btn.className = 'vpBtn';
      btn.dataset.count = String(i);
      btn.textContent = String(i);
      btn.addEventListener('click', () => {
        numHumanTeams = i;
        humanTeams.clear();
        hideModal(humanTeamsModal);
        if (numHumanTeams === numTeams) {
          // All human - skip team selection
          initTeams(numTeams);
          startGame();
        } else {
          // Mixed - show team selection
          showTeamSelectModal();
        }
      });
      humanTeamOptions.appendChild(btn);
    }
    showModal(humanTeamsModal);
  }

  function showTeamSelectModal() {
    teamOptions.innerHTML = '';
    teamConfirmBtn.disabled = true;

    teamSelectMsg.textContent = `Select ${numHumanTeams} team(s) to be human-controlled`;

    for (let i = 0; i < numTeams; i++) {
      const row = document.createElement('label');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = i;
      cb.addEventListener('change', () => {
        if (cb.checked) {
          humanTeams.add(i);
        } else {
          humanTeams.delete(i);
        }
        teamConfirmBtn.disabled = humanTeams.size !== numHumanTeams;
      });
      
      const span = document.createElement('span');
      span.textContent = teamNames[i];
      row.appendChild(cb);
      row.appendChild(span);
      teamOptions.appendChild(row);
    }

    teamConfirmBtn.onclick = () => {
      if (humanTeams.size !== numHumanTeams) return;
      hideModal(teamSelectModal);
      initTeams(numTeams);
      startGame();
    };

    showModal(teamSelectModal);
  }

  function initTeams(numTeams) {
    teams = [];
    gridSize = numTeams === 2 ? 5 : numTeams === 3 ? 6 : 7;
    
    for (let i = 0; i < numTeams; i++) {
      const isAI = numHumanTeams === 0 ? true : 
                   numHumanTeams === numTeams ? false : 
                   !humanTeams.has(i);
      
      teams.push({
        name: teamNames[i],
        color: teamColors[i],
        score: 0,
        roll: 0,
        isAI: isAI
      });
    }
  }

  function isTeamAI(team) {
    return team && team.isAI === true;
  }

  function startGame() {
    gameActive = true;
    generateSnake();
    createGrid();
    updateScoreboard();
    playMusic();
    startTurn();
  }

  function generateRandomHamiltonianPath(timeoutMs) {
    // Generate a random Hamiltonian PATH (NOT a cycle) using randomized DFS with timeout
    // A path visits all tiles exactly once, but the last tile does NOT need to be adjacent to the first
    const totalTiles = gridSize * gridSize;
    const visited = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    const path = [];
    const startTime = Date.now();
    
    // Pick a random starting position (prefer non-corner positions)
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: gridSize - 1 },
      { row: gridSize - 1, col: 0 },
      { row: gridSize - 1, col: gridSize - 1 }
    ];
    
    let startRow, startCol;
    let attempts = 0;
    do {
      startRow = Math.floor(Math.random() * gridSize);
      startCol = Math.floor(Math.random() * gridSize);
      attempts++;
    } while (attempts < 10 && corners.some(c => c.row === startRow && c.col === startCol));
    
    // Try to build a path using DFS
    function dfs(row, col) {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        return false;
      }
      
      // Mark as visited and add to path
      visited[row][col] = true;
      path.push({ row, col });
      
      // If we've visited all tiles, we found a Hamiltonian path!
      if (path.length === totalTiles) {
        return true;
      }
      
      // Get neighbors in random order
      const neighbors = [
        { row: row - 1, col: col }, // up
        { row: row + 1, col: col }, // down
        { row: row, col: col - 1 }, // left
        { row: row, col: col + 1 }  // right
      ];
      
      // Shuffle neighbors for randomness
      for (let i = neighbors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
      }
      
      // Try each neighbor
      for (const neighbor of neighbors) {
        const { row: nRow, col: nCol } = neighbor;
        
        // Check if neighbor is valid and unvisited
        if (nRow >= 0 && nRow < gridSize && nCol >= 0 && nCol < gridSize && !visited[nRow][nCol]) {
          if (dfs(nRow, nCol)) {
            return true; // Found a complete path
          }
        }
      }
      
      // Backtrack
      visited[row][col] = false;
      path.pop();
      return false;
    }
    
    // Try to find a path
    if (dfs(startRow, startCol)) {
      return path;
    }
    
    return []; // Failed to find a path
  }
  
  function generateZigzagPath() {
    // Generate a zigzag pattern that forms a cycle
    // For a cycle, we need the last tile to be adjacent to the first tile
    const path = [];
    
    // Simple zigzag that forms a cycle:
    // Start at (0,0), go right across row 0, then down and left across row 1, etc.
    // This creates a snake pattern that ends adjacent to the start
    
    // For even grid sizes, standard zigzag works if we start at (0,0) and end at (0,1)
    // For odd grid sizes, we need to adjust
    
    // Standard zigzag from top-left
    for (let row = 0; row < gridSize; row++) {
      if (row % 2 === 0) {
        // Even rows: go right
        for (let col = 0; col < gridSize; col++) {
          path.push({ row, col });
        }
      } else {
        // Odd rows: go left
        for (let col = gridSize - 1; col >= 0; col--) {
          path.push({ row, col });
        }
      }
    }
    
    // Check if this forms a cycle
    const first = path[0];
    const last = path[path.length - 1];
    const rowDiff = Math.abs(last.row - first.row);
    const colDiff = Math.abs(last.col - first.col);
    
    // If not a cycle, we need to adjust
    // For odd gridSize, last tile is at (gridSize-1, gridSize-1), first is at (0,0) - not adjacent
    // For even gridSize, last tile is at (gridSize-1, 0), first is at (0,0) - adjacent if gridSize==2, not otherwise
    
    if (rowDiff + colDiff !== 1) {
      console.warn('⚠️ Standard zigzag does not form a cycle, using spiral pattern instead');
      // Use a spiral pattern that guarantees a cycle
      return generateSpiralCycle();
    }
    
    return path;
  }
  
  function generateSpiralCycle() {
    // Generate a spiral pattern that forms a cycle
    // This is a fallback that always works
    const path = [];
    const visited = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    
    let row = 0, col = 0;
    let dr = 0, dc = 1; // Start moving right
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      path.push({ row, col });
      visited[row][col] = true;
      
      // Try to continue in current direction
      const nextRow = row + dr;
      const nextCol = col + dc;
      
      // Check if we need to turn (hit boundary or visited cell)
      if (nextRow < 0 || nextRow >= gridSize || nextCol < 0 || nextCol >= gridSize || visited[nextRow][nextCol]) {
        // Turn right (clockwise)
        if (dr === 0 && dc === 1) { dr = 1; dc = 0; }       // right -> down
        else if (dr === 1 && dc === 0) { dr = 0; dc = -1; } // down -> left
        else if (dr === 0 && dc === -1) { dr = -1; dc = 0; }// left -> up
        else if (dr === -1 && dc === 0) { dr = 0; dc = 1; } // up -> right
      }
      
      row += dr;
      col += dc;
    }
    
    // Spiral doesn't naturally form a cycle, so we need to use zigzag as best effort
    // Actually, let's just return the zigzag and accept it's not a cycle
    // The reordering logic will need to handle non-cycles
    console.warn('⚠️ Spiral pattern does not form a cycle, returning standard zigzag');
    
    // Return simple zigzag
    const zigzag = [];
    for (let row = 0; row < gridSize; row++) {
      if (row % 2 === 0) {
        for (let col = 0; col < gridSize; col++) {
          zigzag.push({ row, col });
        }
      } else {
        for (let col = gridSize - 1; col >= 0; col--) {
          zigzag.push({ row, col });
        }
      }
    }
    return zigzag;
  }

  function validatePathConnectivity(path) {
    // Validate that consecutive tiles in the path are actually adjacent in the grid
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      
      const rowDiff = Math.abs(curr.row - prev.row);
      const colDiff = Math.abs(curr.col - prev.col);
      
      // Tiles must be exactly 1 step apart (adjacent)
      if (rowDiff + colDiff !== 1) {
        console.error(`❌ Path connectivity error at index ${i}: (${prev.row},${prev.col}) → (${curr.row},${curr.col}) are not adjacent!`);
        return false;
      }
    }
    
    // Validate all tiles are unique (no duplicates)
    const visited = new Set();
    for (let i = 0; i < path.length; i++) {
      const key = `${path[i].row},${path[i].col}`;
      if (visited.has(key)) {
        console.error(`❌ Duplicate tile in path at index ${i}: (${path[i].row},${path[i].col})`);
        return false;
      }
      visited.add(key);
    }
    
    // Note: We don't require the path to be a cycle anymore
    // The path can be either a cycle or a linear path
    
    return true;
  }
  
  function validateSpriteLogic(path) {
    // After sprites are assigned, validate that the visual representation makes sense
    // This checks if adjacent grid tiles that are NOT consecutive in path have compatible sprites
    
    // Create a map of grid positions to path segments
    const gridMap = {};
    path.forEach((seg, idx) => {
      const key = `${seg.row},${seg.col}`;
      gridMap[key] = { ...seg, pathIndex: idx };
    });
    
    // Helper to get which sides a sprite connects
    function getConnectedSides(sprite) {
      if (sprite === 'body-horizontal') return ['left', 'right'];
      if (sprite === 'body-vertical') return ['top', 'bottom'];
      if (sprite === 'corner-1') return ['left', 'top'];
      if (sprite === 'corner-2') return ['left', 'bottom'];
      if (sprite === 'corner-3') return ['bottom', 'right'];
      if (sprite === 'corner-4') return ['top', 'right'];
      if (sprite && sprite.startsWith('head-')) {
        // Head sprites point in a direction, neck is opposite
        if (sprite === 'head-up') return ['bottom'];
        if (sprite === 'head-down') return ['top'];
        if (sprite === 'head-left') return ['right'];
        if (sprite === 'head-right') return ['left'];
      }
      if (sprite && sprite.startsWith('tail-')) {
        // Tail sprites point in a direction, connection is opposite
        if (sprite === 'tail-up') return ['bottom'];
        if (sprite === 'tail-down') return ['top'];
        if (sprite === 'tail-left') return ['right'];
        if (sprite === 'tail-right') return ['left'];
      }
      return [];
    }
    
    // Check each tile's sprite against its grid neighbors
    let errors = 0;
    for (let i = 0; i < path.length; i++) {
      const segKey = `${path[i].row},${path[i].col}`;
      const seg = gridMap[segKey];
      const connectedSides = getConnectedSides(seg.sprite);
      
      // Check each side this sprite connects to
      const neighbors = {
        'top': { row: seg.row - 1, col: seg.col },
        'bottom': { row: seg.row + 1, col: seg.col },
        'left': { row: seg.row, col: seg.col - 1 },
        'right': { row: seg.row, col: seg.col + 1 }
      };
      
      for (const [side, neighborPos] of Object.entries(neighbors)) {
        // Skip if neighbor is out of bounds
        if (neighborPos.row < 0 || neighborPos.row >= gridSize || 
            neighborPos.col < 0 || neighborPos.col >= gridSize) {
          continue;
        }
        
        const neighborKey = `${neighborPos.row},${neighborPos.col}`;
        const neighbor = gridMap[neighborKey];
        
        if (!neighbor) continue; // Shouldn't happen in Hamiltonian path
        
        // Check if this sprite connects to this side
        const spriteConnectsToSide = connectedSides.includes(side);
        
        // Check if they're consecutive in the path
        const areConsecutive = Math.abs(seg.pathIndex - neighbor.pathIndex) === 1;
        
        // They should match: if consecutive in path, sprite should connect; if not consecutive, sprite should NOT connect
        if (areConsecutive && !spriteConnectsToSide) {
          console.error(`❌ Sprite logic error at [${i}] (${seg.row},${seg.col}): sprite "${seg.sprite}" doesn't connect to ${side}, but path neighbor [${neighbor.pathIndex}] is there!`);
          errors++;
        }
        
        // Also check the reverse: if sprite connects to a side, that neighbor should be consecutive in path
        if (spriteConnectsToSide && !areConsecutive) {
          console.error(`❌ Sprite logic error at [${i}] (${seg.row},${seg.col}): sprite "${seg.sprite}" connects to ${side}, but grid neighbor at (${neighborPos.row},${neighborPos.col}) is NOT consecutive in path (indices ${seg.pathIndex} and ${neighbor.pathIndex})`);
          errors++;
        }
      }
    }
    
    if (errors > 0) {
      console.error(`❌ Found ${errors} sprite logic errors!`);
      return false;
    }
    
    console.log('✓ All sprite assignments are logically consistent');
    return true;
  }
  
  function validateCornerPieces(path) {
    // Check if corner tiles in the path will have corner/bend pieces (not straight pieces)
    // A corner tile can ONLY connect to its 2 adjacent neighbors (not opposite sides)
    const corners = [
      { row: 0, col: 0 },                      // Top-left
      { row: 0, col: gridSize - 1 },           // Top-right
      { row: gridSize - 1, col: 0 },           // Bottom-left
      { row: gridSize - 1, col: gridSize - 1 } // Bottom-right
    ];
    
    for (const corner of corners) {
      // Find this corner tile in the path
      const index = path.findIndex(tile => tile.row === corner.row && tile.col === corner.col);
      if (index === -1) {
        console.error(`Corner (${corner.row},${corner.col}) not found in path!`);
        return false;
      }
      
      // Get adjacent tiles in the path
      const prev = index > 0 ? path[index - 1] : null;
      const next = index < path.length - 1 ? path[index + 1] : null;
      
      if (!prev || !next) {
        console.error(`Corner (${corner.row},${corner.col}) is at path endpoint - invalid!`);
        return false;
      }
      
      // Helper function to determine which side a neighbor is on
      const getSide = (from, to) => {
        if (to.row < from.row) return 'top';
        if (to.row > from.row) return 'bottom';
        if (to.col < from.col) return 'left';
        if (to.col > from.col) return 'right';
        return 'none';
      };
      
      // Determine which sides this corner connects to
      const side1 = getSide(corner, prev);
      const side2 = getSide(corner, next);
      const sides = [side1, side2].sort();
      
      // Check if it's a straight piece (invalid for corners)
      // Straight pieces connect opposite sides: top-bottom or left-right
      if ((sides[0] === 'bottom' && sides[1] === 'top') || 
          (sides[0] === 'left' && sides[1] === 'right')) {
        console.warn(`❌ Corner (${corner.row},${corner.col}) has STRAIGHT piece: ${sides.join('-')} - INVALID!`);
        return false;
      }
      
      // If we get here, it's a corner piece (connects two adjacent sides)
      console.log(`✓ Corner (${corner.row},${corner.col}) has valid corner piece: ${sides.join('-')}`);
    }
    
    return true;
  }

  function generateSnake() {
    // Generate a snake path that fills ALL tiles using a randomized algorithm
    const totalTiles = gridSize * gridSize;
    snakePath = [];
    
    // Try to generate a random Hamiltonian path using DFS
    // Keep trying until we get a path with valid corner pieces
    let attempts = 0;
    const maxAttempts = 50; // More attempts to find valid path
    const timeoutPerAttempt = 200; // 200ms per attempt
    
    while (attempts < maxAttempts) {
      attempts++;
      const candidatePath = generateRandomHamiltonianPath(timeoutPerAttempt);
      
      if (candidatePath.length === totalTiles) {
        // Validate path connectivity first
        if (!validatePathConnectivity(candidatePath)) {
          console.error(`Attempt ${attempts}: Path has connectivity errors, retrying...`);
          continue;
        }
        
        // Check if corners have valid pieces
        if (validateCornerPieces(candidatePath)) {
          snakePath = candidatePath;
          console.log(`✓ Generated valid random Hamiltonian path on attempt ${attempts}`);
          break;
        } else {
          console.log(`Attempt ${attempts}: Path has invalid corner pieces, retrying...`);
        }
      }
    }
    
    // Fallback to zigzag if random generation failed
    if (snakePath.length !== totalTiles) {
      console.log('Random generation failed, using zigzag fallback');
      snakePath = generateZigzagPath();
      
      // Validate zigzag path connectivity
      if (!validatePathConnectivity(snakePath)) {
        console.error('⚠️ CRITICAL: Zigzag path has connectivity errors!');
      }
      
      // Validate zigzag path corner pieces
      if (!validateCornerPieces(snakePath)) {
        console.error('⚠️ WARNING: Even zigzag path has invalid corner pieces!');
      }
    }
    
    // Define corner positions to avoid for HEAD and TAIL only
    // Body segments CAN and MUST be in corners (they'll be corner/bend pieces)
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: gridSize - 1 },
      { row: gridSize - 1, col: 0 },
      { row: gridSize - 1, col: gridSize - 1 }
    ];
    
    const isCorner = (tile) => corners.some(c => c.row === tile.row && c.col === tile.col);
    
    // Check if the path is a cycle (last tile adjacent to first tile)
    const first = snakePath[0];
    const last = snakePath[snakePath.length - 1];
    const isCycle = Math.abs(last.row - first.row) + Math.abs(last.col - first.col) === 1;
    
    console.log(`Path is ${isCycle ? 'a cycle (unexpected!)' : 'NOT a cycle (expected)'}`);
    
    // For a linear path, choose which end should be the head
    // Check both endpoints and pick the better one (prefer non-corner positions)
    const startTile = snakePath[0];
    const endTile = snakePath[snakePath.length - 1];
    const startIsCorner = isCorner(startTile);
    const endIsCorner = isCorner(endTile);
    
    console.log(`Start tile (${startTile.row},${startTile.col}) is ${startIsCorner ? 'a corner' : 'not a corner'}`);
    console.log(`End tile (${endTile.row},${endTile.col}) is ${endIsCorner ? 'a corner' : 'not a corner'}`);
    
    let shouldReverse = false;
    
    if (!startIsCorner && !endIsCorner) {
      // Both ends are valid, pick randomly
      shouldReverse = Math.random() < 0.5;
      console.log(`Both endpoints are non-corner, randomly ${shouldReverse ? 'reversing' : 'keeping'} path`);
    } else if (!startIsCorner) {
      // Start is better, keep as is
      shouldReverse = false;
      console.log(`Start is non-corner, keeping path as is`);
    } else if (!endIsCorner) {
      // End is better, reverse the path
      shouldReverse = true;
      console.log(`End is non-corner, reversing path`);
    } else {
      // Both are corners, keep start as head
      shouldReverse = false;
      console.warn(`Both endpoints are corners, keeping start as head`);
    }
    
    // Reverse if needed
    if (shouldReverse) {
      snakePath = snakePath.reverse();
    }
    
    // Set head and tail
    snakeHead = { row: snakePath[0].row, col: snakePath[0].col };
    snakeTail = { row: snakePath[snakePath.length - 1].row, col: snakePath[snakePath.length - 1].col };
    
    console.log(`Snake generated with ${snakePath.length} segments (target: ${totalTiles})`);
    console.log(`Head at (${snakeHead.row}, ${snakeHead.col}), Tail at (${snakeTail.row}, ${snakeTail.col})`);
    
    // Verify head and tail are not in corners
    const headIsCorner = isCorner(snakeHead);
    const tailIsCorner = isCorner(snakeTail);
    if (headIsCorner) {
      console.warn('⚠️ WARNING: Head is in a corner!');
    }
    if (tailIsCorner) {
      console.warn('⚠️ WARNING: Tail is in a corner!');
    }
    if (!headIsCorner && !tailIsCorner) {
      console.log('✓ Success: Neither head nor tail is in a corner');
    }
    
    // Assign sprite types to each segment based on direction
    assignSnakeSprites();
    
    // Validate sprite logic
    if (!validateSpriteLogic(snakePath)) {
      console.error('⚠️ CRITICAL: Sprite assignments have logic errors!');
    }
    
    // Log sprite distribution for debugging
    const spriteCount = {};
    snakePath.forEach(seg => {
      spriteCount[seg.sprite] = (spriteCount[seg.sprite] || 0) + 1;
    });
    console.log('Sprite distribution:', spriteCount);
    
    // Verify connections are correct - detailed logging
    console.log('=== VERIFYING SNAKE CONNECTIONS ===');
    let connectionErrors = 0;
    
    for (let i = 0; i < snakePath.length; i++) {
      const current = snakePath[i];
      const prev = i > 0 ? snakePath[i - 1] : null;
      const next = i < snakePath.length - 1 ? snakePath[i + 1] : null;
      
      let prevSide = prev ? getSideToConnect(current, prev) : 'none';
      let nextSide = next ? getSideToConnect(current, next) : 'none';
      
      // Determine what sprite SHOULD be based on connections
      let expectedSprite = '';
      if (i === 0) {
        expectedSprite = 'head-*';
      } else if (i === snakePath.length - 1) {
        expectedSprite = 'tail-*';
      } else {
        const sides = [prevSide, nextSide].sort();
        const sideKey = sides.join('-');
        if (sideKey === 'bottom-top') expectedSprite = 'body-vertical';
        else if (sideKey === 'left-right') expectedSprite = 'body-horizontal';
        else expectedSprite = 'corner-*';
      }
      
      console.log(`[${i}] (${current.row},${current.col}) sprite="${current.sprite}" connects: ${prevSide} + ${nextSide} (expected: ${expectedSprite})`);
      
      // Validate sprite matches connections
      if (i > 0 && i < snakePath.length - 1) {
        const sides = [prevSide, nextSide].sort();
        const sideKey = sides.join('-');
        
        if (sideKey === 'bottom-top' && current.sprite !== 'body-vertical') {
          console.error(`❌ ERROR at [${i}] (${current.row},${current.col}): Should be body-vertical but is ${current.sprite}`);
          connectionErrors++;
        } else if (sideKey === 'left-right' && current.sprite !== 'body-horizontal') {
          console.error(`❌ ERROR at [${i}] (${current.row},${current.col}): Should be body-horizontal but is ${current.sprite}`);
          connectionErrors++;
        }
      }
      
      // Check for adjacent tiles with same sprite (potential bug)
      if (i > 0 && current.sprite === prev.sprite && current.sprite.startsWith('corner')) {
        console.warn(`⚠️ WARNING: Adjacent tiles ${i-1} and ${i} both have sprite "${current.sprite}"`);
      }
    }
    
    if (connectionErrors > 0) {
      console.error(`❌ FOUND ${connectionErrors} CONNECTION ERRORS!`);
    } else {
      console.log('✓ All sprite connections are valid');
    }
    console.log('=== END VERIFICATION ===');
    
    // Initialize grid
    grid = [];
    for (let r = 0; r < gridSize; r++) {
      grid[r] = [];
      for (let c = 0; c < gridSize; c++) {
        grid[r][c] = {
          revealed: false,
          type: 'empty',
          sprite: null
        };
      }
    }
    
    // Place snake on grid
    snakePath.forEach(segment => {
      grid[segment.row][segment.col].type = segment.type;
      grid[segment.row][segment.col].sprite = segment.sprite;
    });
    
    // Verify all tiles are filled (should be 100% with new algorithm)
    let emptyCount = 0;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c].type === 'empty') {
          emptyCount++;
          console.warn(`Empty tile found at (${r},${c})`);
        }
      }
    }
    if (emptyCount > 0) {
      console.error(`${emptyCount} empty tiles remaining! Snake generation incomplete.`);
    }
  }
  
  // Transform position for variety (rotate/flip)
  function transformPosition(pos, transform) {
    let { row, col } = pos;
    const size = gridSize - 1;
    
    switch (transform) {
      case 0: return { row, col }; // no change
      case 1: return { row: col, col: row }; // transpose
      case 2: return { row: size - row, col }; // flip vertical
      case 3: return { row, col: size - col }; // flip horizontal
      case 4: return { row: size - row, col: size - col }; // rotate 180
      case 5: return { row: col, col: size - row }; // rotate 90 clockwise
      case 6: return { row: size - col, col: row }; // rotate 90 counter-clockwise
      case 7: return { row: size - col, col: size - row }; // transpose + flip
      default: return { row, col };
    }
  }
  
  function assignSnakeSprites() {
    // Assign the correct sprite to each segment based on which sides need connections
    for (let i = 0; i < snakePath.length; i++) {
      const current = snakePath[i];
      const prev = i > 0 ? snakePath[i - 1] : null;
      const next = i < snakePath.length - 1 ? snakePath[i + 1] : null;
      
      if (i === 0) {
        // HEAD - neck connects to the next segment
        // Determine which side of the head tile needs the neck connection
        current.type = 'head';
        if (next) {
          const neckSide = getSideToConnect(current, next);
          // Head down: neck connects top (next is above)
          // Head left: neck connects right (next is to the right)
          // Head right: neck connects left (next is to the left)
          // Head top: neck connects bottom (next is below)
          if (neckSide === 'top') current.sprite = 'head-down';
          else if (neckSide === 'bottom') current.sprite = 'head-up';
          else if (neckSide === 'left') current.sprite = 'head-right';
          else if (neckSide === 'right') current.sprite = 'head-left';
        } else {
          current.sprite = 'head-right'; // default
        }
      } else if (i === snakePath.length - 1) {
        // TAIL - connects to the previous segment
        // Determine which side of the tail tile needs the connection
        current.type = 'tail';
        if (prev) {
          const connectSide = getSideToConnect(current, prev);
          // Tail pointing down: connects top (prev is above)
          // Tail pointing left: connects right (prev is to the right)
          // Tail pointing right: connects left (prev is to the left)
          // Tail pointing up: connects bottom (prev is below)
          if (connectSide === 'top') current.sprite = 'tail-down';
          else if (connectSide === 'bottom') current.sprite = 'tail-up';
          else if (connectSide === 'left') current.sprite = 'tail-right';
          else if (connectSide === 'right') current.sprite = 'tail-left';
        } else {
          current.sprite = 'tail-right'; // default
        }
      } else {
        // BODY - connects to both prev and next segments
        current.type = 'body';
        
        // Determine which sides of this tile need connections
        const side1 = getSideToConnect(current, prev);
        const side2 = getSideToConnect(current, next);
        
        // Check for invalid connections (non-adjacent tiles in path)
        if (side1 === 'none' || side2 === 'none') {
          console.error(`❌ CRITICAL: Non-adjacent tiles in path at index ${i}!`);
          console.error(`  Current: (${current.row},${current.col})`);
          console.error(`  Prev: (${prev.row},${prev.col}) - side: ${side1}`);
          console.error(`  Next: (${next.row},${next.col}) - side: ${side2}`);
          current.sprite = 'body-horizontal'; // fallback
          continue;
        }
        
        // Check if it's a straight piece or corner
        const sides = [side1, side2].sort();
        const sideKey = sides.join('-');
        
        if (sideKey === 'bottom-top') {
          current.sprite = 'body-vertical'; // connects top and bottom
        } else if (sideKey === 'left-right') {
          current.sprite = 'body-horizontal'; // connects left and right
        } else {
          // It's a corner piece
          current.sprite = getCornerSprite(side1, side2);
        }
      }
    }
  }
  
  function getSideToConnect(from, to) {
    // Returns which side of the 'from' tile needs a connection to reach 'to'
    // Only returns a valid direction if tiles are actually adjacent (differ by 1 in exactly one dimension)
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    
    // Check if tiles are adjacent (exactly 1 step away in one direction)
    if (rowDiff + colDiff !== 1) {
      console.warn(`getSideToConnect: tiles (${from.row},${from.col}) and (${to.row},${to.col}) are not adjacent!`);
      return 'none';
    }
    
    if (to.row < from.row) return 'top';    // neighbor is above
    if (to.row > from.row) return 'bottom'; // neighbor is below
    if (to.col < from.col) return 'left';   // neighbor is to the left
    if (to.col > from.col) return 'right';  // neighbor is to the right
    return 'none';
  }

  function getDirection(from, to) {
    if (to.row < from.row) return 'up';
    if (to.row > from.row) return 'down';
    if (to.col < from.col) return 'left';
    if (to.col > from.col) return 'right';
    return 'none';
  }
  
  function getCornerSprite(side1, side2) {
    // Corner sprites are named by which two SIDES they connect
    // Right angle 1: connects left and top
    // Right angle 2: connects left and bottom
    // Right angle 3: connects bottom and right
    // Right angle 4: connects top and right
    
    // side1 and side2 are the sides of the tile that need connections
    
    // Create a sorted key (order doesn't matter for matching)
    const sides = [side1, side2].sort().join('-');
    
    const cornerMap = {
      'left-top': 'corner-1',      // Connects left and top
      'bottom-left': 'corner-2',   // Connects left and bottom
      'bottom-right': 'corner-3',  // Connects bottom and right
      'right-top': 'corner-4'      // Connects top and right
    };
    
    const result = cornerMap[sides];
    if (!result) {
      console.warn(`Unknown corner combination: ${sides} (${side1}, ${side2})`);
      return 'body-horizontal'; // fallback
    }
    return result;
  }

  function createGrid() {
    gridEl.innerHTML = '';
    
    // Dynamic tile size based on grid size to fit on screen
    // 2-player (5x5): 64px, 3-player (6x6): 54px, 4-player (7x7): 46px
    const tileSize = gridSize === 5 ? 64 : gridSize === 6 ? 54 : 46;
    
    gridEl.style.gridTemplateColumns = `repeat(${gridSize}, ${tileSize}px)`;
    gridEl.style.gridTemplateRows = `repeat(${gridSize}, ${tileSize}px)`;
    
    // Create coordinate labels
    createCoordinateLabels(tileSize);
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const tile = document.createElement('div');
        tile.className = 'grid-tile covered';
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.style.width = `${tileSize}px`;
        tile.style.height = `${tileSize}px`;
        tile.addEventListener('click', () => handleTileClick(row, col));
        gridEl.appendChild(tile);
      }
    }
  }

  function createCoordinateLabels(tileSize) {
    const columnLabelsEl = document.getElementById('columnLabels');
    const rowLabelsEl = document.getElementById('rowLabels');
    
    // Clear existing labels
    columnLabelsEl.innerHTML = '';
    rowLabelsEl.innerHTML = '';
    
    // Create column labels (A, B, C, ...)
    for (let col = 0; col < gridSize; col++) {
      const label = document.createElement('span');
      label.textContent = String.fromCharCode(65 + col); // A=65 in ASCII
      label.style.width = `${tileSize}px`;
      columnLabelsEl.appendChild(label);
    }
    
    // Create row labels (1, 2, 3, ...)
    for (let row = 0; row < gridSize; row++) {
      const label = document.createElement('span');
      label.textContent = row + 1;
      label.style.height = `${tileSize}px`;
      rowLabelsEl.appendChild(label);
    }
  }

  function handleTileClick(row, col, isAIAction = false) {
    if (!gameActive) return;
    if (!tilesEnabled && !isAIAction) return; // Don't allow clicks until dice is rolled (unless AI)
    if (grid[row][col].revealed) return;
    
    // Reveal tile
    grid[row][col].revealed = true;
    const tile = getTileElement(row, col);
    tile.classList.remove('covered');
    
    // Add sprite class for rendering
    const sprite = grid[row][col].sprite;
    if (sprite) {
      tile.classList.add('revealed', sprite);
      tile.dataset.sprite = sprite;
    }
    
    // Check what was revealed
    const type = grid[row][col].type;
    const currentTeam = teams[turnOrder[currentTurnIndex]];
    
    if (type === 'head') {
      headFound = true;
      currentTeam.score++;
      setMessage1(`${currentTeam.name} found the snake HEAD! 🐍`);
      setMessage2(`+1 point!`);
      playSound(diceSfx);
    } else if (type === 'tail') {
      tailFound = true;
      currentTeam.score++;
      setMessage1(`${currentTeam.name} found the snake TAIL! 🐍`);
      setMessage2(`+1 point!`);
      playSound(diceSfx);
    } else {
      setMessage1(`${currentTeam.name} revealed a body segment.`);
      setMessage2('');
    }
    
    updateScoreboard();
    
    // Check for game end
    if (headFound && tailFound) {
      setTimeout(() => endGame(), 1500);
    } else {
      // Next turn
      setTimeout(() => nextTurn(), 1500);
    }
  }

  function getTileElement(row, col) {
    return gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }
  
  function setTilesEnabled(enabled) {
    tilesEnabled = enabled;
    const tiles = gridEl.querySelectorAll('.grid-tile.covered');
    tiles.forEach(tile => {
      if (enabled) {
        tile.classList.remove('disabled');
      } else {
        tile.classList.add('disabled');
      }
    });
  }

  function startTurn() {
    setTilesEnabled(false); // Disable tiles until dice is rolled
    setMessage1('Rolling dice for turn order...');
    setMessage2('');
    setMessage3('');
    
    // If all teams are AI, auto-roll after a delay
    if (numHumanTeams === 0) {
      setTimeout(() => {
        rollDiceForTurnOrder();
      }, 1500);
    } else {
      // Create roll dice button for human players
      const rollBtn = document.createElement('button');
      rollBtn.id = 'rollDiceBtn';
      rollBtn.textContent = 'Roll Dice';
      rollBtn.addEventListener('click', rollDiceForTurnOrder);
      message3El.appendChild(rollBtn);
    }
  }

  function rollDiceForTurnOrder() {
    playSound(diceSfx);
    
    // Remove button
    const rollBtn = document.getElementById('rollDiceBtn');
    if (rollBtn) rollBtn.remove();
    
    // Roll dice for all teams
    teams.forEach(team => {
      team.roll = Math.floor(Math.random() * 6) + 1;
    });
    
    // Sort by roll (highest first)
    turnOrder = teams
      .map((team, index) => ({ team, index, roll: team.roll }))
      .sort((a, b) => b.roll - a.roll)
      .map(item => item.index);
    
    // Display rolls
    const rollsText = teams.map(team => `${team.name}: ${team.roll}`).join(' | ');
    setMessage1('Dice Rolls:');
    setMessage2(rollsText);
    
    // Find team with lowest roll for question - only consider human teams
    const humanTeamsList = teams.filter(team => !isTeamAI(team));
    
    if (humanTeamsList.length > 0) {
      // Find human team with lowest roll
      const lowestRollTeam = humanTeamsList.reduce((min, team) => 
        team.roll < min.roll ? team : min
      );
      
      setTimeout(() => {
        askQuestion(lowestRollTeam);
      }, 2000);
    } else {
      // No human teams, skip question phase
      setTimeout(() => startPlayerTurn(), 2000);
    }
  }

  function askQuestion(team) {
    if (!payload || !payload.questions || payload.questions.length === 0) {
      // No questions available, skip to first player's turn
      setMessage1(`${team.name} would answer a question, but none are loaded.`);
      setTimeout(() => startPlayerTurn(), 2000);
      return;
    }
    
    // Get unused question
    const availableQuestions = payload.questions.filter((q, idx) => !usedQuestions.has(idx));
    
    if (availableQuestions.length === 0) {
      // All questions used, reset
      usedQuestions.clear();
    }
    
    const questionIndex = Math.floor(Math.random() * payload.questions.length);
    usedQuestions.add(questionIndex);
    const question = payload.questions[questionIndex];
    
    // Determine question type and format
    const questionText = question.text || question.q || 'Question';
    const questionType = question.type || (question.options && question.options.length > 0 ? 'multiple' : 'single');
    const correctAnswer = question.answer || question.a || '';
    const turnIndicator = `${team.name} must answer`;
    const imagePath = question.image || null;
    
    // Show question using shared modal system
    if (questionType === 'multiple' && window.MultipleChoiceModal) {
      // Multiple choice question
      const options = question.options || [];
      
      window.MultipleChoiceModal.showModal(
        questionText,
        options,
        (selectedOption) => {
          const isCorrect = selectedOption === correctAnswer;
          if (isCorrect) {
            setMessage1(`${team.name} answered correctly! ✓`);
          } else {
            setMessage1(`${team.name} answered incorrectly. ✗`);
          }
          setTimeout(() => startPlayerTurn(), 1500);
        },
        imagePath,
        turnIndicator
      );
    } else if (questionType === 'single' && window.MultipleChoiceModal) {
      // Open-ended question - show with just a Close button (no scoring)
      const alternates = question.alts || question.alternates || [];
      
      // Create modal manually to avoid Correct/Incorrect buttons
      if (!document.getElementById('multipleChoiceModal')) {
        window.MultipleChoiceModal.createModal();
      }
      
      const modalContainer = document.getElementById('multipleChoiceModal');
      
      // Handle turn indicator
      const turnIndicatorEl = modalContainer.querySelector('.mc-modal-turn-indicator');
      if (turnIndicator) {
        turnIndicatorEl.textContent = turnIndicator;
        turnIndicatorEl.classList.add('show');
      } else {
        turnIndicatorEl.textContent = '';
        turnIndicatorEl.classList.remove('show');
      }
      
      // Handle image
      const imageEl = modalContainer.querySelector('.mc-modal-image');
      if (imagePath) {
        imageEl.innerHTML = `<img src="${imagePath}" alt="Question image" onerror="this.parentElement.classList.remove('show');">`;
        imageEl.classList.add('show');
      } else {
        imageEl.innerHTML = '';
        imageEl.classList.remove('show');
      }
      
      // Set question text
      const questionEl = modalContainer.querySelector('.mc-modal-question');
      questionEl.textContent = questionText;
      
      // Hide answer initially
      const answerEl = modalContainer.querySelector('.mc-modal-answer');
      answerEl.innerHTML = '';
      answerEl.classList.remove('show');
      
      // Create "Show Answer" button
      const optionsEl = modalContainer.querySelector('.mc-modal-options');
      optionsEl.innerHTML = '';
      
      const showAnswerBtn = document.createElement('button');
      showAnswerBtn.textContent = 'Show Answer';
      showAnswerBtn.className = 'mc-modal-option answer-btn';
      showAnswerBtn.style.cssText = 'background: linear-gradient(135deg, #4a90e2, #357abd); color: white; font-size: 18px;';
      
      showAnswerBtn.addEventListener('click', () => {
        // Build answer text with alternates
        const alt = Array.isArray(alternates) ? alternates.filter(a => a && a.trim() !== '') : [];
        const altSuffix = alt.length ? `\n(Also accepted: ${alt.join(', ')})` : '';
        const answerText = `Answer: ${correctAnswer}${altSuffix}`;
        
        // Show answer with Close button only (no Correct/Incorrect)
        window.MultipleChoiceModal.showAnswerInModal(answerText, () => {
          setMessage1(`${team.name} has seen the answer.`);
          setTimeout(() => startPlayerTurn(), 500);
        }, {
          showCorrectIncorrect: false
        });
      });
      
      optionsEl.appendChild(showAnswerBtn);
      
      // Show modal
      modalContainer.classList.add('show');
    } else {
      // Fallback if modal system not available
      setMessage1(`${team.name} must answer: ${questionText}`);
      setTimeout(() => startPlayerTurn(), 2000);
    }
  }

  function startPlayerTurn() {
    const currentTeam = teams[turnOrder[currentTurnIndex]];
    
    // Check if current team is AI
    if (isTeamAI(currentTeam)) {
      setTilesEnabled(false);
      setMessage1(`${currentTeam.name}'s turn!`);
      setMessage2('AI is selecting a tile...');
      setMessage3('');
      updateScoreboard();
      
      // AI selects a random unrevealed tile after a delay
      setTimeout(() => {
        aiSelectTile();
      }, 1500);
    } else {
      setTilesEnabled(true); // Enable tiles for player to click
      setMessage1(`${currentTeam.name}'s turn!`);
      setMessage2('Click a tile to reveal it.');
      setMessage3('');
      updateScoreboard();
    }
  }

  function aiSelectTile() {
    // Find all unrevealed tiles
    const unrevealedTiles = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (!grid[row][col].revealed) {
          unrevealedTiles.push({ row, col });
        }
      }
    }
    
    if (unrevealedTiles.length === 0) {
      // No tiles left (shouldn't happen)
      nextTurn();
      return;
    }
    
    // Select a random tile
    const randomTile = unrevealedTiles[Math.floor(Math.random() * unrevealedTiles.length)];
    handleTileClick(randomTile.row, randomTile.col, true); // Pass true to indicate AI action
  }

  function nextTurn() {
    currentTurnIndex = (currentTurnIndex + 1) % turnOrder.length;
    
    if (currentTurnIndex === 0) {
      // New round - roll dice again
      startTurn();
    } else {
      startPlayerTurn();
    }
  }

  function endGame() {
    console.log('endGame() called');
    gameActive = false;
    
    // Find winner(s)
    const maxScore = Math.max(...teams.map(t => t.score));
    const winners = teams.filter(t => t.score === maxScore);
    
    console.log('Winners:', winners);
    
    let winnerText = '';
    let winnerColor = '#FFD700'; // Default gold
    
    if (winners.length === 1) {
      winnerText = `${winners[0].name} WINS!`;
      winnerColor = getTeamColorHex(winners[0].color);
      setMessage1(`🎉 ${winners[0].name} WINS! 🎉`);
      setMessage2(`Final Score: ${winners[0].score} point${winners[0].score !== 1 ? 's' : ''}`);
    } else {
      const winnerNames = winners.map(w => w.name).join(' and ');
      winnerText = `TIE! ${winnerNames} WIN!`;
      winnerColor = '#FFD700'; // Gold for ties
      setMessage1(`🎉 TIE! ${winnerNames} WIN! 🎉`);
      setMessage2(`Final Score: ${maxScore} point${maxScore !== 1 ? 's' : ''}`);
    }
    setMessage3('');
    
    console.log('Winner text:', winnerText);
    console.log('Winner color:', winnerColor);
    
    // Stop background music before victory celebration
    try {
      if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        bgMusic.loop = false;
      }
    } catch (e) {
      console.log('Failed to stop background music:', e);
    }
    
    // Trigger victory celebration using VictoryManager
    console.log('VictoryManager available?', typeof VictoryManager !== 'undefined');
    if (typeof VictoryManager !== 'undefined') {
      console.log('Calling VictoryManager.playVictorySequence with:', {
        getMuteState: () => isMuted,
        winnerText: winnerText,
        winnerColor: winnerColor
      });
      VictoryManager.playVictorySequence({
        getMuteState: () => isMuted,
        winnerText: winnerText,
        winnerColor: winnerColor
      });
      console.log('VictoryManager.playVictorySequence called');
    } else {
      console.error('VictoryManager is not defined!');
    }
  }

  function updateScoreboard() {
    scoresEl.innerHTML = '';
    
    turnOrder.forEach((teamIndex, orderIndex) => {
      const team = teams[teamIndex];
      const li = document.createElement('li');
      li.className = `team-${team.color}`;
      const aiLabel = team.isAI ? ' (AI)' : '';
      li.textContent = `${team.name}${aiLabel}: ${team.score}`;
      
      // Highlight current turn
      if (gameActive && orderIndex === currentTurnIndex) {
        li.classList.add('current-turn');
      }
      
      scoresEl.appendChild(li);
    });
    
    // If no turn order yet, show teams in original order
    if (turnOrder.length === 0) {
      teams.forEach(team => {
        const li = document.createElement('li');
        li.className = `team-${team.color}`;
        const aiLabel = team.isAI ? ' (AI)' : '';
        li.textContent = `${team.name}${aiLabel}: ${team.score}`;
        scoresEl.appendChild(li);
      });
    }
  }

  function setMessage1(text) {
    message1El.textContent = text;
  }

  function setMessage2(text) {
    message2El.textContent = text;
  }

  function setMessage3(text) {
    message3El.textContent = text;
  }

  function getTeamColorHex(colorName) {
    const colorMap = {
      'red': '#ff6b6b',
      'blue': '#4a90e2',
      'green': '#4caf50',
      'yellow': '#ffd54a'
    };
    return colorMap[colorName] || '#FFD700'; // Default to gold
  }

  function showModal(modal) {
    modal.classList.add('show');
  }

  function hideModal(modal) {
    modal.classList.remove('show');
  }

  function playMusic() {
    if (!isMuted && bgMusic) {
      bgMusic.play().catch(e => console.log('Audio play failed:', e));
    }
  }

  function playSound(audio) {
    if (!isMuted && audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    
    // Notify Victory Manager of mute state change
    if (typeof VictoryManager !== 'undefined') {
      VictoryManager.updateMuteState(isMuted);
    }
    
    if (isMuted) {
      bgMusic.pause();
    } else {
      bgMusic.play().catch(e => console.log('Audio play failed:', e));
    }
  }

  // Start the game
  init();
})();