const express = require('express');
const Workout = require('../models/Workout');
const auth = require('../utils/authMiddleware');

const router = express.Router();

// POST /api/workouts
router.post('/', auth, async (req, res) => {
    const workout = new Workout({
        userId: req.user.id,
        plan: req.body.plan
    });
    await workout.save();
    res.json(workout);
});

// GET /api/workouts
router.get('/', auth, async (req, res) => {
    const workouts = await Workout.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(workouts);
});

module.exports = router;
