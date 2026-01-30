// TaskTimer - Time tracking component for tasks
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';

interface TaskTimerProps {
  task: Task;
  compact?: boolean; // For inline display in task lists
}

export function TaskTimer({ task, compact = false }: TaskTimerProps) {
  const { state, dispatch } = useApp();
  const [displayTime, setDisplayTime] = useState('00:00:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeTimer = state.activeTimer;
  const isThisTaskActive = activeTimer?.taskId === task.id;
  const isPaused = isThisTaskActive && !!activeTimer?.pausedAt;
  const isRunning = isThisTaskActive && !isPaused;

  // Update display time every second when timer is running
  useEffect(() => {
    if (isRunning && activeTimer) {
      const updateTime = () => {
        const elapsed = activeTimer.accumulatedSeconds +
          Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);
        setDisplayTime(formatTime(elapsed));
      };

      updateTime(); // Initial update
      intervalRef.current = setInterval(updateTime, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (isPaused && activeTimer) {
      setDisplayTime(formatTime(activeTimer.accumulatedSeconds));
    } else if (!isThisTaskActive) {
      setDisplayTime('00:00:00');
    }
  }, [isRunning, isPaused, isThisTaskActive, activeTimer]);

  const handleStart = () => {
    dispatch({ type: 'START_TASK_TIMER', payload: task.id });
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_TASK_TIMER' });
  };

  const handleResume = () => {
    dispatch({ type: 'RESUME_TASK_TIMER' });
  };

  const handleStop = () => {
    dispatch({ type: 'STOP_TASK_TIMER' });
  };

  const handleCancel = () => {
    if (confirm('Discard this time entry?')) {
      dispatch({ type: 'CANCEL_TASK_TIMER' });
    }
  };

  // Format seconds as HH:MM:SS
  function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Compact view for task lists
  if (compact) {
    if (!isThisTaskActive && !task.actualMinutes) {
      return (
        <button
          className="timer-compact-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleStart();
          }}
          title="Start timer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      );
    }

    if (isThisTaskActive) {
      return (
        <div className="timer-compact-active" onClick={(e) => e.stopPropagation()}>
          <span className={`timer-compact-time ${isRunning ? 'running' : 'paused'}`}>
            {displayTime}
          </span>
          {isRunning ? (
            <button className="timer-compact-btn" onClick={handlePause} title="Pause">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>
          ) : (
            <button className="timer-compact-btn" onClick={handleResume} title="Resume">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
          <button className="timer-compact-btn stop" onClick={handleStop} title="Stop">
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>
      );
    }

    // Show total time if tracked
    if (task.actualMinutes) {
      return (
        <button
          className="timer-compact-btn has-time"
          onClick={(e) => {
            e.stopPropagation();
            handleStart();
          }}
          title={`${task.actualMinutes}m tracked - click to start new session`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          <span>{formatMinutes(task.actualMinutes)}</span>
        </button>
      );
    }

    return null;
  }

  // Full timer view
  return (
    <div className="task-timer">
      <div className="timer-display">
        <span className={`timer-time ${isRunning ? 'running' : isPaused ? 'paused' : ''}`}>
          {displayTime}
        </span>
        {task.estimateMinutes && (
          <span className="timer-estimate">
            / {formatMinutes(task.estimateMinutes)} estimated
          </span>
        )}
      </div>

      <div className="timer-controls">
        {!isThisTaskActive ? (
          <button className="timer-btn start" onClick={handleStart}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M8 5v14l11-7z" />
            </svg>
            Start Timer
          </button>
        ) : (
          <>
            {isRunning ? (
              <button className="timer-btn pause" onClick={handlePause}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                Pause
              </button>
            ) : (
              <button className="timer-btn resume" onClick={handleResume}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Resume
              </button>
            )}
            <button className="timer-btn stop" onClick={handleStop}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M6 6h12v12H6z" />
              </svg>
              Stop
            </button>
            <button className="timer-btn cancel" onClick={handleCancel}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Time tracking summary */}
      {(task.actualMinutes || task.timeEntries?.length) && (
        <div className="timer-summary">
          <div className="timer-summary-header">
            <span>Time Tracked</span>
            <span className="timer-total">{formatMinutes(task.actualMinutes || 0)}</span>
          </div>
          {task.estimateMinutes && (
            <div className="timer-progress">
              <div
                className="timer-progress-bar"
                style={{
                  width: `${Math.min(100, ((task.actualMinutes || 0) / task.estimateMinutes) * 100)}%`,
                  backgroundColor: (task.actualMinutes || 0) > task.estimateMinutes ? '#ef4444' : '#22c55e',
                }}
              />
            </div>
          )}
          {task.timeEntries && task.timeEntries.length > 0 && (
            <div className="timer-entries">
              <details>
                <summary>{task.timeEntries.length} session{task.timeEntries.length !== 1 ? 's' : ''}</summary>
                <ul>
                  {task.timeEntries.slice(-5).reverse().map((entry) => (
                    <li key={entry.id}>
                      <span className="entry-time">{formatMinutes(entry.durationMinutes || 0)}</span>
                      <span className="entry-date">
                        {new Date(entry.startTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {entry.note && <span className="entry-note">{entry.note}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper to format minutes as human-readable
function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default TaskTimer;
