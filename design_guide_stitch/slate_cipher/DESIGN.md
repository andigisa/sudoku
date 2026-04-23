# Design System Document: The Intellectual Canvas

## 1. Overview & Creative North Star: "The Digital Lithograph"
This design system rejects the "plastic" feel of traditional mobile gaming. Our North Star is **The Digital Lithograph**. We are creating an experience that feels like high-end stationery meets precision engineering. It is a space for deep work, cognitive flow, and quiet triumph.

To break the "template" look, we move away from rigid, boxed-in layouts. We embrace intentional white space, asymmetrical header placements, and a hierarchy driven by tonal shifts rather than structural lines. The interface doesn't just hold the game; it recedes to let the logic of the puzzle breathe, using sophisticated layering to guide the eye.

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in a "Paper & Ink" philosophy. We use heavy `primary` (Deep Indigo) for the data—the numbers—and soft, environmental tones for the interface.

*   **The "No-Line" Rule:** Explicitly prohibit 1px solid borders for sectioning the UI. Boundaries between the game board, the keypad, and the navigation must be defined solely through background color shifts. For example, the Sudoku grid sits on `surface`, while the control panel beneath it transitions to `surface-container-low`.
*   **Surface Hierarchy:** Use the "Tonal Stack" to define importance:
    *   **Level 0 (Base):** `surface` (#f9f9fb) for the global background.
    *   **Level 1 (Sections):** `surface-container-low` (#f3f3f5) for large layout blocks.
    *   **Level 2 (Active Elements):** `surface-container-lowest` (#ffffff) for interactive cards or the grid itself to create a "lifted" paper effect.
*   **The Glass & Gradient Rule:** For floating modals or "Level Complete" overlays, use `surface_variant` at 80% opacity with a `24px` backdrop-blur. Apply a subtle linear gradient to main CTAs (from `primary` #182442 to `primary_container` #2e3a59) to add a "die-cast" metallic weight to the buttons.

## 3. Typography: Editorial Precision
We pair the geometric authority of **Manrope** for headers with the Swiss-style clarity of **Inter** for gameplay.

*   **Display & Headlines (Manrope):** Used for game stats and titles. These should be tracked slightly tighter (-2%) to feel "custom" and premium.
    *   `display-lg`: The primary score or timer.
    *   `headline-sm`: Level indicators (e.g., "Expert Mode").
*   **The Grid Numbers (Inter):** Numbers are the soul of the app.
    *   **Given Numbers:** `primary` (#182442) with `SemiBold` weight.
    *   **User Entries:** `secondary` (#0060ac) with `Medium` weight to distinguish "thought" from "fact."
*   **Labels (Inter):** `label-md` is used for "Notes" or "Hints," set in `on_surface_variant` (#45464e) to remain secondary in the visual stack.

## 4. Elevation & Depth: The Layering Principle
We achieve depth through physics-based layering rather than traditional drop shadows.

*   **Tonal Layering:** To highlight the active 3x3 sub-grid, do not draw a border. Instead, shift the background of those 9 cells to `surface-container-high` (#e8e8ea). This creates a "recessed" look.
*   **Ambient Shadows:** For floating elements (like a settings menu), use a shadow color derived from the `on_surface` token: `rgba(26, 28, 29, 0.06)` with a `32px` blur and `12px` Y-offset. It should look like a soft glow of light, not a dark stain.
*   **The "Ghost Border":** For the 3x3 sub-grid dividers within the Sudoku board, use the `outline_variant` (#c6c6ce) at **15% opacity**. It should be felt more than seen.
*   **Tactile Selected State:** When a cell is selected, use `secondary_fixed` (#d4e3ff). It should look like a soft blue ink wash over the paper.

## 5. Components

### The Sudoku Cell (The Core Atom)
*   **State - Default:** `surface-container-lowest` background, no border.
*   **State - Selected:** `secondary_fixed` background.
*   **State - Highlight (Same Digit):** `secondary_fixed_dim` (#a4c9ff).
*   **State - Conflict:** `error_container` (#ffdad6) background with `error` (#ba1a1a) text.
*   **Corner Radius:** `sm` (0.25rem) for individual cells to keep them crisp.

### The Input Keypad (The Precision Tool)
*   **Button Primary:** Background `primary`, Text `on_primary`. Shape `lg` (1rem).
*   **Button Secondary (Notes Toggle):** Background `surface-container-high`, Text `primary`.
*   **Interaction:** On press, the button should scale down to `0.96` to provide haptic visual feedback.

### Content Cards & Overlays
*   **Rules:** Forbid divider lines. Use `surface-container-lowest` cards on a `surface-container-low` background. Use `xl` (1.5rem) rounded corners to make the app feel approachable and modern.
*   **Success Modal:** Use `tertiary_fixed` (#b1f0ce) as a soft wash background for the "Puzzle Solved" state, creating a serene, calm conclusion.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. A larger top margin for the headline than the side margins creates an "editorial" magazine feel.
*   **Do** use `surface_container_highest` (#e2e2e4) for the "hint" animation to subtly pulse the cell.
*   **Do** rely on typography size shifts (`title-lg` vs `body-sm`) to separate content instead of adding lines.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `primary` or `on_surface` to maintain the soft, premium "ink" feel.
*   **Don't** use standard `0.5rem` spacing everywhere. Use a rhythmic scale (e.g., 8px, 16px, 32px, 64px) to create "breathing room."
*   **Don't** use high-saturation reds for errors. Use the `error` tokens which are tuned for sophisticated legibility without causing "user panic."