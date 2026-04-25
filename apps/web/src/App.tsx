import { useEffect, useMemo, useRef, useState } from "react";
import type { DifficultyDto, DailyChallengeResponseDto, PuzzleResponseDto, SessionResponseDto, TournamentResponseDto, SubmitEntryResponseDto, UserProfileDto } from "@sudoku/contracts";
import TournamentCard from "./components/TournamentCard";
import TournamentView from "./views/TournamentView";
import LeaderboardView from "./views/LeaderboardView";
import StatsView from "./views/StatsView";
import AuthModal from "./components/AuthModal";
import AccountSettings from "./components/AccountSettings";
import ThemePickerModal from "./components/ThemePickerModal";
import { fetchCurrentTournament, submitTournamentEntry } from "./api/tournaments";
import { fetchMe } from "./api/auth";
import { applyThemeVars } from "./themes";
import {
  applyHint,
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

type ViewState = "home" | "game" | "tournament" | "leaderboard" | "stats";

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dailyStatus, setDailyStatus] = useState<"idle" | "done">("idle");
  const [activeTournament, setActiveTournament] = useState<TournamentResponseDto | null>(null);
  const [leaderboardTournament, setLeaderboardTournament] = useState<TournamentResponseDto | null>(null);
  const [tournamentMode, setTournamentMode] = useState(false);
  const [tournamentSubmitting, setTournamentSubmitting] = useState(false);
  const [tournamentSubmitResult, setTournamentSubmitResult] = useState<SubmitEntryResponseDto | null>(null);
  const [tournamentSubmitError, setTournamentSubmitError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [themeId, setThemeId] = useState("default");
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const puzzleIdRef = useRef<string | null>(null);
  const solutionCacheRef = useRef<Record<string, number[]>>({});
  const completionLoggedRef = useRef<string | null>(null);
  const serverSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void Promise.all([
      loadActiveGame(),
      loadSetting("highlightConflicts"),
      loadSetting("highlightMatches"),
      loadSetting("sessionId"),
      loadSetting("theme"),
      listCompletedGames()
    ]).then(([savedGame, savedConflictSetting, savedMatchSetting, savedSessionId, savedTheme, completed]) => {
      if (savedGame) {
        setHistory({ past: [], present: savedGame, future: [] });
      }

      setHighlightConflicts(savedConflictSetting !== "false");
      setHighlightMatches(savedMatchSetting !== "false");
      setSessionId(savedSessionId ?? null);
      if (savedTheme) setThemeId(savedTheme);
      setCompletedGames(completed);
    });

    // Load active tournament (best-effort, non-blocking)
    fetchCurrentTournament().then(setActiveTournament).catch(() => null);

    // Check for existing auth session
    fetchMe().then((res) => { if (res) setUser(res.user); }).catch(() => null);
  }, []);

  useEffect(() => {
    applyThemeVars(themeId);
    localStorage.setItem("sudoku-theme", themeId);
  }, [themeId]);

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

    // Debounced server sync
    if (serverSyncTimerRef.current) {
      clearTimeout(serverSyncTimerRef.current);
    }

    const snap = history.present;
    const sid = sessionId;
    if (sid) {
      serverSyncTimerRef.current = setTimeout(() => {
        void fetch(`/api/v1/sessions/${sid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state_json: JSON.stringify(snap),
            elapsed_ms: snap.elapsedMs,
            mistakes: snap.mistakes,
            completed_at: snap.completedAt ?? null
          })
        }).catch(() => {/* server sync is best-effort */});
      }, 2000);
    }
  }, [history.present, sessionId]);

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
        void handleDigitInput(history.present.selectedCell!, Number(event.key));
      } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        event.preventDefault();
        updateGame((state) => clearCell(state, state.selectedCell!));
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        updateGame((state) => toggleNoteMode(state));
      } else if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        handleHint();
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

  async function createServerSession(puzzle: PuzzleResponseDto, state: SerializedGameState): Promise<string | null> {
    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzle_id: puzzle.puzzle_id,
          difficulty: puzzle.difficulty,
          state_json: JSON.stringify(state)
        })
      });

      if (!response.ok) return null;
      const session = (await response.json()) as SessionResponseDto;
      await saveSetting("sessionId", session.session_id);
      return session.session_id;
    } catch {
      return null;
    }
  }

  async function startNewGame(selectedDifficulty: DifficultyDto) {
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/puzzles/random?difficulty=${selectedDifficulty}`);
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const puzzle = (await response.json()) as PuzzleResponseDto;
      puzzleIdRef.current = puzzle.puzzle_id;
      const state = createGameState({
        puzzleId: puzzle.puzzle_id,
        givens: puzzle.givens,
        difficulty: puzzle.difficulty,
        generatorVersion: puzzle.generator_version,
        solutionChecksum: puzzle.solution_checksum
      });

      const sid = await createServerSession(puzzle, state);
      completionLoggedRef.current = null;
      setSessionId(sid);
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

  async function startDailyChallenge() {
    setLoading(true);

    try {
      const response = await fetch("/api/v1/daily");
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const daily = (await response.json()) as DailyChallengeResponseDto;
      const { puzzle, session } = daily;
      puzzleIdRef.current = puzzle.puzzle_id;

      if (session) {
        // Resume existing daily session
        const savedState = JSON.parse(session.state_json) as SerializedGameState;
        completionLoggedRef.current = savedState.completedAt;
        setSessionId(session.session_id);
        await saveSetting("sessionId", session.session_id);
        setDifficulty(puzzle.difficulty);
        setHistory({ past: [], present: savedState, future: [] });
        if (savedState.completedAt) {
          setDailyStatus("done");
        }
      } else {
        // Start a fresh daily session
        const state = createGameState({
          puzzleId: puzzle.puzzle_id,
          givens: puzzle.givens,
          difficulty: puzzle.difficulty,
          generatorVersion: puzzle.generator_version,
          solutionChecksum: puzzle.solution_checksum
        });

        const sid = await createServerSession(puzzle, state);
        completionLoggedRef.current = null;
        setSessionId(sid);
        setDailyStatus("idle");
        setDifficulty(puzzle.difficulty);
        setHistory({ past: [], present: state, future: [] });
      }

      setView("game");
    } catch (error) {
      console.error("Failed to start daily challenge:", error);
      alert("Could not load the daily challenge. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  async function continueGame() {
    if (history.present) {
      setView("game");
    }
  }

  async function startTournamentGame(tournament: TournamentResponseDto) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/puzzles/${tournament.puzzle_id}`);
      if (!res.ok) throw new Error("Could not load tournament puzzle");
      const puzzle = (await res.json()) as PuzzleResponseDto;
      puzzleIdRef.current = puzzle.puzzle_id;

      const state = createGameState({
        puzzleId: puzzle.puzzle_id,
        givens: puzzle.givens,
        difficulty: puzzle.difficulty,
        generatorVersion: puzzle.generator_version,
        solutionChecksum: puzzle.solution_checksum
      });

      const sid = await createServerSession(puzzle, state);
      completionLoggedRef.current = null;
      setSessionId(sid);
      setTournamentMode(true);
      setTournamentSubmitResult(null);
      setTournamentSubmitError(null);
      setDifficulty(puzzle.difficulty);
      setHistory({ past: [], present: state, future: [] });
      setView("game");
    } catch (error) {
      console.error("Failed to start tournament game:", error);
      alert("Could not load the tournament puzzle.");
    } finally {
      setLoading(false);
    }
  }

  function goToLeaderboard(tournament: TournamentResponseDto) {
    setLeaderboardTournament(tournament);
    setView("leaderboard");
  }

  async function handleTournamentSubmit() {
    if (!history.present || !sessionId || !activeTournament) return;

    setTournamentSubmitting(true);
    setTournamentSubmitError(null);

    try {
      const board = history.present.board.join("");
      const result = await submitTournamentEntry(activeTournament.id, {
        session_id: sessionId,
        elapsed_ms: history.present.elapsedMs,
        mistakes: history.present.mistakes,
        hints_used: history.present.hintsUsed,
        final_board: board
      });
      setTournamentSubmitResult(result);
    } catch (e) {
      setTournamentSubmitError((e as Error).message);
    } finally {
      setTournamentSubmitting(false);
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

  async function fetchCellSolution(puzzleId: string, cellIndex: number): Promise<number | undefined> {
    const cache = solutionCacheRef.current[puzzleId];
    if (cache && cache[cellIndex]) return cache[cellIndex];
    try {
      const res = await fetch(`/api/v1/puzzles/${puzzleId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cell_index: cellIndex })
      });
      if (!res.ok) return undefined;
      const data = (await res.json()) as { value: number };
      if (!solutionCacheRef.current[puzzleId]) {
        solutionCacheRef.current[puzzleId] = new Array(81).fill(0);
      }
      solutionCacheRef.current[puzzleId][cellIndex] = data.value;
      return data.value;
    } catch {
      return undefined;
    }
  }

  async function handleDigitInput(cellIndex: number, digit: number) {
    if (!puzzleIdRef.current) {
      updateGame((state) => applyInput(state, cellIndex, digit));
      return;
    }
    const correct = await fetchCellSolution(puzzleIdRef.current, cellIndex);
    const sol = correct !== undefined ? (() => {
      const arr = new Array(81).fill(0);
      arr[cellIndex] = correct;
      return arr;
    })() : undefined;
    updateGame((state) => applyInput(state, state.selectedCell!, digit, sol));
  }

  function handleThemeChange(newThemeId: string) {
    setThemeId(newThemeId);
    void saveSetting("theme", newThemeId);
  }

  async function handleHint() {
    if (!history.present || history.present.selectedCell === null || !puzzleIdRef.current) return;
    const cellIndex = history.present.selectedCell;
    const puzzleId = puzzleIdRef.current;

    try {
      const res = await fetch(`/api/v1/puzzles/${puzzleId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cell_index: cellIndex })
      });
      if (!res.ok) return;
      const data = (await res.json()) as { value: number };

      // Cache the value for mistake checking
      if (!solutionCacheRef.current[puzzleId]) {
        solutionCacheRef.current[puzzleId] = new Array(81).fill(0);
      }
      solutionCacheRef.current[puzzleId][cellIndex] = data.value;

      updateGame((state) => applyHint(state, cellIndex, data.value));
    } catch {
      // silently fail — hint is optional
    }
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
        <button
          className="header-settings-btn"
          type="button"
          aria-label={user ? "Account" : "Sign in"}
          onClick={() => {
            if (user) {
              setAccountSettingsOpen(true);
            } else {
              setAuthModalOpen(true);
            }
          }}
        >
          <span className="material-symbols-outlined">{user ? "account_circle" : "person"}</span>
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
      <button className="nav-item" onClick={() => void startDailyChallenge()} type="button">
        <span className="material-symbols-outlined">calendar_today</span>
        <span>Daily</span>
      </button>
      <button
        className={`nav-item ${view === "stats" ? "active" : ""}`}
        onClick={() => setView("stats")}
        type="button"
      >
        <span className="material-symbols-outlined">leaderboard</span>
        <span>Stats</span>
      </button>
      <button className="nav-item" onClick={() => setThemeModalOpen(true)} type="button">
        <span className="material-symbols-outlined">palette</span>
        <span>Themes</span>
      </button>
    </nav>
  );

  const authModals = (
    <>
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          setAuthModalOpen(false);
        }}
      />
      {user && (
        <AccountSettings
          open={accountSettingsOpen}
          onClose={() => setAccountSettingsOpen(false)}
          user={user}
          onProfileUpdate={(u) => setUser(u)}
          onLogout={() => {
            setUser(null);
            setAccountSettingsOpen(false);
          }}
        />
      )}
      <ThemePickerModal
        open={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        currentTheme={themeId}
        onSelectTheme={(id) => {
          handleThemeChange(id);
          setThemeModalOpen(false);
        }}
      />
    </>
  );

  if (view === "home") {
    const todayLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

    return (
      <>
        {authModals}
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
                  <button className="link-btn" type="button" onClick={() => setView("stats")}>
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
                    onClick={() => void startDailyChallenge()}
                    type="button"
                  >
                    {dailyStatus === "done" ? "View Result" : "Play Now"}
                  </button>
                </div>
              </div>

              <TournamentCard
                tournament={activeTournament}
                loading={loading}
                onEnter={(id) => {
                  if (activeTournament?.id === id) {
                    if (activeTournament.status === "active") {
                      void startTournamentGame(activeTournament);
                    }
                    setView("tournament");
                  }
                }}
                onViewLeaderboard={() => {
                  if (activeTournament) goToLeaderboard(activeTournament);
                }}
              />
            </div>
          </div>
        </main>
        {bottomNav}
      </>
    );
  }

  // Tournament pre-play / result view (no game board yet)
  if (view === "tournament" && activeTournament) {
    return (
      <TournamentView
        tournament={activeTournament}
        gameState={null}
        submitting={false}
        submitResult={tournamentSubmitResult}
        submitError={null}
        onStartGame={() => void startTournamentGame(activeTournament)}
        onSubmitEntry={() => void handleTournamentSubmit()}
        onViewLeaderboard={() => goToLeaderboard(activeTournament!)}
        onBack={() => setView("home")}
      />
    );
  }

  // Leaderboard view
  if (view === "leaderboard" && leaderboardTournament) {
    return (
      <LeaderboardView
        tournament={leaderboardTournament}
        onBack={() => setView("home")}
      />
    );
  }

  // Stats view
  if (view === "stats") {
    return (
      <>
        {authModals}
        <StatsView onBack={() => setView("home")} />
        {bottomNav}
      </>
    );
  }

  if (!history.present) {
    return null;
  }


  return (
    <>
      {authModals}
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
            <button className="btn-pill" onClick={() => { setTournamentMode(false); setView("home"); }} style={{ marginTop: 12 }} type="button">
              New Game
            </button>
          </div>
        ) : history.present.completedAt ? (
          <div className="completed-banner">
            Puzzle Solved!
            {tournamentMode && activeTournament && !tournamentSubmitResult && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                {tournamentSubmitError && (
                  <div style={{ color: "var(--error)", fontSize: "0.85rem" }}>{tournamentSubmitError}</div>
                )}
                <button
                  className="btn-primary"
                  disabled={tournamentSubmitting}
                  onClick={() => void handleTournamentSubmit()}
                  type="button"
                >
                  {tournamentSubmitting ? "Submitting…" : "Submit to Tournament"}
                </button>
              </div>
            )}
            {tournamentMode && tournamentSubmitResult && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  Rank #{tournamentSubmitResult.rank} · {tournamentSubmitResult.score} pts
                </span>
                <button className="btn-primary" onClick={() => activeTournament && goToLeaderboard(activeTournament)} type="button">
                  <span className="material-symbols-outlined">leaderboard</span>
                  View Leaderboard
                </button>
              </div>
            )}
            {!user && (
              <div className="guest-upgrade-prompt">
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>cloud_upload</span>
                Save progress across devices.{" "}
                <button className="auth-link" type="button" onClick={() => setAuthModalOpen(true)}>
                  Create an account
                </button>
              </div>
            )}
          </div>
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
                void handleDigitInput(history.present.selectedCell!, digit)
              }
              type="button"
            >
              {digit}
            </button>
            );
          })}
          <button
            className="num-key hint-key"
            disabled={
              !puzzleIdRef.current ||
              history.present.selectedCell === null ||
              isGivenCell(history.present, history.present.selectedCell) ||
              !!history.present.completedAt ||
              history.present.gameOver
            }
            onClick={handleHint}
            type="button"
          >
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
