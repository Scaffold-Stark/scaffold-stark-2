import express from 'express';
import { startConversation, continueConversation } from '../controllers/voteController.js';

const router = express.Router();

router.post('/start', startConversation);
router.post('/continue', continueConversation);

export default router;
