# Testing AI Auto-Answer Feature

## How to Test

### Test 1: AI Team Submits Sentences
1. Open the game in browser
2. Select **2 teams**
3. Select **0 human teams** (both teams are AI)
4. Enter **2 turns**
5. Click "Start Game"

**Expected Behavior:**
- Teacher writes example sentences and teams guess (manual answer selection)
- AI Team 1's turn: sentences appear automatically
- After 1 second, AI Team 2's guess appears in guess boxes
- Teacher enters their guess (e.g., "t" in one of the boxes)
- Click "Submit Guesses"
- **Answer is automatically revealed** (no modal appears)
- Points awarded correctly
- Next round begins

### Test 2: Mixed Human and AI Teams
1. Open the game in browser
2. Select **3 teams**
3. Select **1 human team** (Team 1 is human, Teams 2-3 are AI)
4. Enter **3 turns**
5. Click "Start Game"

**Expected Behavior:**
- Teacher example round (manual answer selection)
- **Team 1 (Human) turn:**
  - Teacher writes sentences manually
  - Click "Submit"
  - AI teams guess automatically
  - Click "Submit Guesses"
  - **Modal appears** asking teacher to select false sentence
  - Teacher selects A, B, or C
  - Points awarded
- **Team 2 (AI) turn:**
  - Sentences appear automatically
  - AI Team 3 guesses automatically
  - Teacher enters human team guesses
  - Click "Submit Guesses"
  - **Answer automatically revealed** (no modal)
  - Points awarded
- **Team 3 (AI) turn:**
  - Same as Team 2

### Test 3: Verify Correct Answer Tracking
1. Open browser console (F12)
2. Start game with AI teams
3. When AI team submits, check the sentences displayed
4. Note which sentence is false (compare with fact pool in code)
5. After "Submit Guesses", verify correct answer is revealed
6. Verify points awarded to teams who guessed correctly

### Test 4: Verify Fact Variety
1. Start game with 4 AI teams and 20 turns
2. Let game run through multiple rounds
3. Observe different fact categories appearing:
   - Geography (capitals)
   - Science (solar system)
   - Animals
   - History
   - Mathematics
   - Human Body
   - General Knowledge

### Test 5: Edge Cases
**Test 5a: All AI Teams**
- Select 4 teams, 0 human teams
- Verify game runs smoothly with only AI
- Verify teacher can still enter "t" for their own guesses

**Test 5b: All Human Teams**
- Select 4 teams, 4 human teams
- Verify no AI facts appear
- Verify teacher always gets modal to select answer

**Test 5c: Restart During AI Round**
- Start game with AI teams
- During AI team's turn, click "Restart"
- Verify `aiCorrectAnswer` is reset
- Start new game and verify no issues

## Expected Results Summary

| Scenario | Answer Selection Method | Modal Shown? |
|----------|------------------------|--------------|
| Teacher submits sentences | Manual | Yes |
| Human team submits sentences | Manual | Yes |
| AI team submits sentences | **Automatic** | **No** |

## Verification Checklist

- [ ] AI teams use educational facts (not personal statements)
- [ ] Facts cover multiple topics (geography, science, animals, etc.)
- [ ] When AI submits, answer is automatically revealed
- [ ] When human submits, teacher modal appears
- [ ] Points correctly awarded in both scenarios
- [ ] No console errors
- [ ] Game doesn't break when restarting
- [ ] Fact pool resets after all 15 facts used
- [ ] Sentences are properly shuffled each time

## Sample AI Facts to Look For

When testing, you should see facts like:
- "The capital of Australia is Sydney" (FALSE)
- "Venus is the largest planet in our solar system" (FALSE)
- "Sharks are mammals" (FALSE)
- "The first moon landing was in 1959" (FALSE)
- "A square has five corners" (FALSE)
- "Humans have four lungs" (FALSE)
- "A year has 400 days" (FALSE)

Each fact set has 2 true statements and 1 false statement.