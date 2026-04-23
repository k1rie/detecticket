import { compareTwo, findDuplicatesInBatch } from '../services/similarityService.js';
import { getEmbedding }                      from '../services/embeddingService.js';
import { getModelStatus }                    from '../services/embeddingService.js';
import { Ticket }                            from '../models/Ticket.js';
import { Comparison }                        from '../models/Comparison.js';
import { Session }                           from '../models/Session.js';

// ── GET /api/tickets/status ──────────────────────────────────────────────────
export function getStatus(req, res) {
  res.json({ modelStatus: getModelStatus() });
}

// ── GET /api/tickets ─────────────────────────────────────────────────────────
export async function listTickets(req, res, next) {
  try {
    const { limit = 50, offset = 0, status, category } = req.query;
    const [tickets, total] = await Promise.all([
      Ticket.findAll({ limit: Number(limit), offset: Number(offset), status, category }),
      status ? Ticket.countByStatus(status) : Ticket.count(),
    ]);
    res.json({ tickets, total });
  } catch (err) { next(err); }
}

// ── POST /api/tickets ─────────────────────────────────────────────────────────
export async function createTicket(req, res, next) {
  try {
    const { title, description, category, priority, status, source, external_id } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });

    const id = await Ticket.create({ external_id, title, description, category, priority, status, source });
    const ticket = await Ticket.findById(id);
    res.status(201).json(ticket);
  } catch (err) { next(err); }
}

// ── DELETE /api/tickets/:id ──────────────────────────────────────────────────
export async function deleteTicket(req, res, next) {
  try {
    await Ticket.delete(req.params.id);
    res.json({ deleted: true });
  } catch (err) { next(err); }
}

// ── DELETE /api/tickets/bulk?status=duplicate ────────────────────────────────
export async function bulkDeleteByStatus(req, res, next) {
  try {
    const { status } = req.query;
    if (!status) return res.status(400).json({ error: 'status query param required' });
    const deleted = await Ticket.deleteByStatus(status);
    res.json({ deleted });
  } catch (err) { next(err); }
}

// ── POST /api/tickets/compare ────────────────────────────────────────────────
// Compares two tickets and persists both + comparison in DB
export async function compareTickets(req, res, next) {
  try {
    const { ticketA, ticketB } = req.body;
    if (!ticketA?.title || !ticketB?.title) {
      return res.status(400).json({ error: 'ticketA.title and ticketB.title are required' });
    }

    // 1. Persist tickets (upsert by external_id or always insert if none)
    const [idA, idB] = await Promise.all([
      Ticket.create({ ...ticketA, source: 'api' }),
      Ticket.create({ ...ticketB, source: 'api' }),
    ]);

    // 2. Compare
    const analysis = await compareTwo(ticketA, ticketB);

    // 3. Cache embeddings
    const [embA, embB] = await Promise.all([
      getEmbedding(`${ticketA.title} ${ticketA.description ?? ''}`),
      getEmbedding(`${ticketB.title} ${ticketB.description ?? ''}`),
    ]);
    const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
    await Promise.all([
      Ticket.saveEmbedding(idA, embA, MODEL),
      Ticket.saveEmbedding(idB, embB, MODEL),
    ]);

    // 4. Persist comparison
    const compId = await Comparison.create({
      ticket_a_id:         idA,
      ticket_b_id:         idB,
      angle_rad:           analysis.angle,
      angle_deg:           analysis.angleDeg,
      similarity_pct:      analysis.similarity,
      status:              analysis.status,
      threshold_duplicate: analysis.thresholds.duplicate,
      threshold_related:   analysis.thresholds.related,
    });

    // 5. Update per-ticket metrics
    // Only the newer ticket (higher id) is the actual duplicate; the original keeps its status.
    const isRel = analysis.status === 'related';
    const isDup = analysis.status === 'duplicate';
    const newerIdAB = Math.max(idA, idB);
    await Promise.all([
      Ticket.updateMetrics(idA, { similarity: analysis.similarity, angle: analysis.angle, isDuplicate: isDup, isRelated: isRel, setStatus: idA === newerIdAB }),
      Ticket.updateMetrics(idB, { similarity: analysis.similarity, angle: analysis.angle, isDuplicate: isDup, isRelated: isRel, setStatus: idB === newerIdAB }),
    ]);

    res.json({
      ticketA: { ...ticketA, db_id: idA },
      ticketB: { ...ticketB, db_id: idB },
      analysis,
      comparison_id: compId,
    });
  } catch (err) { next(err); }
}

