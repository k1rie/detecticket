import { query, queryOne } from '../config/db.js';

export const Comparison = {
  async create({
    ticket_a_id, ticket_b_id,
    angle_rad, angle_deg, similarity_pct, status,
    threshold_duplicate, threshold_related,
    session_id = null,
  }) {
    const result = await query(
      `INSERT INTO comparisons
         (ticket_a_id, ticket_b_id, angle_rad, angle_deg, similarity_pct, status,
          threshold_duplicate, threshold_related, session_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket_a_id, ticket_b_id,
        angle_rad, angle_deg, similarity_pct, status,
        threshold_duplicate, threshold_related,
        session_id,
      ]
    );
    return result.insertId;
  },

  async findById(id) {
    return queryOne(`
      SELECT c.*,
             ta.title AS title_a, ta.external_id AS ext_a,
             tb.title AS title_b, tb.external_id AS ext_b
      FROM comparisons c
      JOIN tickets ta ON ta.id = c.ticket_a_id
      JOIN tickets tb ON tb.id = c.ticket_b_id
      WHERE c.id = ?`, [id]);
  },

  async findBySession(sessionId) {
    return query(`
      SELECT c.*,
             ta.title AS title_a, ta.external_id AS ext_a,
             tb.title AS title_b, tb.external_id AS ext_b
      FROM comparisons c
      JOIN tickets ta ON ta.id = c.ticket_a_id
      JOIN tickets tb ON tb.id = c.ticket_b_id
      WHERE c.session_id = ?
      ORDER BY c.angle_rad ASC`, [sessionId]);
  },

  async submitFeedback(id, feedback, feedback_note = null) {
    await query(
      'UPDATE comparisons SET feedback = ?, feedback_note = ? WHERE id = ?',
      [feedback, feedback_note, id]
    );
  },

  async getStats() {
    return queryOne(`
      SELECT
        COUNT(*)                                        AS total,
        SUM(status = 'duplicate')                       AS duplicates,
        SUM(status = 'related')                         AS related,
        SUM(status = 'different')                       AS different,
        ROUND(AVG(similarity_pct), 2)                   AS avg_similarity,
        ROUND(AVG(angle_rad), 6)                        AS avg_angle,
        ROUND(MIN(angle_rad), 6)                        AS min_angle,
        ROUND(MAX(angle_rad), 6)                        AS max_angle,
        SUM(feedback = 'correct')                       AS feedback_correct,
        SUM(feedback = 'incorrect')                     AS feedback_incorrect
      FROM comparisons`
    );
  },

  async getAccuracyByThreshold() {
    return query(`
      SELECT
        threshold_duplicate,
        threshold_related,
        COUNT(*) AS total,
        SUM(feedback = 'correct') AS correct,
        SUM(feedback = 'incorrect') AS incorrect,
        ROUND(SUM(feedback = 'correct') / COUNT(*) * 100, 2) AS accuracy_pct
      FROM comparisons
      WHERE feedback IS NOT NULL
      GROUP BY threshold_duplicate, threshold_related
      ORDER BY accuracy_pct DESC`
    );
  },
};
