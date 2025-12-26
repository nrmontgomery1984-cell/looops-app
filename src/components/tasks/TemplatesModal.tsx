// Templates Modal - Browse, use, and create task templates
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { BUILT_IN_TEMPLATES, getTemplateCategories } from '../../data/taskTemplates';
import { TaskTemplate, TaskTemplateItem, getTemplateEstimate } from '../../types/taskTemplates';
import { LoopId, ALL_LOOPS } from '../../types';

interface TemplatesModalProps {
  onClose: () => void;
}

type ViewMode = 'list' | 'detail' | 'create';

export function TemplatesModal({ onClose }: TemplatesModalProps) {
  const { state, dispatch } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [customName, setCustomName] = useState('');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // Create template form state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateLoop, setNewTemplateLoop] = useState<LoopId>('Maintenance');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Custom');
  const [newTemplateIcon, setNewTemplateIcon] = useState('📋');
  const [newTemplateTasks, setNewTemplateTasks] = useState<TaskTemplateItem[]>([
    { title: '', order: 1 }
  ]);

  // Combine built-in and custom templates
  const allTemplates = [...BUILT_IN_TEMPLATES, ...state.customTemplates];

  // Get all categories including "Custom" for custom templates
  const builtInCategories = getTemplateCategories();
  const customCategories = [...new Set(state.customTemplates.map(t => t.category))];
  const allCategories = [...new Set([...builtInCategories, ...customCategories])];

  const handleUseTemplate = (template: TaskTemplate) => {
    dispatch({
      type: 'CREATE_FROM_TEMPLATE',
      payload: {
        templateId: template.id,
        projectName: customName || undefined,
      },
    });
    onClose();
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      dispatch({ type: 'DELETE_CUSTOM_TEMPLATE', payload: templateId });
      setSelectedTemplate(null);
      setViewMode('list');
    }
  };

  const handleAddTask = () => {
    setNewTemplateTasks([
      ...newTemplateTasks,
      { title: '', order: newTemplateTasks.length + 1 }
    ]);
  };

  const handleRemoveTask = (index: number) => {
    if (newTemplateTasks.length > 1) {
      const updated = newTemplateTasks.filter((_, i) => i !== index);
      // Re-order remaining tasks
      setNewTemplateTasks(updated.map((t, i) => ({ ...t, order: i + 1 })));
    }
  };

  const handleTaskChange = (index: number, field: keyof TaskTemplateItem, value: string | number) => {
    const updated = [...newTemplateTasks];
    if (field === 'title') {
      updated[index] = { ...updated[index], title: value as string };
    } else if (field === 'estimatedMinutes') {
      updated[index] = { ...updated[index], estimatedMinutes: value as number };
    }
    setNewTemplateTasks(updated);
  };

  const handleCreateTemplate = () => {
    // Validate
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const validTasks = newTemplateTasks.filter(t => t.title.trim());
    if (validTasks.length === 0) {
      alert('Please add at least one task');
      return;
    }

    const newTemplate: TaskTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim() || undefined,
      loop: newTemplateLoop,
      category: newTemplateCategory.trim() || 'Custom',
      icon: newTemplateIcon || '📋',
      tasks: validTasks.map((t, i) => ({
        title: t.title.trim(),
        order: i + 1,
        estimatedMinutes: t.estimatedMinutes,
      })),
    };

    dispatch({ type: 'ADD_CUSTOM_TEMPLATE', payload: newTemplate });

    // Reset form and go back to list
    resetCreateForm();
    setViewMode('list');
  };

  const resetCreateForm = () => {
    setNewTemplateName('');
    setNewTemplateDescription('');
    setNewTemplateLoop('Maintenance');
    setNewTemplateCategory('Custom');
    setNewTemplateIcon('📋');
    setNewTemplateTasks([{ title: '', order: 1 }]);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const isCustomTemplate = (template: TaskTemplate) => {
    return template.id.startsWith('custom-');
  };

  const renderListView = () => (
    <div className="templates-list">
      <button
        className="create-template-btn"
        onClick={() => setViewMode('create')}
      >
        + Create Custom Template
      </button>

      {allCategories.map((category) => {
        const categoryTemplates = allTemplates.filter((t) => t.category === category);
        if (categoryTemplates.length === 0) return null;

        return (
          <div key={category} className="template-category">
            <h3 className="category-header">{category}</h3>
            <div className="template-grid">
              {categoryTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`template-card ${isCustomTemplate(template) ? 'custom' : ''}`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setViewMode('detail');
                  }}
                >
                  <div className="template-card-header">
                    <span className="template-icon">{template.icon}</span>
                    <h4>{template.name}</h4>
                    {isCustomTemplate(template) && (
                      <span className="custom-badge">Custom</span>
                    )}
                  </div>
                  <p className="template-card-meta">
                    {template.tasks.length} tasks &middot;{' '}
                    {formatTime(getTemplateEstimate(template))}
                  </p>
                  {expandedTemplateId === template.id && (
                    <ul className="template-card-tasks">
                      {template.tasks.slice(0, 5).map((task, i) => (
                        <li key={i}>{task.title}</li>
                      ))}
                      {template.tasks.length > 5 && (
                        <li className="more">
                          +{template.tasks.length - 5} more...
                        </li>
                      )}
                    </ul>
                  )}
                  <button
                    className="template-card-expand"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedTemplateId(
                        expandedTemplateId === template.id ? null : template.id
                      );
                    }}
                  >
                    {expandedTemplateId === template.id ? 'Hide tasks' : 'Show tasks'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDetailView = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="template-detail">
        <button
          className="template-back-btn"
          onClick={() => {
            setSelectedTemplate(null);
            setCustomName('');
            setViewMode('list');
          }}
        >
          &larr; Back to templates
        </button>

        <div className="template-detail-header">
          <span className="template-icon">{selectedTemplate.icon}</span>
          <div>
            <h3>
              {selectedTemplate.name}
              {isCustomTemplate(selectedTemplate) && (
                <span className="custom-badge">Custom</span>
              )}
            </h3>
            <p className="template-meta">
              {selectedTemplate.tasks.length} tasks &middot;{' '}
              {formatTime(getTemplateEstimate(selectedTemplate))}
            </p>
          </div>
        </div>

        {selectedTemplate.description && (
          <p className="template-description">{selectedTemplate.description}</p>
        )}

        <div className="template-tasks-preview">
          <h4>Tasks included:</h4>
          <ul>
            {selectedTemplate.tasks.map((task, index) => (
              <li key={index}>
                <span className="task-title">{task.title}</span>
                {task.estimatedMinutes && (
                  <span className="task-time">{task.estimatedMinutes}m</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="template-use-form">
          <label>
            Project name (optional):
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={selectedTemplate.name}
            />
          </label>
          <div className="template-actions">
            <button
              className="template-use-btn"
              onClick={() => handleUseTemplate(selectedTemplate)}
            >
              Create Project with Tasks
            </button>
            {isCustomTemplate(selectedTemplate) && (
              <button
                className="template-delete-btn"
                onClick={() => handleDeleteTemplate(selectedTemplate.id)}
              >
                Delete Template
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCreateView = () => (
    <div className="template-create">
      <button
        className="template-back-btn"
        onClick={() => {
          resetCreateForm();
          setViewMode('list');
        }}
      >
        &larr; Back to templates
      </button>

      <h3>Create Custom Template</h3>

      <div className="template-create-form">
        <div className="form-row">
          <label>
            Template Name *
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="e.g., Morning Routine"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Description
            <input
              type="text"
              value={newTemplateDescription}
              onChange={(e) => setNewTemplateDescription(e.target.value)}
              placeholder="Brief description of this template"
            />
          </label>
        </div>

        <div className="form-row-group">
          <div className="form-row">
            <label>
              Icon
              <input
                type="text"
                value={newTemplateIcon}
                onChange={(e) => setNewTemplateIcon(e.target.value)}
                placeholder="📋"
                maxLength={2}
                className="icon-input"
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Loop
              <select
                value={newTemplateLoop}
                onChange={(e) => setNewTemplateLoop(e.target.value as LoopId)}
              >
                {ALL_LOOPS.map((loop) => (
                  <option key={loop} value={loop}>{loop}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Category
              <input
                type="text"
                value={newTemplateCategory}
                onChange={(e) => setNewTemplateCategory(e.target.value)}
                placeholder="Custom"
              />
            </label>
          </div>
        </div>

        <div className="template-tasks-section">
          <h4>Tasks *</h4>
          <div className="template-tasks-list">
            {newTemplateTasks.map((task, index) => (
              <div key={index} className="template-task-row">
                <span className="task-number">{index + 1}.</span>
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                  placeholder="Task title"
                  className="task-title-input"
                />
                <input
                  type="number"
                  value={task.estimatedMinutes || ''}
                  onChange={(e) => handleTaskChange(index, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                  placeholder="min"
                  className="task-time-input"
                  min="0"
                />
                <button
                  type="button"
                  className="task-remove-btn"
                  onClick={() => handleRemoveTask(index)}
                  disabled={newTemplateTasks.length === 1}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="add-task-btn"
            onClick={handleAddTask}
          >
            + Add Task
          </button>
        </div>

        <button
          className="template-save-btn"
          onClick={handleCreateTemplate}
        >
          Save Template
        </button>
      </div>
    </div>
  );

  const modalContent = (
    <div className="templates-modal-overlay" onClick={onClose}>
      <div className="templates-modal" onClick={(e) => e.stopPropagation()}>
        <div className="templates-modal-header">
          <h2>Task Templates</h2>
          <button className="templates-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="templates-modal-content">
          {viewMode === 'list' && renderListView()}
          {viewMode === 'detail' && renderDetailView()}
          {viewMode === 'create' && renderCreateView()}
        </div>
      </div>
    </div>
  );

  return createPortal(
    modalContent,
    document.getElementById('modal-root') || document.body
  );
}

export default TemplatesModal;
