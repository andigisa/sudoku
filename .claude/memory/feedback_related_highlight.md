---
name: Related cell highlight contrast
description: The design token surface-container-high (#e8e8ea) is too subtle for the related cell highlight on a white board — use #d5d6da instead
type: feedback
---

The design system token `surface-container-high` (#e8e8ea) is too close to white (#ffffff) to be visible for the row/col/box highlight on the sudoku board.

**Why:** User reported they couldn't see the grey highlight at all with the design token value.

**How to apply:** Use `#d5d6da` for `.cell.related` background instead of `var(--surface-container-high)`.
