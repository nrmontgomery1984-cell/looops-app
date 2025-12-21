// Todoist Sync Service
// Handles syncing tasks between Looops and Todoist

import { Task, LoopId } from "../types";

const API_BASE = "/api/todoist";

// Todoist task shape from API
interface TodoistTask {
  id: string;
  todoistId: string;
  title: string;
  description: string;
  loop: LoopId;
  labels: string[];
  projectId: string | null;
  sectionId: string | null;
  parentId: string | null;
  priority: number;
  dueDate: string | null;
  dueString: string | null;
  isRecurring: boolean;
  url: string;
  order: number;
  createdAt: string;
}

interface TodoistSyncResult {
  tasks: TodoistTask[];
  labels: Array<{ id: string; name: string; loop: LoopId | null }>;
  projects: Array<{ id: string; name: string }>;
  syncedAt: string;
}

/**
 * Check if Todoist is configured
 */
export async function checkTodoistStatus(): Promise<{
  configured: boolean;
  message: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/status`);
    return res.json();
  } catch (error) {
    return { configured: false, message: "Server not available" };
  }
}

/**
 * Full sync from Todoist
 */
export async function syncFromTodoist(): Promise<TodoistSyncResult | null> {
  try {
    const res = await fetch(`${API_BASE}/sync`);
    const data = await res.json();

    if (data.source === "local" || !data.data) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Todoist sync failed:", error);
    return null;
  }
}

/**
 * Get today's tasks from Todoist
 */
export async function getTodayTasks(): Promise<TodoistTask[] | null> {
  try {
    const res = await fetch(`${API_BASE}/tasks/today`);
    const data = await res.json();

    if (data.source === "local" || !data.data) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Failed to fetch today tasks:", error);
    return null;
  }
}

/**
 * Get tasks by loop
 */
export async function getTasksByLoop(loop: LoopId): Promise<TodoistTask[] | null> {
  try {
    const res = await fetch(`${API_BASE}/tasks/loop/${loop}`);
    const data = await res.json();

    if (data.source === "local" || !data.data) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Failed to fetch loop tasks:", error);
    return null;
  }
}

/**
 * Convert Todoist task to Looops task format
 */
export function todoistToLooopsTask(todoistTask: TodoistTask): Task {
  return {
    id: `todoist_${todoistTask.id}`,
    title: todoistTask.title,
    description: todoistTask.description,
    status: "todo",
    priority: todoistTask.priority as 1 | 2 | 3 | 4,
    loop: todoistTask.loop,
    dueDate: todoistTask.dueDate || undefined,
    labels: todoistTask.labels,
    source: "todoist",
    externalId: todoistTask.id,
    externalUrl: todoistTask.url,
    createdAt: todoistTask.createdAt,
    updatedAt: new Date().toISOString(),
    order: todoistTask.order,
    // Recurrence info
    recurrence: todoistTask.isRecurring
      ? {
          frequency: "custom" as const,
          interval: 1,
          daysOfWeek: [],
        }
      : undefined,
  };
}

/**
 * Convert Looops task to Todoist format for creation
 */
export function looopsToTodoistTask(task: Task): Partial<TodoistTask> {
  return {
    title: task.title,
    description: task.description || "",
    labels: task.labels || [],
    priority: task.priority || 4,
    dueDate: task.dueDate || null,
    loop: task.loop,
  };
}

/**
 * Create a task in Todoist
 */
export async function createTodoistTask(
  task: Partial<TodoistTask>
): Promise<TodoistTask | null> {
  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    const data = await res.json();

    if (!data.data) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Failed to create Todoist task:", error);
    return null;
  }
}

/**
 * Update a task in Todoist
 */
export async function updateTodoistTask(
  taskId: string,
  updates: Partial<TodoistTask>
): Promise<TodoistTask | null> {
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();

    if (!data.data) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Failed to update Todoist task:", error);
    return null;
  }
}

/**
 * Complete a task in Todoist
 */
export async function completeTodoistTask(taskId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
      method: "POST",
    });
    const data = await res.json();
    return data.data?.success || false;
  } catch (error) {
    console.error("Failed to complete Todoist task:", error);
    return false;
  }
}

/**
 * Reopen a task in Todoist
 */
export async function reopenTodoistTask(taskId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/reopen`, {
      method: "POST",
    });
    const data = await res.json();
    return data.data?.success || false;
  } catch (error) {
    console.error("Failed to reopen Todoist task:", error);
    return false;
  }
}

/**
 * Delete a task in Todoist
 */
export async function deleteTodoistTask(taskId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return data.data?.success || false;
  } catch (error) {
    console.error("Failed to delete Todoist task:", error);
    return false;
  }
}

/**
 * Merge Todoist tasks with local tasks
 * - Todoist tasks take precedence for tasks with externalId
 * - Local-only tasks are preserved
 */
export function mergeTasksWithTodoist(
  localTasks: Task[],
  todoistTasks: TodoistTask[]
): Task[] {
  const merged: Task[] = [];
  const processedExternalIds = new Set<string>();

  // Convert Todoist tasks
  for (const tt of todoistTasks) {
    merged.push(todoistToLooopsTask(tt));
    processedExternalIds.add(tt.id);
  }

  // Add local tasks that don't have a Todoist counterpart
  for (const lt of localTasks) {
    if (lt.source !== "todoist" || !lt.externalId) {
      merged.push(lt);
    } else if (!processedExternalIds.has(lt.externalId)) {
      // Task was in Todoist but now deleted
      // Keep it locally but mark as deleted from source
      merged.push({ ...lt, source: "local" });
    }
  }

  return merged;
}

export default {
  checkTodoistStatus,
  syncFromTodoist,
  getTodayTasks,
  getTasksByLoop,
  todoistToLooopsTask,
  looopsToTodoistTask,
  createTodoistTask,
  updateTodoistTask,
  completeTodoistTask,
  reopenTodoistTask,
  deleteTodoistTask,
  mergeTasksWithTodoist,
};
