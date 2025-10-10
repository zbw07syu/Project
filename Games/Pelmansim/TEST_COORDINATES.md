# Coordinate System Test Cases

## How the Coordinate System Works

The coordinate system flows left-to-right, top-to-bottom across BOTH grids as if they were one continuous grid.

### Formula
- `totalCols = cols * 2` (columns per grid × 2 grids)
- `row = floor(cardIndex / totalCols)`
- `col = cardIndex % totalCols`
- `coordinate = RowLetter + (col + 1)`

### Example: 12 Cards (6 per side)
Grid dimensions: 3 columns × 2 rows per side
Total columns: 6 (3 × 2)

**Left Grid (Words):**
- Card 0: row=0, col=0 → **A1**
- Card 1: row=0, col=1 → **A2**
- Card 2: row=0, col=2 → **A3**
- Card 3: row=0, col=3 → **A4**
- Card 4: row=0, col=4 → **A5**
- Card 5: row=0, col=5 → **A6**

**Right Grid (Images/Definitions):**
- Card 6: row=1, col=0 → **B1**
- Card 7: row=1, col=1 → **B2**
- Card 8: row=1, col=2 → **B3**
- Card 9: row=1, col=3 → **B4**
- Card 10: row=1, col=4 → **B5**
- Card 11: row=1, col=5 → **B6**

**Visual Layout:**
```
Left Grid:        Right Grid:
A1  A2  A3        A4  A5  A6
B1  B2  B3        B4  B5  B6
```

### Example: 24 Cards (12 per side)
Grid dimensions: 4 columns × 3 rows per side
Total columns: 8 (4 × 2)

**Left Grid (Words):**
```
A1  A2  A3  A4
B1  B2  B3  B4
C1  C2  C3  C4
```

**Right Grid (Images/Definitions):**
```
A5  A6  A7  A8
B5  B6  B7  B8
C5  C6  C7  C8
```

### Example: 48 Cards (24 per side)
Grid dimensions: 5 columns × 5 rows per side
Total columns: 10 (5 × 2)

**Left Grid (Words):**
```
A1  A2  A3  A4  A5
B1  B2  B3  B4  B5
C1  C2  C3  C4  C5
D1  D2  D3  D4  D5
E1  E2  E3  E4  E5
```

**Right Grid (Images/Definitions):**
```
A6  A7  A8  A9  A10
B6  B7  B8  B9  B10
C6  C7  C8  C9  C10
D6  D7  D8  D9  D10
E6  E7  E8  E9  E10
```

## Grid Dimension Calculations

| Cards per Side | Total Cards | Cols per Grid | Rows | Total Cols | Coordinate Range |
|----------------|-------------|---------------|------|------------|------------------|
| 6              | 12          | 3             | 2    | 6          | A1-B6            |
| 8              | 16          | 3             | 3    | 6          | A1-C6            |
| 10             | 20          | 4             | 3    | 8          | A1-C8            |
| 12             | 24          | 4             | 3    | 8          | A1-C8            |
| 16             | 32          | 4             | 4    | 8          | A1-D8            |
| 20             | 40          | 5             | 4    | 10         | A1-D10           |
| 24             | 48          | 5             | 5    | 10         | A1-E10           |

## Notes
- Empty grid cells (when rows × cols > numCards) are not rendered
- Coordinates are stored in `card.dataset.coordinate` for easy reference
- The coordinate system makes it easy for players to communicate which card they want to select