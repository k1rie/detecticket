import { query, queryOne } from '../config/db.js';

export const Session = {
  async create({ name, type = 'batch', ticket_count, threshold_duplicate, threshold_related, model_name }) {
    const result = await query(
      `INSERT INTO analysis_sessions
         (name, type, ticket_count, threshold_duplicate, threshold_related, model_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name ?? null, type, ticket_count, threshold_duplicate, threshold_related, model_name ?? null]
    );
    return result.insertId;
  },

  async finalize(id, { comparison_count, duplicate_count, related_count, different_count,
                       avg_similarity, avg_angle_rad, min_angle_rad, max_angle_rad, processing_ms }) {
    await query(
      `UPDATE analysis_sessions SET
         comparison_count = ?, duplicate_count = ?, related_count = ?,
         different_count = ?, avg_similarity = ?, avg_angle_rad = ?,
         min_angle_rad = ?, max_angle_rad = ?, processing_ms = ?
       WHERE id = ?`,
      [comparison_count, duplicate_count, related_count, different_count,
       avg_similarity, avg_angle_rad, min_angle_rad, max_angle_rad, processing_ms, id]
    );
  },

  async findAll({ limit = 20, offset = 0 } = {}) {
    return query(
      'SELECT * FROM analysis_sessions ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  },

  async findById(id) {
    return queryOne('SELECT * FROM analysis_sessions WHERE id = ?', [id]);
  },
};
