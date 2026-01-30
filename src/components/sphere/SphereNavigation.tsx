// SphereNavigation - Hierarchical gesture-based navigation
// Level 1: Life Sphere (single centered sphere, aggregate score)
// Level 2: Domain Spheres (one large, adjacent peek)
// Level 3: Tasks (one centered, adjacent peek)

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import {
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  Task,
  LoopState,
} from "../../types";
import { OpusChatPanel } from "../opus/OpusChatPanel";
import { OpusDomainId } from "../../opus/types/opus-types";
import "./SphereNavigation.css";

type NavigationLevel = 1 | 2 | 3;

interface SphereNavigationProps {
  tasks: Task[];
  loopStates: Record<LoopId, LoopState>;
  onSelectTask?: (taskId: string) => void;
  onOpenLoopDashboard?: (loopId: LoopId) => void;
}

const loopToOpusDomain = (loopId: LoopId | null): OpusDomainId => {
  if (!loopId) return "Life";
  return loopId as OpusDomainId;
};

const STATE_SCORES: Record<string, number> = {
  BUILD: 100,
  MAINTAIN: 75,
  RECOVER: 50,
  HIBERNATE: 25,
};

export function SphereNavigation({
  tasks,
  loopStates,
  onSelectTask,
  onOpenLoopDashboard,
}: SphereNavigationProps) {
  const [level, setLevel] = useState<NavigationLevel>(1);
  const [domainIndex, setDomainIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [transDir, setTransDir] = useState<string | null>(null);

  // Opus chat
  const [showOpus, setShowOpus] = useState(false);
  const [opusDomain, setOpusDomain] = useState<OpusDomainId>("Life");

  // Long press
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const selectedDomain = ALL_LOOPS[domainIndex];
  const domainTasks = tasks.filter(
    (t) => t.loop === selectedDomain && t.status !== "done"
  );
  const currentTask = domainTasks[taskIndex] || null;

  const lifeScore = useCallback(() => {
    let total = 0;
    let count = 0;
    ALL_LOOPS.forEach((id) => {
      const s = loopStates[id];
      if (s) {
        total += STATE_SCORES[s.currentState] || 50;
        count++;
      }
    });
    return count > 0 ? Math.round(total / count) : 75;
  }, [loopStates]);

  // Transition wrapper
  const doTransition = useCallback(
    (dir: string, fn: () => void) => {
      if (transitioning) return;
      setTransitioning(true);
      setTransDir(dir);
      fn();
      setTimeout(() => {
        setTransitioning(false);
        setTransDir(null);
      }, 300);
    },
    [transitioning]
  );

  // Navigation
  const goDeeper = useCallback(() => {
    if (level === 1) {
      doTransition("up", () => setLevel(2));
    } else if (level === 2) {
      setTaskIndex(0);
      doTransition("up", () => setLevel(3));
    }
  }, [level, doTransition]);

  const goBack = useCallback(() => {
    if (level === 2) {
      doTransition("down", () => setLevel(1));
    } else if (level === 3) {
      doTransition("down", () => setLevel(2));
    }
  }, [level, doTransition]);

  const goLeft = useCallback(() => {
    if (level === 2) {
      doTransition("left", () => {
        setDomainIndex((i) => (i > 0 ? i - 1 : ALL_LOOPS.length - 1));
        setTaskIndex(0);
      });
    } else if (level === 3 && domainTasks.length > 1) {
      doTransition("left", () => {
        setTaskIndex((i) => (i > 0 ? i - 1 : domainTasks.length - 1));
      });
    }
  }, [level, domainTasks.length, doTransition]);

  const goRight = useCallback(() => {
    if (level === 2) {
      doTransition("right", () => {
        setDomainIndex((i) => (i < ALL_LOOPS.length - 1 ? i + 1 : 0));
        setTaskIndex(0);
      });
    } else if (level === 3 && domainTasks.length > 1) {
      doTransition("right", () => {
        setTaskIndex((i) => (i < domainTasks.length - 1 ? i + 1 : 0));
      });
    }
  }, [level, domainTasks.length, doTransition]);

  // Swipe: left swipe = go right (next), right swipe = go left (prev)
  const swipeHandlers = useSwipeable({
    onSwipedUp: () => goDeeper(),
    onSwipedDown: () => goBack(),
    onSwipedLeft: () => goRight(),
    onSwipedRight: () => goLeft(),
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 50,
  });

  // Long press (500ms)
  const startPress = useCallback(
    (domain: LoopId | null) => {
      didLongPress.current = false;
      lpTimer.current = setTimeout(() => {
        didLongPress.current = true;
        setOpusDomain(loopToOpusDomain(domain));
        setShowOpus(true);
      }, 500);
    },
    []
  );

  const endPress = useCallback(() => {
    if (lpTimer.current) {
      clearTimeout(lpTimer.current);
      lpTimer.current = null;
    }
  }, []);

  const handleTap = useCallback((action: () => void) => {
    if (!didLongPress.current) {
      action();
    }
    didLongPress.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (lpTimer.current) clearTimeout(lpTimer.current);
    };
  }, []);

  // Adjacent helpers
  const adjDomains = () => {
    const prev = ALL_LOOPS[(domainIndex - 1 + ALL_LOOPS.length) % ALL_LOOPS.length];
    const next = ALL_LOOPS[(domainIndex + 1) % ALL_LOOPS.length];
    return { prev, next };
  };

  const adjTasks = () => {
    if (domainTasks.length <= 1) return { prev: null, next: null };
    const prev = domainTasks[(taskIndex - 1 + domainTasks.length) % domainTasks.length];
    const next = domainTasks[(taskIndex + 1) % domainTasks.length];
    return { prev, next };
  };

  const tc = transDir ? `sn-trans sn-trans--${transDir}` : "";

  // ── Level 1: Life Sphere ──
  const renderLevel1 = () => {
    const score = lifeScore();
    return (
      <div className={`sn-level sn-level--life ${tc}`}>
        <div
          className="sn-life"
          onPointerDown={() => startPress(null)}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onClick={() => handleTap(goDeeper)}
        >
          <div className="sn-life__inner">
            <div className="sn-life__score">{score}</div>
            <div className="sn-life__label">Life</div>
          </div>
          <div className="sn-life__rings">
            {ALL_LOOPS.map((loopId, i) => {
              const state = loopStates[loopId]?.currentState || "MAINTAIN";
              const color = LOOP_COLORS[loopId].border;
              return (
                <div
                  key={loopId}
                  className={`sn-life__ring sn-life__ring--${state.toLowerCase()}`}
                  style={{
                    "--ring-color": color,
                    "--ring-rotation": `${(i * 360) / ALL_LOOPS.length}deg`,
                  } as React.CSSProperties}
                />
              );
            })}
          </div>
        </div>
        <div className="sn-hint">
          <span className="sn-hint__arrow">↑</span> Swipe up to explore
        </div>
        <div className="sn-hint sn-hint--sub">Hold for Life Opus</div>
      </div>
    );
  };

  // ── Level 2: Domain Spheres ──
  const renderLevel2 = () => {
    const { prev, next } = adjDomains();
    const def = LOOP_DEFINITIONS[selectedDomain];
    const color = LOOP_COLORS[selectedDomain];
    const state = loopStates[selectedDomain]?.currentState || "MAINTAIN";
    const count = domainTasks.length;

    return (
      <div className={`sn-level sn-level--domain ${tc}`}>
        {/* Prev peek */}
        <div className="sn-peek sn-peek--left" onClick={() => handleTap(goLeft)}>
          <div
            className="sn-peek__sphere"
            style={{ "--peek-color": LOOP_COLORS[prev].border } as React.CSSProperties}
          >
            <span className="sn-peek__icon">{LOOP_DEFINITIONS[prev].icon}</span>
          </div>
        </div>

        {/* Center domain */}
        <div
          className="sn-domain"
          style={{ "--domain-color": color.border } as React.CSSProperties}
          onPointerDown={() => startPress(selectedDomain)}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onClick={() => handleTap(() => onOpenLoopDashboard?.(selectedDomain))}
        >
          <span className="sn-domain__icon">{def.icon}</span>
          <span className="sn-domain__name">{def.name}</span>
          <span className={`sn-domain__state sn-domain__state--${state.toLowerCase()}`}>
            {state}
          </span>
          <span className="sn-domain__tasks">{count} task{count !== 1 ? "s" : ""}</span>
        </div>

        {/* Next peek */}
        <div className="sn-peek sn-peek--right" onClick={() => handleTap(goRight)}>
          <div
            className="sn-peek__sphere"
            style={{ "--peek-color": LOOP_COLORS[next].border } as React.CSSProperties}
          >
            <span className="sn-peek__icon">{LOOP_DEFINITIONS[next].icon}</span>
          </div>
        </div>

        {/* Dots */}
        <div className="sn-dots">
          {ALL_LOOPS.map((id, i) => (
            <div
              key={id}
              className={`sn-dots__dot ${i === domainIndex ? "sn-dots__dot--active" : ""}`}
              style={{ "--dot-color": LOOP_COLORS[id].border } as React.CSSProperties}
              onClick={() => {
                setDomainIndex(i);
                setTaskIndex(0);
              }}
            />
          ))}
        </div>

        {/* Hints */}
        <div className="sn-hint sn-hint--top">
          <span className="sn-hint__arrow">↑</span> Tasks
        </div>
        <div className="sn-hint sn-hint--bottom">
          <span className="sn-hint__arrow">↓</span> Life
        </div>
      </div>
    );
  };

  // ── Level 3: Tasks ──
  const renderLevel3 = () => {
    const def = LOOP_DEFINITIONS[selectedDomain];
    const color = LOOP_COLORS[selectedDomain];

    if (domainTasks.length === 0) {
      return (
        <div className={`sn-level sn-level--tasks ${tc}`}>
          <div className="sn-empty">
            <span className="sn-empty__icon">{def.icon}</span>
            <span className="sn-empty__text">No tasks in {def.name}</span>
          </div>
          <div className="sn-hint sn-hint--bottom">
            <span className="sn-hint__arrow">↓</span> Back to {def.name}
          </div>
        </div>
      );
    }

    const { prev, next } = adjTasks();

    return (
      <div className={`sn-level sn-level--tasks ${tc}`}>
        {/* Prev task peek */}
        {prev && (
          <div className="sn-task-peek sn-task-peek--left" onClick={() => handleTap(goLeft)}>
            <div className="sn-task-peek__card">
              <span className="sn-task-peek__title">{prev.title}</span>
            </div>
          </div>
        )}

        {/* Current task */}
        <div
          className="sn-task"
          style={{ "--task-color": color.border } as React.CSSProperties}
          onPointerDown={() =>
            startPress(selectedDomain)
          }
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onClick={() => handleTap(() => onSelectTask?.(currentTask?.id || ""))}
        >
          <div className="sn-task__domain">
            <span>{def.icon}</span> <span>{def.name}</span>
          </div>
          <h3 className="sn-task__title">{currentTask?.title}</h3>
          {currentTask?.description && (
            <p className="sn-task__desc">{currentTask.description}</p>
          )}
          <div className="sn-task__meta">
            {currentTask?.dueDate && (
              <span className="sn-task__due">Due: {currentTask.dueDate}</span>
            )}
            <span className="sn-task__status">{currentTask?.status}</span>
          </div>
        </div>

        {/* Next task peek */}
        {next && (
          <div className="sn-task-peek sn-task-peek--right" onClick={() => handleTap(goRight)}>
            <div className="sn-task-peek__card">
              <span className="sn-task-peek__title">{next.title}</span>
            </div>
          </div>
        )}

        {/* Counter */}
        <div className="sn-counter">
          {taskIndex + 1} / {domainTasks.length}
        </div>

        {/* Hints */}
        <div className="sn-hint sn-hint--bottom">
          <span className="sn-hint__arrow">↓</span> {def.name}
        </div>
      </div>
    );
  };

  return (
    <div className="sn" {...swipeHandlers}>
      {/* Level indicator */}
      <div className="sn-indicator">
        {([1, 2, 3] as NavigationLevel[]).map((l) => (
          <div
            key={l}
            className={`sn-indicator__dot ${l === level ? "sn-indicator__dot--active" : ""}`}
          />
        ))}
        <span className="sn-indicator__label">
          {level === 1 ? "Life" : level === 2 ? selectedDomain : "Tasks"}
        </span>
      </div>

      {/* Content */}
      <div className="sn-content">
        {level === 1 && renderLevel1()}
        {level === 2 && renderLevel2()}
        {level === 3 && renderLevel3()}
      </div>

      {/* Opus modal */}
      {showOpus && (
        <div className="sn-opus-overlay" onClick={() => setShowOpus(false)}>
          <div className="sn-opus-panel" onClick={(e) => e.stopPropagation()}>
            <OpusChatPanel
              initialDomain={opusDomain}
              onClose={() => setShowOpus(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SphereNavigation;
