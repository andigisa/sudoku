interface Props {
  onBack: () => void;
}

function IconButton({ icon, label, className }: { icon: string; label?: string; className?: string }) {
  return (
    <span className={`help-icon-btn ${className ?? ""}`}>
      <span className="material-symbols-outlined">{icon}</span>
      {label && <span className="help-icon-label">{label}</span>}
    </span>
  );
}

function DigitButton({ digit }: { digit: number }) {
  return <span className="help-digit-btn">{digit}</span>;
}

export default function HowToPlayView({ onBack }: Props) {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <button className="btn-ghost" onClick={onBack} type="button">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="app-title">How to Play</span>
          <div style={{ width: 40 }} />
        </div>
      </header>
      <main className="help-shell">
        <div className="help-content">

          {/* Section 1: Sudoku Rules */}
          <section className="help-section">
            <h2>What is Sudoku?</h2>
            <p>
              Sudoku is a logic-based number puzzle. The goal is to fill a 9&times;9 grid
              with digits so that each <strong>row</strong>, each <strong>column</strong>,
              and each of the nine <strong>3&times;3 boxes</strong> contains all digits
              from 1 to 9 exactly once.
            </p>

            <div className="help-rule-grid">
              <div className="help-rule-card">
                <div className="help-rule-icon">
                  <span className="material-symbols-outlined">table_rows</span>
                </div>
                <div>
                  <strong>Rows</strong>
                  <p>Each row must contain the numbers 1&ndash;9 without repetition.</p>
                </div>
              </div>
              <div className="help-rule-card">
                <div className="help-rule-icon">
                  <span className="material-symbols-outlined">view_column</span>
                </div>
                <div>
                  <strong>Columns</strong>
                  <p>Each column must contain the numbers 1&ndash;9 without repetition.</p>
                </div>
              </div>
              <div className="help-rule-card">
                <div className="help-rule-icon">
                  <span className="material-symbols-outlined">grid_view</span>
                </div>
                <div>
                  <strong>Boxes</strong>
                  <p>Each 3&times;3 box must contain the numbers 1&ndash;9 without repetition.</p>
                </div>
              </div>
            </div>

            <h3>How to Start</h3>
            <p>
              The puzzle begins with some cells already filled in &mdash; these are
              called <strong>givens</strong>. Use logic to figure out which numbers go
              in the empty cells. There is always exactly one correct solution.
            </p>
          </section>

          {/* Section 2: Entering Numbers */}
          <section className="help-section">
            <h2>Entering Numbers</h2>
            <p>
              Tap an empty cell on the board to select it. Then tap a number on the
              number pad at the bottom:
            </p>
            <div className="help-demo-row">
              <DigitButton digit={1} />
              <DigitButton digit={2} />
              <DigitButton digit={3} />
              <span className="help-dots">&hellip;</span>
              <DigitButton digit={9} />
            </div>
            <p>
              The number will be placed in the selected cell. If it&rsquo;s correct,
              it stays. If it&rsquo;s wrong, it turns <strong style={{ color: "var(--error)" }}>red</strong> immediately
              so you know right away.
            </p>
            <p>
              You can also use your <strong>keyboard</strong>: press keys
              1&ndash;9 to enter digits, and use the arrow keys to move between cells.
            </p>
          </section>

          {/* Section 3: Mistakes */}
          <section className="help-section">
            <h2>
              <span className="material-symbols-outlined help-section-icon" style={{ color: "var(--error)" }}>
                dangerous
              </span>
              Mistakes
            </h2>
            <p>
              Every wrong number counts as a mistake. You can see your mistake
              count in the game bar at the top:
            </p>
            <div className="help-info-box error">
              <strong>Mistakes: 1/3</strong>
              <p>
                You are allowed a maximum of <strong>3 mistakes</strong>. On the third
                mistake, the game is over and you&rsquo;ll need to start a new puzzle.
                So think carefully before placing a number!
              </p>
            </div>
          </section>

          {/* Section 4: Hints */}
          <section className="help-section">
            <h2>
              <span className="material-symbols-outlined help-section-icon" style={{ color: "var(--primary)" }}>
                lightbulb
              </span>
              Hints
            </h2>
            <p>
              Stuck on a cell? Select an empty cell, then tap the hint button:
            </p>
            <div className="help-demo-row">
              <IconButton icon="lightbulb" className="hint" />
            </div>
            <p>
              The correct number will be filled in automatically. Hints don&rsquo;t
              count as mistakes, but they do count toward your score &mdash; especially
              in tournaments where each hint costs <strong>100 points</strong>.
            </p>
            <p className="help-tip">
              <strong>Keyboard shortcut:</strong> Press <kbd>H</kbd> to use a hint.
            </p>
          </section>

          {/* Section 5: Notes */}
          <section className="help-section">
            <h2>
              <span className="material-symbols-outlined help-section-icon" style={{ color: "var(--primary)" }}>
                edit
              </span>
              Notes (Pencil Marks)
            </h2>
            <p>
              Not sure which number goes in a cell? Use notes to jot down candidates.
              Tap the Notes button to toggle notes mode:
            </p>
            <div className="help-demo-row">
              <IconButton icon="edit" label="Notes" />
              <span className="help-arrow">&rarr;</span>
              <IconButton icon="edit" label="Notes: On" className="notes-active" />
            </div>
            <p>
              When notes mode is <strong>on</strong>, tapping a number adds (or removes)
              a small pencil mark in the selected cell instead of placing a full number.
              You can add multiple candidates to the same cell.
            </p>
            <p>
              Notes are automatically cleared when you place a final number in that cell.
            </p>
            <p className="help-tip">
              <strong>Keyboard shortcut:</strong> Press <kbd>N</kbd> to toggle notes mode.
            </p>
          </section>

          {/* Section 6: Erase */}
          <section className="help-section">
            <h2>
              <span className="material-symbols-outlined help-section-icon">
                backspace
              </span>
              Erase
            </h2>
            <p>
              Made a mistake or want to clear your notes? Select a cell and tap Erase:
            </p>
            <div className="help-demo-row">
              <IconButton icon="backspace" label="Erase" />
            </div>
            <p>
              This removes the number or notes from the selected cell. You cannot
              erase the original given numbers.
            </p>
            <p className="help-tip">
              <strong>Keyboard shortcut:</strong> Press <kbd>Backspace</kbd> or <kbd>Delete</kbd>.
            </p>
          </section>

          {/* Section 7: Undo & Redo */}
          <section className="help-section">
            <h2>
              <span className="material-symbols-outlined help-section-icon">
                undo
              </span>
              Undo &amp; Redo
            </h2>
            <p>
              Changed your mind? Use the Undo and Redo buttons to step backward
              and forward through your moves:
            </p>
            <div className="help-demo-row">
              <IconButton icon="undo" label="Undo" />
              <IconButton icon="history" label="Redo" />
            </div>
            <p>
              You can undo as many steps as you like, all the way back to the
              beginning.
            </p>
          </section>

          {/* Section 8: Timer & Pause */}
          <section className="help-section">
            <h2>
              <span className="material-symbols-outlined help-section-icon">
                timer
              </span>
              Timer &amp; Pause
            </h2>
            <p>
              A timer at the top tracks how long you&rsquo;ve been working on the puzzle.
              Tap <strong>Pause</strong> to stop the timer and hide the board. Tap
              <strong> Resume</strong> to continue.
            </p>
          </section>

          {/* Section 9: Tips */}
          <section className="help-section">
            <h2>Tips for Beginners</h2>
            <ul className="help-tips-list">
              <li>
                <strong>Start with easy puzzles</strong> &mdash; they have more given
                numbers, giving you a gentler introduction.
              </li>
              <li>
                <strong>Use notes liberally</strong> &mdash; pencil in all possible
                candidates for a cell, then eliminate them as you fill in neighbors.
              </li>
              <li>
                <strong>Look for singles</strong> &mdash; if a row, column, or box has
                only one empty cell, you know exactly what goes there.
              </li>
              <li>
                <strong>Scan rows and columns</strong> &mdash; check which numbers are
                missing and see if any can only go in one spot.
              </li>
              <li>
                <strong>Don&rsquo;t guess</strong> &mdash; Sudoku is a logic puzzle.
                Every number can be deduced. If you&rsquo;re stuck, use a hint!
              </li>
            </ul>
          </section>

        </div>
      </main>
    </>
  );
}
