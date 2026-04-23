import { Config }     from '../models/Config.js';
import { Comparison } from '../models/Comparison.js';
import { Session }    from '../models/Session.js';
import { Ticket }     from '../models/Ticket.js';

// ── GET /api/config ──────────────────────────────────────────────────────────
export async function getAllConfig(req, res, next) {
  try {
    const config = await Config.getAll();
    res.json(config);
  } catch (err) { next(err); }
}

// ── PATCH /api/config/:key ───────────────────────────────────────────────────
export async function updateConfig(req, res, next) {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'value is required' });
    await Config.set(key, value);
    const updated = await Config.getAll();
    res.json({ updated: true, config: updated });
  } catch (err) { next(err); }
}

// ── GET /api/config/metrics ──────────────────────────────────────────────────
export async function getMetrics(req, res, next) {
  try {
    const [compStats, thresholds, sessions, ticketCount] = await Promise.all([
      Comparison.getStats(),
      Config.getThresholds(),
      Session.findAll({ limit: 5 }),
      Ticket.count(),
    ]);

    res.json({
      tickets:    { total: ticketCount },
      comparisons: compStats,
      thresholds,
      recentSessions: sessions,
    });
  } catch (err) { next(err); }
}

// ── GET /api/config/accuracy ─────────────────────────────────────────────────
export async function getAccuracy(req, res, next) {
  try {
    const accuracy = await Comparison.getAccuracyByThreshold();
    res.json(accuracy);
  } catch (err) { next(err); }
}

// ── POST /api/config/feedback/:comparisonId ──────────────────────────────────
export async function submitFeedback(req, res, next) {
  try {
    const { comparisonId } = req.params;
    const { feedback, note } = req.body;
    if (!['correct', 'incorrect', 'unsure'].includes(feedback)) {
      return res.status(400).json({ error: 'feedback must be correct | incorrect | unsure' });
    }
    await Comparison.submitFeedback(comparisonId, feedback, note ?? null);
    res.json({ updated: true });
  } catch (err) { next(err); }
}
