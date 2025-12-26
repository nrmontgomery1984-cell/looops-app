// Todoist Sync endpoint - fetches tasks and maps labels to loops
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Label to Loop mapping - maps Todoist labels to Looops loops
// Labels are matched case-insensitively
const LABEL_TO_LOOP: Record<string, string> = {
  // Health loop
  'health': 'Health',
  'exercise': 'Health',
  'fitness': 'Health',
  'nutrition': 'Health',
  'sleep': 'Health',
  'medical': 'Health',
  'mental': 'Health',
  'wellness': 'Health',
  'gym': 'Health',
  'workout': 'Health',

  // Wealth loop
  'wealth': 'Wealth',
  'finance': 'Wealth',
  'money': 'Wealth',
  'income': 'Wealth',
  'budgeting': 'Wealth',
  'investing': 'Wealth',
  'saving': 'Wealth',
  'bills': 'Wealth',
  'taxes': 'Wealth',

  // Family loop
  'family': 'Family',
  'partner': 'Family',
  'parenting': 'Family',
  'kids': 'Family',
  'children': 'Family',
  'spouse': 'Family',
  'marriage': 'Family',
  'relatives': 'Family',

  // Work loop
  'work': 'Work',
  'career': 'Work',
  'job': 'Work',
  'projects': 'Work',
  'meetings': 'Work',
  'development': 'Work',
  'learning': 'Work',
  'admin': 'Work',
  'office': 'Work',
  'professional': 'Work',

  // Fun loop
  'fun': 'Fun',
  'hobbies': 'Fun',
  'social': 'Fun',
  'entertainment': 'Fun',
  'adventure': 'Fun',
  'creative': 'Fun',
  'games': 'Fun',
  'leisure': 'Fun',
  'recreation': 'Fun',

  // Maintenance loop
  'maintenance': 'Maintenance',
  'cleaning': 'Maintenance',
  'repairs': 'Maintenance',
  'shopping': 'Maintenance',
  'vehicle': 'Maintenance',
  'organization': 'Maintenance',
  'home': 'Maintenance',
  'errands': 'Maintenance',
  'chores': 'Maintenance',
  'house': 'Maintenance',

  // Meaning loop
  'meaning': 'Meaning',
  'reflection': 'Meaning',
  'purpose': 'Meaning',
  'practice': 'Meaning',
  'gratitude': 'Meaning',
  'meditation': 'Meaning',
  'spiritual': 'Meaning',
  'mindfulness': 'Meaning',
};

// Project name to loop mapping (if user uses projects instead of labels)
const PROJECT_TO_LOOP: Record<string, string> = {
  'health': 'Health',
  'wealth': 'Wealth',
  'family': 'Family',
  'work': 'Work',
  'fun': 'Fun',
  'maintenance': 'Maintenance',
  'meaning': 'Meaning',
};

interface TodoistTask {
  id: string;
  content: string;
  description: string;
  labels: string[];
  project_id: string;
  section_id: string | null;
  parent_id: string | null;
  priority: number;
  due: {
    date: string;
    string: string;
    is_recurring: boolean;
  } | null;
  url: string;
  order: number;
  created_at: string;
}

interface TodoistProject {
  id: string;
  name: string;
}

function getLoopFromLabels(labels: string[]): string {
  for (const label of labels) {
    const loop = LABEL_TO_LOOP[label.toLowerCase()];
    if (loop) return loop;
  }
  return 'Work'; // Default loop
}

function getLoopFromProject(projectName: string): string {
  return PROJECT_TO_LOOP[projectName.toLowerCase()] || 'Work';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get access token from Authorization header
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return res.status(200).json({
      source: 'local',
      data: null,
      message: 'No Todoist access token provided. Connect Todoist first.',
    });
  }

  try {
    // Fetch tasks and projects in parallel
    const [tasksRes, projectsRes, labelsRes] = await Promise.all([
      fetch('https://api.todoist.com/rest/v2/tasks', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }),
      fetch('https://api.todoist.com/rest/v2/projects', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }),
      fetch('https://api.todoist.com/rest/v2/labels', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }),
    ]);

    // Check if token is expired
    if (tasksRes.status === 401) {
      return res.status(401).json({
        source: 'error',
        data: null,
        message: 'Todoist token expired. Please reconnect.',
        needsReauth: true,
      });
    }

    if (!tasksRes.ok) {
      const errorText = await tasksRes.text();
      console.error('Todoist API error:', errorText);
      return res.status(500).json({
        source: 'error',
        data: null,
        message: 'Failed to fetch Todoist tasks',
      });
    }

    const tasks: TodoistTask[] = await tasksRes.json();
    const projects: TodoistProject[] = projectsRes.ok ? await projectsRes.json() : [];
    const labels = labelsRes.ok ? await labelsRes.json() : [];

    // Create project ID to name mapping
    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    // Transform tasks with loop assignment
    const transformedTasks = tasks.map(task => {
      // First try to get loop from labels
      let loop = getLoopFromLabels(task.labels);

      // If no label match, try project name
      if (loop === 'Work' && task.project_id) {
        const projectName = projectMap.get(task.project_id);
        if (projectName) {
          loop = getLoopFromProject(projectName);
        }
      }

      return {
        id: task.id,
        todoistId: task.id,
        title: task.content,
        description: task.description || '',
        loop,
        labels: task.labels,
        projectId: task.project_id,
        projectName: projectMap.get(task.project_id) || null,
        sectionId: task.section_id,
        parentId: task.parent_id,
        priority: task.priority,
        dueDate: task.due?.date || null,
        dueString: task.due?.string || null,
        isRecurring: task.due?.is_recurring || false,
        url: task.url,
        order: task.order,
        createdAt: task.created_at,
      };
    });

    // Create label to loop mapping for UI
    const labelMappings = labels.map((label: any) => ({
      id: label.id,
      name: label.name,
      loop: LABEL_TO_LOOP[label.name.toLowerCase()] || null,
    }));

    return res.status(200).json({
      source: 'todoist',
      data: {
        tasks: transformedTasks,
        labels: labelMappings,
        projects: projects.map(p => ({ id: p.id, name: p.name })),
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Todoist sync error:', error);
    return res.status(500).json({
      source: 'error',
      data: null,
      message: 'Failed to sync with Todoist',
    });
  }
}
