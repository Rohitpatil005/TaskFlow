import express from 'express';
import Project from '../models/Project.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all projects for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId }
      ]
    }).populate('owner', 'name email').populate('members', 'name email');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Create project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const project = new Project({
      name,
      description,
      owner: req.userId,
      members: [req.userId]
    });
    
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get project by id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Update project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user is owner
    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    project.name = name || project.name;
    project.description = description || project.description;
    project.updatedAt = new Date();
    
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
