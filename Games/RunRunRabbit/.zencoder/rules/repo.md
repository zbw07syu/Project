# RunRunRabbit Repository Metadata

- **Root**: /Users/apple/Desktop/My games/RunRunRabbit
- **Primary files**:
  - index.html — game UI and modals (multiplayer, human teams, player selection, victory points, rules panel)
  - style.css — layout/styles, buttons, modal classes, scoreboard
  - game.js — game logic: setup, PSS flow, dice queue, AI autoplay, movement, win/respawn, audio, drawing
  - images/* — sprites and board textures
  - audio files: peter-and-the-wolf-chiptune.mp3, PSS.mp3, dice.wav, cheer.wav, meh.mp3, carrotappears.wav, carrotcollected.wav, wearethechampionschiptune.mp3
  - fonts/Bangers-Regular.ttf — display font for UI

- **Game overview**:
  - Grid-based board (8x8) with coordinate margins and safety zone; rabbits must enter safety through door tiles.
  - Players: wolf + rabbits (rabbit or red/blue/black depending on team count)
  - Turn order determined by PSS. Losers answer questions; then dice phase runs wolf first, then rabbits.
  - Carrots spawn periodically; collecting gives points. Water tiles block movement.

- **Key state in game.js**:
  - Player objects: `rabbit`, `redRabbit`, `blueRabbit`, `blackRabbit`, `wolf`
  - Wrappers array `players`: [{ name, obj, isHuman }], and `activeKeys`
  - Human/AI selection: `numHumanTeams`, `humanTeams` Set; `applyHumanAIAssignments()` tags `players` with `isHuman`
  - PSS: `pssOrder`, `pssHuman`, `pssResolved`, `losers`, `currentLoserIndex`
  - Dice/movement: `diceQueue`, `currentPlayer`, `stepsRemaining`, `isDiceTurn`
  - Scoring: `rabbitWins`, `redRabbitWins`, `blueRabbitWins`, `blackRabbitWins`, `wolfWins`, `victoryPoints`

- **Important flows**:
  - PSS: `startPSSRound()` -> human/AI chooser -> `handlePSSMove()` -> loser Q&A via `askNextLoserQuestion()`/`showNextStep()` -> `showNextOrEnd()` builds `diceQueue`
  - Dice phase: `resumeGamePhase()`/`endMovementPhase()`/`rollDiceBtn` handler coordinate rolling and movement
  - AI autoplay:
    - `maybeAutoPlayPSS()` — chooses PSS for AI, auto-advances Q&A for AI losers (with delays)
    - `maybeAutoRollIfAI(nextPlayer)` — rolls automatically, chooses a square, moves, and proceeds

- **AI heuristics**:
  - Rabbits: collect carrot if reachable; else enter safety; else maximize distance from wolf while trending toward doors.
  - Wolf: capture immediately if reachable; else minimize distance to nearest rabbit.

- **Known UX considerations**:
  - Ensure buttons disabled during AI turns
  - Play/pause background and victory music appropriately to avoid overlap

- **Open follow-ups**:
  - Improve AI pathing around water/choke points
  - Optional visual “AI is thinking…” cue
  - Unit-like tests for reachability/AI picks