import express from 'express';
import { signup, login, logout, editImage, test } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/test', test);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/edit', authMiddleware, editImage);
router.get('/profile', authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;