// ── POST /api/tickets/analyze ────────────────────────────────────────────────
// New ticket vs existing list
export async function analyzeTicket(req, res, next) {
  try {
    const { ticket, existingTickets } = req.body;
    if (!ticket?.title || !Array.isArray(existingTickets) || existingTickets.length === 0) {
      return res.status(400).json({ error: 'ticket and non-empty existingTickets required' });
    }

    const comparisons = await Promise.all(
      existingTickets.map(async (existing) => {
        const result = await compareTwo(ticket, existing);
        return { ticket: existing, ...result };
      })
    );

    const sorted     = comparisons.sort((a, b) => a.angle - b.angle);
    const duplicates = sorted.filter((c) => c.status === 'duplicate');
    const related    = sorted.filter((c) => c.status === 'related');

    res.json({ ticket, duplicates, related, topMatches: sorted.slice(0, 5) });
  } catch (err) { next(err); }
}

// ── POST /api/tickets/batch ──────────────────────────────────────────────────
export async function batchAnalyze(req, res, next) {
  try {
    const { tickets, sessionName } = req.body;
    if (!Array.isArray(tickets) || tickets.length < 2) {
      return res.status(400).json({ error: 'At least 2 tickets required' });
    }

    const startMs = Date.now();

    // 1. Persist all tickets
    const dbIds = await Promise.all(
      tickets.map((t) => Ticket.create({ ...t, source: 'batch' }))
    );

    // 2. Compute all pairs
    const results = await findDuplicatesInBatch(tickets);

    const thresholds = results[0]?.thresholds ?? { duplicate: 0.18, related: 0.55 };

    // 3. Create session
    const sessionId = await Session.create({
      name:                sessionName ?? null,
      type:                'batch',
      ticket_count:        tickets.length,
      threshold_duplicate: thresholds.duplicate,
      threshold_related:   thresholds.related,
      model_name:          'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
    });

    // 4. Persist comparisons + update metrics
    const dupCount  = results.filter((r) => r.status === 'duplicate').length;
    const relCount  = results.filter((r) => r.status === 'related').length;
    const diffCount = results.length - dupCount - relCount;

    await Promise.all(
      results.map((r) => {
        const isDup = r.status === 'duplicate';
        const isRel = r.status === 'related';
        return Promise.all([
          Comparison.create({
            ticket_a_id:         dbIds[r.indexA],
            ticket_b_id:         dbIds[r.indexB],
            angle_rad:           r.angle,
            angle_deg:           r.angleDeg,
            similarity_pct:      r.similarity,
            status:              r.status,
            threshold_duplicate: r.thresholds.duplicate,
            threshold_related:   r.thresholds.related,
            session_id:          sessionId,
          }),
          Ticket.updateMetrics(dbIds[r.indexA], { similarity: r.similarity, angle: r.angle, isDuplicate: isDup, isRelated: isRel, setStatus: false }),
          Ticket.updateMetrics(dbIds[r.indexB], { similarity: r.similarity, angle: r.angle, isDuplicate: isDup, isRelated: isRel, setStatus: true }),
        ]);
      })
    );

    const angles      = results.map((r) => r.angle);
    const similarities = results.map((r) => r.similarity);
    const processingMs = Date.now() - startMs;

    await Session.finalize(sessionId, {
      comparison_count: results.length,
      duplicate_count:  dupCount,
      related_count:    relCount,
      different_count:  diffCount,
      avg_similarity:   similarities.reduce((a, b) => a + b, 0) / similarities.length,
      avg_angle_rad:    angles.reduce((a, b) => a + b, 0) / angles.length,
      min_angle_rad:    Math.min(...angles),
      max_angle_rad:    Math.max(...angles),
      processing_ms:    processingMs,
    });

    res.json({
      session_id: sessionId,
      results,
      stats: {
        totalComparisons: results.length,
        duplicates:       dupCount,
        related:          relCount,
        different:        diffCount,
        processingMs,
      },
    });
  } catch (err) { next(err); }
}
