# Victory Sequence Fix

## Issue
The victory celebration (music and visual effects) was not playing when the game ended.

## Root Cause
The game was calling an incorrect API:
```javascript
// OLD (incorrect)
window.victoryManager.playVictory(winners[0].name, winners[0].color);
```

The correct API is `VictoryManager.playVictorySequence()` which expects an options object with:
- `getMuteState`: Function that returns current mute state
- `winnerText`: Text to display (e.g., "Team Red WINS!")
- `winnerColor`: Hex color code for the winner's team

## Changes Made

### 1. Fixed `endGame()` function (game.js lines 405-448)
**Changes:**
- Added `winnerText` and `winnerColor` variables to properly format victory data
- Added code to stop background music before victory celebration
- Replaced incorrect `window.victoryManager.playVictory()` call with correct `VictoryManager.playVictorySequence()` API
- Properly passes options object with `getMuteState`, `winnerText`, and `winnerColor`

### 2. Added `getTeamColorHex()` helper function (game.js lines 490-498)
**Purpose:** Convert team color names to hex codes for VictoryManager

**Color Mapping:**
- `red` → `#ff6b6b`
- `blue` → `#4a90e2`
- `green` → `#4caf50`
- `yellow` → `#ffd54a`
- Default → `#FFD700` (gold for ties)

### 3. Updated `toggleMute()` function (game.js lines 521-534)
**Changes:**
- Added notification to VictoryManager when mute state changes
- Ensures victory music respects mute button during celebration

## How It Works Now

### Victory Sequence Flow:
1. Game ends when both head and tail are found
2. Background music stops
3. Winner(s) determined and formatted
4. `VictoryManager.playVictorySequence()` called with:
   - Winner text (e.g., "Red Team WINS!" or "TIE! Red Team and Blue Team WIN!")
   - Winner color (hex code matching team color)
   - Mute state function
5. VictoryManager randomly selects:
   - 3 visual effects from 12 available
   - 1 music track from 12 available
6. Celebration plays with animated text overlay, confetti, and music

### Mute Integration:
- Mute button now notifies VictoryManager of state changes
- Victory music respects mute state
- If muted during game, victory celebration will also be muted

## Testing Checklist

✅ **Victory Celebration:**
- [ ] Play game to completion
- [ ] Verify victory music plays
- [ ] Verify visual effects appear (confetti, strobe, sparkles, etc.)
- [ ] Verify animated winner text overlay appears
- [ ] Verify background music stops when victory starts

✅ **Mute Functionality:**
- [ ] Mute during gameplay
- [ ] Complete game
- [ ] Verify victory celebration is muted
- [ ] Unmute during victory celebration
- [ ] Verify music starts playing

✅ **Multiple Winners (Tie):**
- [ ] Test tie scenario
- [ ] Verify "TIE!" message appears
- [ ] Verify gold color used for tie celebration

## Technical Details

### VictoryManager API
```javascript
VictoryManager.playVictorySequence({
  getMuteState: () => boolean,  // Function returning mute state
  winnerText: string,            // Winner text to display
  winnerColor: string            // Hex color code
});
```

### Visual Effects Available (3 randomly selected):
1. Confetti
2. Slow Strobe
3. Sparkles
4. Fireworks
5. Colored Spotlight Sweep
6. Pulsing Background Glow
7. Floating Stars
8. Screen Ripple
9. Particle Swirl
10. Gold Overlay
11. Camera Shake
12. Light Burst

### Music Tracks Available (1 randomly selected):
1. Move On Up
2. Celebration (chiptune)
3. We Are The Champions
4. Never Gonna Give You Up
5. G-Thang
6. Time After Time
7. Bee Gees
8. Elvis
9. Holiday
10. Axel F
11. Boys Are Back
12. Take On Me

## Files Modified
- `game.js` - Fixed victory sequence call, added helper function, updated mute handling
- `VICTORY_FIX.md` - This documentation file (new)

## Compatibility
- ✅ Works with all other Wingit! games using VictoryManager
- ✅ Maintains consistent victory celebration experience
- ✅ Follows same patterns as RunRunRabbit and Tornado games