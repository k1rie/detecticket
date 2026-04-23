import { Router } from 'express';
import {
  getAllConfig,
  updateConfig,
  getMetrics,
  getAccuracy,
  submitFeedback,
} from '../controllers/configController.js';

const router = Router();

router.get('/',                          getAllConfig);
router.patch('/:key',                    updateConfig);
router.get('/metrics',                   getMetrics);
router.get('/accuracy',                  getAccuracy);
router.post('/feedback/:comparisonId',   submitFeedback);

export default router;
