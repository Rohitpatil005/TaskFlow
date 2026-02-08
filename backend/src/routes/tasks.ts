import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { authMiddleware } from '../middleware/auth.js';

let broadcast: any;

// Lazy load broadcast to avoid circular dependency
const getBroadcast = async () => {
  if (!broadcast) {
    const module = await import('../index.js');
    broadcast = module.broadcast;
  }
  return broadcast;
};

const router = express.Router();

// Get all tasks for a project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email')
      .sort({ status: 1, order: 1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, projectId, priority, dueDate } = req.body;

    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      priority: priority || 'medium',
      dueDate,
      order: 0
    });

    await task.save();
    await task.populate('assignee', 'name email');

    // Broadcast task creation
    const broadcastFn = await getBroadcast();
    if (broadcastFn) {
      broadcastFn({
        type: 'task-created',
        data: task,
        timestamp: Date.now()
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, priority, assignee, dueDate } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    task.updatedAt = new Date();

    await task.save();
    await task.populate('assignee', 'name email');

    // Broadcast task update
    const broadcastFn = await getBroadcast();
    if (broadcastFn) {
      broadcastFn({
        type: 'task-updated',
        data: task,
        timestamp: Date.now()
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Reorder tasks (drag and drop)
router.put('/:id/reorder', authMiddleware, async (req, res) => {
  try {
    const { status, order } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.status = status || task.status;
    task.order = order || task.order;
    task.updatedAt = new Date();

    await task.save();
    await task.populate('assignee', 'name email');

    // Broadcast task reorder
    const broadcastFn = await getBroadcast();
    if (broadcastFn) {
      broadcastFn({
        type: 'task-reordered',
        data: task,
        timestamp: Date.now()
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Broadcast task deletion
    const broadcastFn = await getBroadcast();
    if (broadcastFn) {
      broadcastFn({
        type: 'task-deleted',
        data: { taskId: req.params.id },
        timestamp: Date.now()
      });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
