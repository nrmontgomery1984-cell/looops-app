// History Screen - Shows completion history with stats and charts

import { useMemo } from "react";
import { Task, LoopId, LOOP_DEFINITIONS, LOOP_COLORS } from "../../types";

type HistoryScreenProps = {
  tasks: Task[];
};

type DayStats = {
  date: string;
  completed: number;
  byLoop: Record<LoopId, number>;
};

type StreakInfo = {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
};

export function HistoryScreen({ tasks }: HistoryScreenProps) {
  // Get completed tasks
  const completedTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === "done" && t.completedAt)
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
  }, [tasks]);

  // Calculate daily stats for the last 30 days
  const dailyStats = useMemo(() => {
    const stats: DayStats[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayTasks = completedTasks.filter((t) => {
        const completedDate = t.completedAt?.split("T")[0];
        return completedDate === dateStr;
      });

      const byLoop: Record<LoopId, number> = {
        Health: 0,
        Wealth: 0,
        Family: 0,
        Work: 0,
        Fun: 0,
        Maintenance: 0,
        Meaning: 0,
      };

      dayTasks.forEach((t) => {
        byLoop[t.loop] = (byLoop[t.loop] || 0) + 1;
      });

      stats.push({
        date: dateStr,
        completed: dayTasks.length,
        byLoop,
      });
    }

    return stats;
  }, [completedTasks]);

  // Calculate streak info
  const streakInfo = useMemo((): StreakInfo => {
    if (completedTasks.length === 0) {
      return { current: 0, longest: 0, lastCompletedDate: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unique completion dates
    const completionDates = new Set<string>();
    completedTasks.forEach((t) => {
      if (t.completedAt) {
        completionDates.add(t.completedAt.split("T")[0]);
      }
    });

    const sortedDates = Array.from(completionDates).sort().reverse();
    const lastCompletedDate = sortedDates[0] || null;

    // Calculate current streak
    let current = 0;
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    // Start from today or yesterday
    let checkDate = new Date(today);
    if (completionDates.has(todayStr)) {
      current = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (completionDates.has(yesterdayStr)) {
      current = 1;
      checkDate = yesterdayDate;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (current > 0) {
      while (true) {
        const checkStr = checkDate.toISOString().split("T")[0];
        if (completionDates.has(checkStr)) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longest = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    sortedDates.reverse().forEach((dateStr) => {
      const date = new Date(dateStr);
      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const diff = Math.round(
          (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === 1) {
          tempStreak++;
        } else {
          longest = Math.max(longest, tempStreak);
          tempStreak = 1;
        }
      }
      prevDate = date;
    });
    longest = Math.max(longest, tempStreak);

    return { current, longest, lastCompletedDate };
  }, [completedTasks]);

  // Calculate loop-specific stats
  const loopStats = useMemo(() => {
    const stats: Record<LoopId, { total: number; thisWeek: number }> = {
      Health: { total: 0, thisWeek: 0 },
      Wealth: { total: 0, thisWeek: 0 },
      Family: { total: 0, thisWeek: 0 },
      Work: { total: 0, thisWeek: 0 },
      Fun: { total: 0, thisWeek: 0 },
      Maintenance: { total: 0, thisWeek: 0 },
      Meaning: { total: 0, thisWeek: 0 },
    };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    completedTasks.forEach((t) => {
      stats[t.loop].total++;
      if (t.completedAt && t.completedAt >= weekAgoStr) {
        stats[t.loop].thisWeek++;
      }
    });

    return stats;
  }, [completedTasks]);

  // Total stats
  const totalStats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const thisWeek = completedTasks.filter(
      (t) => t.completedAt && t.completedAt >= weekAgoStr
    ).length;

    return {
      total: completedTasks.length,
      thisWeek,
      avgPerDay: Math.round(thisWeek / 7 * 10) / 10,
    };
  }, [completedTasks]);

  // Get max for chart scaling
  const maxDaily = Math.max(...dailyStats.map((d) => d.completed), 1);

  return (
    <div className="screen history-screen">
      <div className="screen-header">
        <h2>History</h2>
        <p className="screen-description">Review your completed tasks, track streaks, and see your productivity patterns</p>
      </div>

      {/* Stats Overview */}
      <div className="history-stats-grid">
        <div className="history-stat-card">
          <span className="history-stat-value">{totalStats.total}</span>
          <span className="history-stat-label">Total Completed</span>
        </div>
        <div className="history-stat-card">
          <span className="history-stat-value">{totalStats.thisWeek}</span>
          <span className="history-stat-label">This Week</span>
        </div>
        <div className="history-stat-card">
          <span className="history-stat-value">{totalStats.avgPerDay}</span>
          <span className="history-stat-label">Avg Per Day</span>
        </div>
        <div className="history-stat-card streak">
          <span className="history-stat-value">{streakInfo.current}</span>
          <span className="history-stat-label">Day Streak</span>
          {streakInfo.longest > streakInfo.current && (
            <span className="history-stat-best">Best: {streakInfo.longest}</span>
          )}
        </div>
      </div>

      {/* 30-Day Activity Chart */}
      <div className="history-section">
        <h3>Last 30 Days</h3>
        <div className="history-chart">
          {dailyStats.map((day, idx) => {
            const height = day.completed > 0 ? (day.completed / maxDaily) * 100 : 0;
            const date = new Date(day.date);
            const isToday = idx === 0;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div
                key={day.date}
                className={`history-chart-bar ${isToday ? "today" : ""} ${isWeekend ? "weekend" : ""}`}
                title={`${day.date}: ${day.completed} tasks`}
              >
                <div
                  className="history-chart-fill"
                  style={{ height: `${height}%` }}
                />
                {idx % 7 === 0 && (
                  <span className="history-chart-label">
                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Loop Breakdown */}
      <div className="history-section">
        <h3>By Loop</h3>
        <div className="history-loops-grid">
          {(Object.keys(loopStats) as LoopId[])
            .filter((loopId) => loopId !== "Meaning")
            .map((loopId) => {
              const loop = LOOP_DEFINITIONS[loopId];
              const color = LOOP_COLORS[loopId];
              const stats = loopStats[loopId];

              return (
                <div
                  key={loopId}
                  className="history-loop-card"
                  style={{
                    "--loop-color": color.text,
                    "--loop-bg": color.bg,
                  } as React.CSSProperties}
                >
                  <span className="history-loop-icon">{loop.icon}</span>
                  <div className="history-loop-info">
                    <span className="history-loop-name">{loop.name}</span>
                    <span className="history-loop-stats">
                      {stats.thisWeek} this week / {stats.total} total
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Recent Completions */}
      <div className="history-section">
        <h3>Recent Completions</h3>
        <div className="history-list">
          {completedTasks.slice(0, 20).map((task) => {
            const loop = LOOP_DEFINITIONS[task.loop];
            const loopColor = LOOP_COLORS[task.loop];

            return (
              <div key={task.id} className="history-item">
                <span className="history-check">✓</span>
                <div className="history-content">
                  <span className="history-title">{task.title}</span>
                  <span
                    className="history-loop"
                    style={{ color: loopColor.text }}
                  >
                    {loop.icon} {loop.name}
                  </span>
                </div>
                <span className="history-date">
                  {task.completedAt
                    ? formatRelativeDate(task.completedAt)
                    : ""}
                </span>
              </div>
            );
          })}
          {completedTasks.length === 0 && (
            <div className="history-empty">
              <span className="history-empty-icon">📋</span>
              <span className="history-empty-text">No completed tasks yet</span>
              <span className="history-empty-hint">
                Complete some tasks and they'll appear here
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default HistoryScreen;
