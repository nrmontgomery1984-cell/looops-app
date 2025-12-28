// Todoist API Routes
import { Router } from "express";
import * as todoistService from "../services/todoistService.js";

const router = Router();

const TODOIST_API_BASE = "https://api.todoist.com/rest/v2";

// Helper to extract token from Authorization header
function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// Helper to make Todoist API request with client-provided token
async function todoistRequestWithToken(token, endpoint, options = {}) {
  const response = await fetch(`${TODOIST_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return { needsReauth: true };
    }
    if (response.status === 204) {
      return null;
    }
    const error = await response.text();
    throw new Error(`Todoist API error: ${error}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Label to Loop mapping
const DEFAULT_LABEL_MAPPING = {
  health: "Health",
  Health: "Health",
  wealth: "Wealth",
  Wealth: "Wealth",
  family: "Family",
  Family: "Family",
  work: "Work",
  Work: "Work",
  fun: "Fun",
  Fun: "Fun",
  maintenance: "Maintenance",
  Maintenance: "Maintenance",
  meaning: "Meaning",
  Meaning: "Meaning",
};

// Priority mapping
const PRIORITY_MAP = {
  1: 4, // Todoist p4 -> Looops 4
  2: 3, // Todoist p3 -> Looops 3
  3: 2, // Todoist p2 -> Looops 2
  4: 1, // Todoist p1 -> Looops 1
};

function mapLabelsToLoop(labels) {
  for (const label of labels) {
    if (DEFAULT_LABEL_MAPPING[label]) {
      return DEFAULT_LABEL_MAPPING[label];
    }
  }
  return "Work"; // Default
}

/**
 * GET /api/todoist/status
 * Check if Todoist is configured
 */
router.get("/status", (req, res) => {
  const configured = todoistService.isConfigured();
  res.json({
    configured,
    message: configured
      ? "Todoist is connected"
      : "Add TODOIST_API_TOKEN to .env",
  });
});

/**
 * GET /api/todoist/sync
 * Full sync - get all tasks, labels, projects
 * Supports client-provided tokens
 */
router.get("/sync", async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (token) {
      // Use client-provided token
      const [tasksResult, labelsResult, projectsResult] = await Promise.all([
        todoistRequestWithToken(token, "/tasks"),
        todoistRequestWithToken(token, "/labels"),
        todoistRequestWithToken(token, "/projects"),
      ]);

      // Check for reauth
      if (tasksResult?.needsReauth || labelsResult?.needsReauth) {
        return res.json({ needsReauth: true });
      }

      // Format tasks
      const tasks = (tasksResult || []).map((task) => ({
        id: task.id,
        todoistId: task.id,
        title: task.content,
        description: task.description || "",
        loop: mapLabelsToLoop(task.labels || []),
        labels: task.labels || [],
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

      // Format labels
      const labels = (labelsResult || []).map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        order: label.order,
        loop: DEFAULT_LABEL_MAPPING[label.name] || null,
      }));

      // Format projects
      const projects = (projectsResult || []).map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color,
        parentId: project.parent_id,
        order: project.order,
        isFavorite: project.is_favorite,
      }));

      return res.json({
        source: "todoist",
        data: {
          tasks,
          labels,
          projects,
          syncedAt: new Date().toISOString(),
        },
      });
    }

    // Fall back to server-stored token
    const data = await todoistService.fullSync();
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "todoist", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/todoist/tasks
 * Get all tasks, optionally filtered
 */
router.get("/tasks", async (req, res, next) => {
  try {
    const { filter } = req.query;
    const tasks = await todoistService.getTasks(filter);
    if (tasks === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "todoist", data: tasks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/todoist/tasks/today
 * Get tasks due today
 */
router.get("/tasks/today", async (req, res, next) => {
  try {
    const tasks = await todoistService.getTodayTasks();
    if (tasks === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "todoist", data: tasks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/todoist/tasks/week
 * Get tasks due this week
 */
router.get("/tasks/week", async (req, res, next) => {
  try {
    const tasks = await todoistService.getWeekTasks();
    if (tasks === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "todoist", data: tasks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/todoist/tasks/overdue
 * Get overdue tasks
 */
router.get("/tasks/overdue", async (req, res, next) => {
  try {
    const tasks = await todoistService.getOverdueTasks();
    if (tasks === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "todoist", data: tasks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/todoist/tasks/loop/:loop
 * Get tasks by loop (label)
 */
router.get("/tasks/loop/:loop", async (req, res, next) => {
  try {
    const { loop } = req.params;
    const tasks = await todoistService.getTasksByLabel(loop.toLowerCase());
    if (tasks === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "todoist", data: tasks });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/todoist/tasks
 * Create a new task
 */
router.post("/tasks", async (req, res, next) => {
  try {
    const task = await todoistService.createTask(req.body);
    if (task === null) {
      return res.status(400).json({ error: "Todoist not configured" });
    }
    res.json({ source: "todoist", data: task });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/todoist/tasks/:id
 * Update a task
 */
router.put("/tasks/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await todoistService.updateTask(id, req.body);
    if (task === null) {
      return res.status(400).json({ error: "Todoist not configured" });
    }
    res.json({ source: "todoist", data: task });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/todoist/tasks/:id/complete
 * Complete a task
 */
router.post("/tasks/:id/complete", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await todoistService.completeTask(id);
    if (result === null) {
      return res.status(400).json({ error: "Todoist not configured" });
    }
    res.json({ source: "todoist", data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/todoist/tasks/:id/reopen
 * Reopen a completed task
 */
router.post("/tasks/:id/reopen", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await todoistService.reopenTask(id);
    if (result === null) {
      return res.status(400).json({ error: "Todoist not configured" });
    }
    res.json({ source: "todoist", data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/todoist/tasks/:id
 * Delete a task
 */
router.delete("/tasks/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await todoistService.deleteTask(id);
    if (result === null) {
      return res.status(400).json({ error: "Todoist not configured" });
    }
    res.json({ source: "todoist", data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/todoist/labels
 * Get all labels
 */
router.get("/labels", async (req, res, next) => {
  try {
    const labels = await todoistService.getLabels();
    if (labels === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "todoist", data: labels });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/todoist/projects
 * Get all projects
 */
router.get("/projects", async (req, res, next) => {
  try {
    const projects = await todoistService.getProjects();
    if (projects === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "todoist", data: projects });
  } catch (error) {
    next(error);
  }
});

export default router;
