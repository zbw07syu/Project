# Teacher Victory Message Fix

## Issue
When the teacher won the game, the victory message displayed only "Teacher" instead of "Teacher wins".

## Solution
Modified the `endGame()` function to add "wins" suffix specifically for the Teacher when displaying the victory message.

## Changes Made

**File:** `game.js` (lines 532-548)

### Before:
```javascript
const winnerText = winners.length === 1 ? winners[0].name : 'TIE!';
```

### After:
```javascript
let winnerText;
if (winners.length === 1) {
  // Add "wins" suffix for Teacher, keep team names as is
  winnerText = winners[0].name === 'Teacher' ? 'Teacher wins' : winners[0].name;
} else {
  winnerText = 'TIE!';
}
```

## Victory Message Display

| Winner | Victory Message |
|--------|----------------|
| Teacher | **Teacher wins** |
| Team 1 | Team 1 |
| Team 2 | Team 2 |
| Team 3 | Team 3 |
| Team 4 | Team 4 |
| Multiple winners | TIE! |

## Testing

To test this fix:
1. Start a game with 2-4 teams
2. Play through the game ensuring the Teacher gets the most points
3. When game ends, verify the victory animation shows "Teacher wins"

Alternatively, to quickly test:
1. Start a game with 2 teams, 0 human teams, 1 turn
2. During teacher example round, ensure teacher guesses correctly
3. Let AI teams play their turn
4. If teacher has highest score, victory message should show "Teacher wins"

## Notes
- Team names remain unchanged (e.g., "Team 1" not "Team 1 wins")
- This maintains consistency with the existing design where team names are displayed as-is
- Only the Teacher gets the "wins" suffix to make the message grammatically correct