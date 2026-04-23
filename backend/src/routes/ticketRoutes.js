import { Router } from 'express';
import {
  getStatus,
  listTickets,
  createTicket,
  deleteTicket,
  bulkDeleteByStatus,
  compareTickets,
  analyzeTicket,
  batchAnalyze,
} from '../controllers/ticketController.js';

const router = Router();

router.get('/status',        getStatus);
router.post('/compare',      compareTickets);
router.post('/analyze',      analyzeTicket);
router.post('/batch',        batchAnalyze);

router.get('/',              listTickets);
router.post('/',             createTicket);
router.delete('/bulk',       bulkDeleteByStatus);
router.delete('/:id',        deleteTicket);

export default router;
