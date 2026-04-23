import { useEffect, useMemo, useRef, useState } from "react";
import type { DifficultyDto, PuzzleResponseDto } from "@sudoku/contracts";
import {
  applyInput,
  clearCell,
  cloneGameState,
  createGameState,
  getCellsWithValue,
  getConflictingCells,
  getRelatedCells,
  isGivenCell,
  restartGame,
  setElapsedMs,
  setPaused,
  setSelectedCell,
  toggleNoteMode,
  type SerializedGameState
} from "@sudoku/domain";
import {
  appendCompletedGame,
  clearActiveGame,
  listCompletedGames,
  loadActiveGame,
  loadSetting,
  saveActiveGame,
  saveSetting,
  type CompletedGameRecord
} from "./storage";

type ViewState = "home" | "game";

interface HistoryState {
  past: SerializedGameState[];
  present: SerializedGameState | null;
  future: SerializedGameState[];
}

const difficultyLabels: Record<DifficultyDto, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert"
};

const difficultyIcons: Record<DifficultyDto, string> = {
  easy: "filter_1",
  medium: "filter_2",
  hard: "filter_3",
  expert: "bolt"
};

export default function App() {
  const [view, setView] = useState<ViewState>("home");
  const [history, setHistory] = useState<HistoryState>({ past: [], present: null, future: [] });
  const [difficulty, setDifficulty] = useState<DifficultyDto>("easy");
  const [loading, setLoading] = useState(false);
  const [highlightConflicts, setHighlightConflicts] = useState(true);
  const [highlightMatches, setHighlightMatches] = useState(true);
  const [completedGames, setCompletedGames] = useState<CompletedGameRecord[]>([]);
  const completionLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    void Promise.all([
      loadActiveGame(),
      loadSetting("highlightConflicts"),
      loadSetting("highlightMatches"),
      listCompletedGames()
    ]).then(([savedGame, savedConflictSetting, savedMatchSetting, completed]) => {
      if (savedGame) {
        setHistory({ past: [], present: savedGame, future: [] });
      }

      setHighlightConflicts(savedConflictSetting !== "false");
      setHighlightMatches(savedMatchSetting !== "false");
      setCompletedGames(completed);
    });
  }, []);

  useEffect(() => {
    if (!history.present || history.present.paused || history.present.completedAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setHistory((current) => {
        if (!current.present || current.present.paused || current.present.completedAt) {
          return current;
        }

        return {
          ...current,
          present: setElapsedMs(current.present, current.present.elapsedMs + 1000)
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [history.present]);

  useEffect(() => {
    if (!history.present) {
      void clearActiveGame();
      return;
    }

    void saveActiveGame(history.present);

    if (history.present.completedAt && completionLoggedRef.current !== history.present.completedAt) {
      completionLoggedRef.current = history.present.completedAt;
      const summary = {
        puzzleId: history.present.puzzle.puzzleId,
        difficulty: history.present.puzzle.difficulty,
        elapsedMs: history.present.elapsedMs,
        completedAt: history.present.completedAt
      };

      void appendCompletedGame(summary).then(async () => {
        const latest = await listCompletedGames();
        setCompletedGames(latest);
      });
    }
  }, [history.present]);

  const conflicts = useMemo(
    () => (history.present ? new Set(getConflictingCells(history.present.board)) : new Set<number>()),
    [history.present]
  );

  const highlightedCells = useMemo(() => {
    if (!history.present || history.present.selectedCell === null) {
      return new Set<number>();
    }

    return new Set(getRelatedCells(history.present.selectedCell));
  }, [history.present]);

  const completedDigits = useMemo(() => {
    if (!history.present) return new Set<number>();
    const counts = new Array(10).fill(0);
    for (const v of history.present.board) {
      if (v > 0) counts[v]++;
    }
    return new Set(counts.flatMap((count, digit) => (digit > 0 && count === 9 ? [digit] : [])));
  }, [history.present]);

  const matchingValueCells = useMemo(() => {
    if (!history.present || history.present.selectedCell === null || !highlightMatches) {
      return new Set<number>();
    }

    const selectedValue = history.present.board[history.present.selectedCell];
    if (selectedValue === 0) {
      return new Set<number>();
    }

    return new Set(getCellsWithValue(history.present.board, selectedValue));
  }, [highlightMatches, history.present]);

  const stats = useMemo(() => {
    const played = completedGames.length;
    const medTimes = completedGames
      .filter((g) => g.difficulty === "medium")
      .map((g) => g.elapsedMs)
      .sort((a, b) => a - b);
    const bestTime = medTimes.length > 0 ? medTimes[0] : null;

    const dateSet = [...new Set(completedGames.map((g) => g.completedAt.substring(0, 10)))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dateSet.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (dateSet[i] === expected.toISOString().substring(0, 10)) {
        streak++;
      } else {
        break;
      }
    }

    return { played, bestTime, streak };
  }, [completedGames]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (view !== "game" || !history.present || history.present.selectedCell === null) {
        return;
      }

      if (event.key >= "1" && event.key <= "9") {
        event.preventDefault();
        updateGame((state) => applyInput(state, state.selectedCell!, Number(event.key)));
      } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        event.preventDefault();
        updateGame((state) => clearCell(state, state.selectedCell!));
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        updateGame((state) => toggleNoteMode(state));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection(-9);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection(9);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSelection(-1, true);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSelection(1, true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history.present, view]);

  function moveSelection(delta: number, wrapRow = false) {
    setHistory((current) => {
      if (!current.present || current.present.selectedCell === null) {
        return current;
      }

      let nextCell = current.present.selectedCell + delta;
      if (wrapRow && current.present.selectedCell % 9 === 8 && delta === 1) {
        nextCell = current.present.selectedCell - 8;
      } else if (wrapRow && current.present.selectedCell % 9 === 0 && delta === -1) {
        nextCell = current.present.selectedCell + 8;
      }

      if (nextCell < 0 || nextCell > 80) {
        return current;
      }

      return {
        ...current,
        present: setSelectedCell(current.present, nextCell)
      };
    });
  }

  function updateGame(mutator: (state: SerializedGameState) => SerializedGameState) {
    setHistory((current) => {
      if (!current.present) {
        return current;
      }

      const next = mutator(cloneGameState(current.present));

      if (JSON.stringify(next) === JSON.stringify(current.present)) {
        return current;
      }

      return {
        past: [...current.past, current.present],
        present: next,
        future: []
      };
    });
  }

  async function startNewGame(selectedDifficulty: DifficultyDto) {
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/puzzles/random?difficulty=${selectedDifficulty}`);
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const puzzle = (await response.json()) as PuzzleResponseDto;
      const state = createGameState({
        puzzleId: puzzle.puzzle_id,
        givens: puzzle.givens,
        difficulty: puzzle.difficulty,
        generatorVersion: puzzle.generator_version,
        solutionChecksum: puzzle.solution_checksum
      });

      completionLoggedRef.current = null;
      setDifficulty(selectedDifficulty);
      setHistory({ past: [], present: state, future: [] });
      setView("game");
    } catch (error) {
      console.error("Failed to start game:", error);
      alert("Could not start a new game. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  async function continueGame() {
    if (history.present) {
      setView("game");
    }
  }

  function undo() {
    setHistory((current) => {
      if (current.past.length === 0 || !current.present) {
        return current;
      }

      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future]
      };
    });
  }

  function redo() {
    setHistory((current) => {
      if (current.future.length === 0 || !current.present) {
        return current;
      }

      const [next, ...rest] = current.future;
      return {
        past: [...current.past, current.present],
        present: next,
        future: rest
      };
    });
  }

  async function toggleSetting(key: "highlightConflicts" | "highlightMatches", value: boolean) {
    if (key === "highlightConflicts") {
      setHighlightConflicts(value);
    } else {
      setHighlightMatches(value);
    }

    await saveSetting(key, String(value));
  }

  const appHeader = (
    <header className="app-header">
      <div className="app-header-inner">
        <span className="app-title">Sudoku Lithograph</span>
        <button className="header-settings-btn" type="button" aria-label="Settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );

  const bottomNav = (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${view === "home" ? "active" : ""}`}
        onClick={() => setView("home")}
        type="button"
      >
        <span className="material-symbols-outlined">grid_on</span>
        <span>Play</span>
      </button>
      <button className="nav-item" type="button">
        <span className="material-symbols-outlined">calendar_today</span>
        <span>Daily</span>
      </button>
      <button className="nav-item" type="button">
        <span className="material-symbols-outlined">leaderboard</span>
        <span>Stats</span>
      </button>
      <button className="nav-item" type="button">
        <span className="material-symbols-outlined">palette</span>
        <span>Themes</span>
      </button>
    </nav>
  );

  if (view === "home") {
    const todayLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

    return (
      <>
        {appHeader}
        <main className="home-shell">
          <div className="home-grid">
            {/* Left column */}
            <div>
              <p className="section-label">Current Session</p>
              <div className="resume-card">
                <div className="resume-card-bg" />
                {history.present ? (
                  <>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <h2 className="resume-title">
                        {difficultyLabels[history.present.puzzle.difficulty]} Puzzle
                      </h2>
                      <p className="resume-subtitle">{formatElapsed(history.present.elapsedMs)} elapsed</p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => void continueGame()}
                      style={{ position: "relative", zIndex: 1 }}
                      type="button"
                    >
                      Continue
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </button>
                  </>
                ) : (
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <h2 className="resume-title">No Active Game</h2>
                    <p className="resume-subtitle">Start a new game below to begin playing.</p>
                  </div>
                )}
              </div>

              <h2 className="section-heading">New Game</h2>
              <div className="difficulty-grid">
                {(Object.keys(difficultyLabels) as DifficultyDto[]).map((option) => (
                  <button
                    key={option}
                    className={`difficulty-card ${option === difficulty ? "active" : ""}`}
                    disabled={loading}
                    onClick={() => {
                      if (option === difficulty) {
                        void startNewGame(option);
                      } else {
                        setDifficulty(option);
                      }
                    }}
                    type="button"
                  >
                    <span className="material-symbols-outlined">{difficultyIcons[option]}</span>
                    <span className="difficulty-label">{difficultyLabels[option]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div>
              <div className="stats-card">
                <div className="stats-card-header">
                  <h2 className="section-heading" style={{ marginBottom: 0 }}>
                    Your Progress
                  </h2>
                  <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>
                    insights
                  </span>
                </div>
                <div className="stats-grid">
                  <div>
                    <div className="stat-value">{stats.played}</div>
                    <div className="stat-label">Games Played</div>
                  </div>
                  <div>
                    <div className="stat-value">{stats.played > 0 ? "100%" : "—"}</div>
                    <div className="stat-label">Win Rate</div>
                  </div>
                  <div>
                    <div className="stat-value">
                      {stats.bestTime !== null ? formatElapsed(stats.bestTime) : "—"}
                    </div>
                    <div className="stat-label">Best Time (Med)</div>
                  </div>
                  <div>
                    <div className="stat-value">{stats.streak}</div>
                    <div className="stat-label">Day Streak</div>
                  </div>
                </div>
                <div className="stats-footer">
                  <button className="link-btn" type="button">
                    View detailed statistics
                    <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>

              <div className="daily-card">
                <div className="daily-card-grid-bg">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="daily-card-grid-cell" />
                  ))}
                </div>
                <div className="daily-card-content">
                  <div className="daily-badge">
                    <span className="material-symbols-outlined">event_note</span>
                    <span className="daily-badge-text">Daily Challenge</span>
                  </div>
                  <h3 className="daily-title">{todayLabel}</h3>
                  <p className="daily-desc">
                    Complete today's unique board to earn the &ldquo;Inkwell&rdquo; badge.
                  </p>
                  <button
                    className="btn-pill"
                    disabled={loading}
                    onClick={() => void startNewGame("hard")}
                    type="button"
                  >
                    Play Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        {bottomNav}
      </>
    );
  }

  if (!history.present) {
    return null;
  }


  return (
    <>
      {appHeader}
      <main className="game-shell">
        {/* Game info bar */}
        <div className="game-info-bar">
          <div>
            <div className="game-mode-label">Mode</div>
            <div className="game-mode-title">
              {difficultyLabels[history.present.puzzle.difficulty]} Mode
            </div>
          </div>
          <div className="game-stats-col">
            <div className="game-stats-row">
              <div className="game-stat">
                <span className="game-stat-label">Mistakes</span>
                <span className="game-stat-value">{history.present.mistakes}/3</span>
              </div>
              <div className="game-stat">
                <span className="game-stat-label">Timer</span>
                <span className="game-stat-value">{formatElapsed(history.present.elapsedMs)}</span>
              </div>
            </div>
            <div className="game-actions-row">
              <button
                className="btn-ghost"
                onClick={() => updateGame((state) => setPaused(state, !state.paused))}
                type="button"
              >
                {history.present.paused ? "Resume" : "Pause"}
              </button>
              <button
                className="btn-primary"
                onClick={() => setView("home")}
                style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "9999px" }}
                type="button"
              >
                New Game
              </button>
            </div>
          </div>
        </div>

        {/* Completed / game over banner */}
        {history.present.gameOver ? (
          <div className="game-over-banner">
            Game Over — 3 mistakes reached
            <button className="btn-pill" onClick={() => setView("home")} style={{ marginTop: 12 }} type="button">
              New Game
            </button>
          </div>
        ) : history.present.completedAt ? (
          <div className="completed-banner">Puzzle Solved!</div>
        ) : null}

        {/* Board */}
        <div className="board-wrapper">
          <div className="board">
            {Array.from({ length: 9 }, (_, boxIndex) => {
              const boxRow = Math.floor(boxIndex / 3);
              const boxCol = boxIndex % 3;
              return (
                <div key={boxIndex} className="box-group">
                  {Array.from({ length: 9 }, (_, cellInBox) => {
                    const r = Math.floor(cellInBox / 3);
                    const c = cellInBox % 3;
                    const index = (boxRow * 3 + r) * 9 + (boxCol * 3 + c);
                    const value = history.present!.board[index];
                    const noteValues = history.present!.notes[index];
                    const selected = history.present!.selectedCell === index;
                    const given = isGivenCell(history.present!, index);
                    const conflict = highlightConflicts && conflicts.has(index);
                    const related = highlightedCells.has(index);
                    const matching = highlightMatches && matchingValueCells.has(index);
                    const isUserEntry = !given && value > 0;

                    const className = [
                      "cell",
                      given ? "given" : "",
                      isUserEntry ? "user-entry" : "",
                      selected ? "selected" : "",
                      !selected && related ? "related" : "",
                      !selected && conflict ? "conflict" : "",
                      !selected && !conflict && matching ? "matching" : ""
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <button
                        key={index}
                        className={className}
                        onClick={() => updateGame((state) => setSelectedCell(state, index))}
                        type="button"
                      >
                        {value > 0 ? (
                          <span>{value}</span>
                        ) : (
                          <span className="notes-grid">
                            {Array.from({ length: 9 }, (_, noteIndex) => {
                              const noteValue = noteIndex + 1;
                              return (
                                <small key={noteValue}>
                                  {noteValues.includes(noteValue) ? noteValue : ""}
                                </small>
                              );
                            })}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {history.present.paused ? <div className="pause-overlay">Paused</div> : null}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <button
            className="tool-btn"
            disabled={history.past.length === 0}
            onClick={undo}
            type="button"
          >
            <span className="material-symbols-outlined">undo</span>
            <span className="tool-btn-label">Undo</span>
          </button>
          <button
            className="tool-btn"
            disabled={history.future.length === 0}
            onClick={redo}
            type="button"
          >
            <span className="material-symbols-outlined">history</span>
            <span className="tool-btn-label">Redo</span>
          </button>
          <button
            className="tool-btn"
            onClick={() => updateGame((state) => clearCell(state, state.selectedCell ?? 0))}
            type="button"
          >
            <span className="material-symbols-outlined">backspace</span>
            <span className="tool-btn-label">Erase</span>
          </button>
          <button
            className={`tool-btn ${history.present.noteMode ? "notes-on" : ""}`}
            onClick={() => updateGame(toggleNoteMode)}
            type="button"
          >
            <span
              className="material-symbols-outlined"
              style={history.present.noteMode ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              edit
            </span>
            <span className="tool-btn-label">
              Notes{history.present.noteMode ? ": On" : ""}
            </span>
          </button>
        </div>

        {/* Number pad */}
        <div className="num-pad">
          {Array.from({ length: 9 }, (_, index) => {
            const digit = index + 1;
            const done = completedDigits.has(digit);
            return (
            <button
              key={digit}
              className={`num-key${done ? " num-key-done" : ""}`}
              disabled={done}
              onClick={() =>
                history.present &&
                history.present.selectedCell !== null &&
                updateGame((state) => applyInput(state, state.selectedCell!, digit))
              }
              type="button"
            >
              {digit}
            </button>
            );
          })}
          <button className="num-key hint-key" disabled type="button">
            <span className="material-symbols-outlined">lightbulb</span>
          </button>
        </div>
      </main>
      {bottomNav}
    </>
  );
}

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
