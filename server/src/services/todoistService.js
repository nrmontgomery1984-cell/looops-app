// Todoist Service - Sync tasks between Looops and Todoist
// Uses Todoist REST API v2

const TODOIST_API_BASE = "https://api.todoist.com/rest/v2";

// Label to Loop mapping (customizable)
const DEFAULT_LABEL_MAPPING = {
  health: "Health",
  Health: "Health",
  fitness: "Health",
  wealth: "Wealth",
  Wealth: "Wealth",
  finance: "Wealth",
  family: "Family",
  Family: "Family",
  kids: "Family",
  work: "Work",
  Work: "Work",
  career: "Work",
  fun: "Fun",
  Fun: "Fun",
  hobbies: "Fun",
  maintenance: "Maintenance",
  Maintenance: "Maintenance",
  home: "Maintenance",
  errands: "Maintenance",
  meaning: "Meaning",
  Meaning: "Meaning",
  purpose: "Meaning",
};

// Priority mapping: Todoist p1-p4 to Looops 1-4
const PRIORITY_MAP = {
  1: 4, // Todoist p4 (normal) -> Looops priority 4 (low)
  2: 3, // Todoist p3 -> Looops priority 3 (medium)
  3: 2, // Todoist p2 -> Looops priority 2 (high)
  4: 1, // Todoist p1 (urgent) -> Looops priority 1 (urgent)
};

const REVERSE_PRIORITY_MAP = {
  1: 4, // Looops urgent -> Todoist p1
  2: 3, // Looops high -> Todoist p2
  3: 2, // Looops medium -> Todoist p3
  4: 1, // Looops low -> Todoist p4
};

/**
 * Check if Todoist is configured
 */
export function isConfigured() {
  return !!process.env.TODOIST_API_TOKEN;
}

/**
 * Get API token
 */
function getToken() {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new Error("TODOIST_API_TOKEN not configured");
  }
  return token;
}

/**
 * Make authenticated request to Todoist API
 */
async function todoistRequest(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${TODOIST_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Todoist API error: ${response.status} - ${error}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Map Todoist labels to Loop
 */
function mapLabelsToLoop(labels, customMapping = {}) {
  const mapping = { ...DEFAULT_LABEL_MAPPING, ...customMapping };

  for (const label of labels) {
    if (mapping[label]) {
      return mapping[label];
    }
  }

  // Default to Maintenance
  return "Maintenance";
}

/**
 * Get all labels from Todoist
 */
export async function getLabels() {
  if (!isConfigured()) return null;

  const labels = await todoistRequest("/labels");
  return labels.map((label) => ({
    id: label.id,
    name: label.name,
    color: label.color,
    order: label.order,
    loop: DEFAULT_LABEL_MAPPING[label.name] || null,
  }));
}

/**
 * Get all projects from Todoist
 */
export async function getProjects() {
  if (!isConfigured()) return null;

  const projects = await todoistRequest("/projects");
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    color: project.color,
    parentId: project.parent_id,
    order: project.order,
    isFavorite: project.is_favorite,
  }));
}

/**
 * Get all active tasks from Todoist
 */
export async function getTasks(filter) {
  if (!isConfigured()) return null;

  let endpoint = "/tasks";
  if (filter) {
    endpoint += `?filter=${encodeURIComponent(filter)}`;
  }

  const tasks = await todoistRequest(endpoint);

  return tasks.map((task) => ({
    id: task.id,
    todoistId: task.id,
    title: task.content,
    description: task.description || "",
    loop: mapLabelsToLoop(task.labels),
    labels: task.labels,
    projectId: task.project_id,
    sectionId: task.section_id,
    parentId: task.parent_id,
    priority: PRIORITY_MAP[task.priority] || 4,
    dueDate: task.due?.date || null,
    dueString: task.due?.string || null,
    isRecurring: task.due?.is_recurring || false,
    url: task.url,
    order: task.order,
    createdAt: task.created_at,
  }));
}

/**
 * Get tasks due today
 */
