// Todoist API Routes
import { Router } from "express";
import * as todoistService from "../services/todoistService.js";

const router = Router();

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
 */
router.get("/sync", async (req, res, next) => {
  try {
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
