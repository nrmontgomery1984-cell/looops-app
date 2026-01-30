// Built-in Task Templates
import { TaskTemplate } from '../types/taskTemplates';

export const BUILT_IN_TEMPLATES: TaskTemplate[] = [
  // ============ CLEANING TEMPLATES ============
  {
    id: 'deep-clean-kitchen',
    name: 'Deep Clean Kitchen',
    description: 'Thorough kitchen cleaning including appliances and cabinets',
    loop: 'Maintenance',
    category: 'Cleaning',
    icon: '🍳',
    tasks: [
      { title: 'Clear and wipe all counters', order: 1, estimatedMinutes: 10 },
      { title: 'Clean stovetop and burners', order: 2, estimatedMinutes: 10 },
      { title: 'Clean oven exterior', order: 3, estimatedMinutes: 5 },
      { title: 'Clean microwave inside and out', order: 4, estimatedMinutes: 5 },
      { title: 'Wipe down cabinet fronts', order: 5, estimatedMinutes: 10 },
      { title: 'Clean refrigerator shelves and drawers', order: 6, estimatedMinutes: 15 },
      { title: 'Scrub sink and polish faucet', order: 7, estimatedMinutes: 5 },
      { title: 'Clean dishwasher filter and door', order: 8, estimatedMinutes: 5 },
      { title: 'Wipe down small appliances', order: 9, estimatedMinutes: 5 },
      { title: 'Mop kitchen floor', order: 10, estimatedMinutes: 10 },
      { title: 'Take out trash and recycling', order: 11, estimatedMinutes: 3 },
    ],
  },
  {
    id: 'clean-bathroom',
    name: 'Clean Bathroom',
    description: 'Full bathroom cleaning including shower/tub',
    loop: 'Maintenance',
    category: 'Cleaning',
    icon: '🚿',
    tasks: [
      { title: 'Clean toilet inside and out', order: 1, estimatedMinutes: 5 },
      { title: 'Scrub shower/tub', order: 2, estimatedMinutes: 10 },
      { title: 'Clean shower door or curtain', order: 3, estimatedMinutes: 5 },
      { title: 'Clean sink and faucet', order: 4, estimatedMinutes: 3 },
      { title: 'Wipe mirror', order: 5, estimatedMinutes: 2 },
      { title: 'Wipe counters and surfaces', order: 6, estimatedMinutes: 3 },
      { title: 'Empty trash', order: 7, estimatedMinutes: 1 },
      { title: 'Mop/clean floor', order: 8, estimatedMinutes: 5 },
      { title: 'Replace towels', order: 9, estimatedMinutes: 2 },
    ],
  },
  {
    id: 'clean-powder-room',
    name: 'Clean Powder Room',
    description: 'Quick half-bath cleaning',
    loop: 'Maintenance',
    category: 'Cleaning',
    icon: '🚽',
    tasks: [
      { title: 'Clean toilet inside and out', order: 1, estimatedMinutes: 5 },
      { title: 'Clean sink and faucet', order: 2, estimatedMinutes: 3 },
      { title: 'Wipe mirror', order: 3, estimatedMinutes: 2 },
      { title: 'Wipe counter', order: 4, estimatedMinutes: 2 },
      { title: 'Empty trash', order: 5, estimatedMinutes: 1 },
      { title: 'Mop floor', order: 6, estimatedMinutes: 3 },
    ],
  },
  {
    id: 'weekly-house-clean',
    name: 'Weekly House Clean',
    description: 'Regular weekly maintenance cleaning',
    loop: 'Maintenance',
    category: 'Cleaning',
    icon: '🏠',
    tasks: [
      { title: 'Vacuum all carpets and rugs', order: 1, estimatedMinutes: 20 },
      { title: 'Mop hard floors', order: 2, estimatedMinutes: 15 },
      { title: 'Dust all surfaces', order: 3, estimatedMinutes: 15 },
      { title: 'Clean all mirrors', order: 4, estimatedMinutes: 5 },
      { title: 'Wipe kitchen counters', order: 5, estimatedMinutes: 5 },
      { title: 'Quick clean bathrooms', order: 6, estimatedMinutes: 15 },
      { title: 'Take out all trash', order: 7, estimatedMinutes: 5 },
      { title: 'Change bed linens', order: 8, estimatedMinutes: 10 },
    ],
  },
  {
    id: 'deep-clean-house',
    name: 'Deep Clean Entire House',
    description: 'Comprehensive whole-house deep cleaning',
    loop: 'Maintenance',
    category: 'Cleaning',
    icon: '✨',
    tasks: [
      // Kitchen
      { title: 'Deep clean kitchen (all surfaces)', order: 1, estimatedMinutes: 30 },
      { title: 'Clean all kitchen appliances', order: 2, estimatedMinutes: 20 },
      { title: 'Clean inside refrigerator', order: 3, estimatedMinutes: 15 },
      // Bathrooms
      { title: 'Deep clean master bathroom', order: 4, estimatedMinutes: 25 },
      { title: 'Deep clean secondary bathroom(s)', order: 5, estimatedMinutes: 20 },
      { title: 'Clean powder room(s)', order: 6, estimatedMinutes: 10 },
      // Floors
      { title: 'Vacuum all floors thoroughly', order: 7, estimatedMinutes: 25 },
      { title: 'Mop all hard floors', order: 8, estimatedMinutes: 20 },
      // Surfaces
      { title: 'Dust all surfaces and shelves', order: 9, estimatedMinutes: 20 },
      { title: 'Clean all mirrors and glass', order: 10, estimatedMinutes: 10 },
      { title: 'Clean windows (inside)', order: 11, estimatedMinutes: 20 },
      { title: 'Wipe baseboards', order: 12, estimatedMinutes: 15 },
      { title: 'Clean light fixtures and fans', order: 13, estimatedMinutes: 15 },
      // Finishing
      { title: 'Organize cluttered areas', order: 14, estimatedMinutes: 20 },
      { title: 'Change all bed linens', order: 15, estimatedMinutes: 15 },
      { title: 'Take out all trash and recycling', order: 16, estimatedMinutes: 5 },
    ],
  },
  {
    id: 'clean-bedroom',
    name: 'Clean Bedroom',
    description: 'Thorough bedroom cleaning and organizing',
    loop: 'Maintenance',
    category: 'Cleaning',
    icon: '🛏️',
    tasks: [
      { title: 'Change bed linens', order: 1, estimatedMinutes: 10 },
      { title: 'Make bed properly', order: 2, estimatedMinutes: 5 },
      { title: 'Dust all surfaces', order: 3, estimatedMinutes: 10 },
      { title: 'Clean mirrors', order: 4, estimatedMinutes: 3 },
      { title: 'Vacuum floor and under bed', order: 5, estimatedMinutes: 10 },
      { title: 'Organize nightstands', order: 6, estimatedMinutes: 5 },
      { title: 'Tidy closet', order: 7, estimatedMinutes: 10 },
      { title: 'Empty trash', order: 8, estimatedMinutes: 1 },
    ],
  },
  {
    id: 'clean-living-room',
    name: 'Clean Living Room',
    description: 'Living room and common area cleaning',
    loop: 'Maintenance',
    category: 'Cleaning',
    icon: '🛋️',
    tasks: [
      { title: 'Declutter surfaces', order: 1, estimatedMinutes: 10 },
      { title: 'Fluff and arrange pillows', order: 2, estimatedMinutes: 3 },
      { title: 'Dust all surfaces and shelves', order: 3, estimatedMinutes: 15 },
      { title: 'Clean TV screen and electronics', order: 4, estimatedMinutes: 5 },
      { title: 'Vacuum furniture and cushions', order: 5, estimatedMinutes: 10 },
      { title: 'Vacuum floor and rugs', order: 6, estimatedMinutes: 10 },
      { title: 'Clean windows', order: 7, estimatedMinutes: 10 },
      { title: 'Organize remotes and items', order: 8, estimatedMinutes: 5 },
    ],
  },
];

// Helper to get templates by category
export function getTemplatesByCategory(category: string): TaskTemplate[] {
  return BUILT_IN_TEMPLATES.filter(t => t.category === category);
}

// Get all unique categories
export function getTemplateCategories(): string[] {
  return [...new Set(BUILT_IN_TEMPLATES.map(t => t.category))];
}

// Find template by ID
export function findTemplateById(id: string): TaskTemplate | undefined {
  return BUILT_IN_TEMPLATES.find(t => t.id === id);
}
