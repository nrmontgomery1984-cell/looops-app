// Task Templates - Reusable project/task checklists
import { LoopId } from './core';

export interface TaskTemplateItem {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  order: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  loop: LoopId;
  category: string;
  icon?: string;
  tasks: TaskTemplateItem[];
  // Future marketplace fields
  // authorId?: string;
  // price?: number;
  // communityRating?: number;
}

// Helper to calculate total estimated time for a template
export function getTemplateEstimate(template: TaskTemplate): number {
  return template.tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
}
