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
      .populate('comments.author', 'name email')
      .populate('timeEntries.userId', 'name email')
      .populate('activityFeed.userId', 'name email')
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
    if (status && task.status !== status) {
      task.status = status;
      task.activityFeed.push({
        userId: req.userId,
        action: 'status_changed',
        description: `Changed status to ${status}`
      });
    }
    if (priority) task.priority = priority;
    if (assignee !== undefined) {
      if (String(task.assignee) !== String(assignee)) {
        task.assignee = assignee;
        task.activityFeed.push({
          userId: req.userId,
          action: 'assigned',
          description: assignee ? 'Task assigned' : 'Assignee removed'
        });
      }
    }
    if (dueDate !== undefined) task.dueDate = dueDate;
    task.updatedAt = new Date();

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('comments.author', 'name email');
    await task.populate('activityFeed.userId', 'name email');

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

// Add label to task
router.post('/:id/labels', authMiddleware, async (req, res) => {
  try {
    const { label } = req.body;
    if (!label || typeof label !== 'string') {
      return res.status(400).json({ error: 'Invalid label' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.labels.includes(label)) {
      task.labels.push(label);
      task.activityFeed.push({
        userId: req.userId,
        action: 'label_added',
        description: `Added label: ${label}`
      });
      task.updatedAt = new Date();
      await task.save();
      await task.populate('assignee', 'name email');
      await task.populate('comments.author', 'name email');
      await task.populate('activityFeed.userId', 'name email');
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add label' });
  }
});

// Remove label from task
router.delete('/:id/labels/:label', authMiddleware, async (req, res) => {
  try {
    const { label } = req.params;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const index = task.labels.indexOf(label);
    if (index > -1) {
      task.labels.splice(index, 1);
      task.activityFeed.push({
        userId: req.userId,
        action: 'label_removed',
        description: `Removed label: ${label}`
      });
      task.updatedAt = new Date();
      await task.save();
      await task.populate('assignee', 'name email');
      await task.populate('comments.author', 'name email');
      await task.populate('activityFeed.userId', 'name email');
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove label' });
  }
});

// Add comment to task
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid comment' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.comments.push({
      author: req.userId,
      text,
      createdAt: new Date()
    });

    task.activityFeed.push({
      userId: req.userId,
      action: 'commented',
      description: 'Added a comment'
    });

    task.updatedAt = new Date();
    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('comments.author', 'name email');
    await task.populate('activityFeed.userId', 'name email');

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete comment from task
router.delete('/:id/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const commentIndex = task.comments.findIndex(c => c._id.toString() === req.params.commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    task.comments.splice(commentIndex, 1);
    task.updatedAt = new Date();
    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('comments.author', 'name email');
    await task.populate('activityFeed.userId', 'name email');

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Add time entry to task
router.post('/:id/time', authMiddleware, async (req, res) => {
  try {
    const { duration } = req.body;
    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.timeEntries.push({
      userId: req.userId,
      duration,
      date: new Date()
    });

    task.totalTimeSpent += duration;

    task.activityFeed.push({
      userId: req.userId,
      action: 'time_logged',
      description: `Logged ${duration} minutes`
    });

    task.updatedAt = new Date();
    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('comments.author', 'name email');
    await task.populate('timeEntries.userId', 'name email');
    await task.populate('activityFeed.userId', 'name email');

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log time' });
  }
});

// Get activity feed for task
router.get('/:id/activity', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('activityFeed.userId', 'name email');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task.activityFeed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get activity feed' });
  }
});

export default router;