export async function getTodayTasks() {
  return getTasks("today");
}

/**
 * Get tasks due this week
 */
export async function getWeekTasks() {
  return getTasks("7 days");
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks() {
  return getTasks("overdue");
}

/**
 * Get tasks by label (loop)
 */
export async function getTasksByLabel(label) {
  return getTasks(`@${label}`);
}

/**
 * Create a new task in Todoist
 */
export async function createTask(task) {
  if (!isConfigured()) return null;

  const todoistTask = {
    content: task.title,
    description: task.description || "",
    labels: task.labels || [],
    priority: REVERSE_PRIORITY_MAP[task.priority] || 1,
    due_string: task.dueDate || null,
    project_id: task.projectId || null,
  };

  // Add loop as a label if not already present
  if (task.loop && !todoistTask.labels.includes(task.loop.toLowerCase())) {
    todoistTask.labels.push(task.loop.toLowerCase());
  }

  const created = await todoistRequest("/tasks", {
    method: "POST",
    body: JSON.stringify(todoistTask),
  });

  return {
    id: created.id,
    todoistId: created.id,
    title: created.content,
    description: created.description,
    loop: mapLabelsToLoop(created.labels),
    labels: created.labels,
    priority: PRIORITY_MAP[created.priority] || 4,
    dueDate: created.due?.date || null,
    url: created.url,
    createdAt: created.created_at,
  };
}

/**
 * Update a task in Todoist
 */
export async function updateTask(taskId, updates) {
  if (!isConfigured()) return null;

  const todoistUpdates = {};

  if (updates.title !== undefined) {
    todoistUpdates.content = updates.title;
  }
  if (updates.description !== undefined) {
    todoistUpdates.description = updates.description;
  }
  if (updates.labels !== undefined) {
    todoistUpdates.labels = updates.labels;
  }
  if (updates.priority !== undefined) {
    todoistUpdates.priority = REVERSE_PRIORITY_MAP[updates.priority] || 1;
  }
  if (updates.dueDate !== undefined) {
    todoistUpdates.due_string = updates.dueDate;
  }

  const updated = await todoistRequest(`/tasks/${taskId}`, {
    method: "POST",
    body: JSON.stringify(todoistUpdates),
  });

  return {
    id: updated.id,
    todoistId: updated.id,
    title: updated.content,
    description: updated.description,
    loop: mapLabelsToLoop(updated.labels),
    labels: updated.labels,
    priority: PRIORITY_MAP[updated.priority] || 4,
    dueDate: updated.due?.date || null,
    url: updated.url,
  };
}

/**
 * Complete a task in Todoist
 */
export async function completeTask(taskId) {
  if (!isConfigured()) return null;

  await todoistRequest(`/tasks/${taskId}/close`, {
    method: "POST",
  });

  return { success: true, taskId };
}

/**
 * Reopen a completed task in Todoist
 */
export async function reopenTask(taskId) {
  if (!isConfigured()) return null;

  await todoistRequest(`/tasks/${taskId}/reopen`, {
    method: "POST",
  });

  return { success: true, taskId };
}

/**
 * Delete a task from Todoist
 */
export async function deleteTask(taskId) {
  if (!isConfigured()) return null;

  await todoistRequest(`/tasks/${taskId}`, {
    method: "DELETE",
  });

  return { success: true, taskId };
}

/**
 * Full sync - get all data needed for initial load
 */
export async function fullSync() {
  if (!isConfigured()) return null;

  const [tasks, labels, projects] = await Promise.all([
    getTasks(),
    getLabels(),
    getProjects(),
  ]);

  return {
    tasks,
    labels,
    projects,
    syncedAt: new Date().toISOString(),
  };
}

export default {
  isConfigured,
  getLabels,
  getProjects,
  getTasks,
  getTodayTasks,
  getWeekTasks,
  getOverdueTasks,
  getTasksByLabel,
  createTask,
  updateTask,
  completeTask,
  reopenTask,
  deleteTask,
  fullSync,
};
