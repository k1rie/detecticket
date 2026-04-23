import { query, queryOne } from '../config/db.js';

export const Ticket = {
  async create({ external_id, title, description, category, priority, status, source }) {
    const result = await query(
      `INSERT INTO tickets (external_id, title, description, category, priority, status, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [external_id ?? null, title, description ?? null, category ?? null,
       priority ?? 'medium', status ?? 'open', source ?? 'manual']
    );
    return result.insertId;
  },

  async findById(id) {
    return queryOne('SELECT * FROM tickets WHERE id = ?', [id]);
  },

  async findAll({ limit = 50, offset = 0, status, category } = {}) {
    let sql = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];
    if (status)   { sql += ' AND status = ?';   params.push(status); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    return query(sql, params);
  },

  async count() {
    const row = await queryOne('SELECT COUNT(*) AS total FROM tickets');
    return row.total;
  },

  async countByStatus(status) {
    const row = await queryOne('SELECT COUNT(*) AS total FROM tickets WHERE status = ?', [status]);
    return row.total;
  },

  async saveEmbedding(id, embedding, modelName) {
    await query(
      'UPDATE tickets SET embedding = ?, embedding_model = ? WHERE id = ?',
      [JSON.stringify(embedding), modelName, id]
    );
  },

  async getCachedEmbedding(id) {
    const row = await queryOne(
      'SELECT embedding, embedding_model FROM tickets WHERE id = ? AND embedding IS NOT NULL',
      [id]
    );
    return row ? JSON.parse(row.embedding) : null;
  },

  async updateMetrics(id, { similarity, angle, isDuplicate, isRelated, setStatus = true }) {
    const statusClause = setStatus
      ? `, status = CASE
           WHEN ? = 1 THEN 'duplicate'
           WHEN ? = 1 AND status != 'duplicate' THEN 'related'
           ELSE status
         END`
      : '';

    const params = [
      isDuplicate ? 1 : 0,
      isRelated   ? 1 : 0,
      similarity, similarity,
      angle, angle,
    ];
    if (setStatus) params.push(isDuplicate ? 1 : 0, isRelated ? 1 : 0);
    params.push(id);

    await query(
      `UPDATE tickets SET
         comparison_count = comparison_count + 1,
         duplicate_count  = duplicate_count  + ?,
         related_count    = related_count    + ?,
         avg_similarity   = COALESCE(
           (avg_similarity * comparison_count + ?) / (comparison_count + 1), ?),
         min_angle_seen   = CASE
           WHEN min_angle_seen IS NULL OR ? < min_angle_seen THEN ? ELSE min_angle_seen
         END
         ${statusClause}
       WHERE id = ?`,
      params
    );
  },

  async delete(id) {
    await query('DELETE FROM tickets WHERE id = ?', [id]);
  },

  async deleteByStatus(status) {
    const result = await query('DELETE FROM tickets WHERE status = ?', [status]);
    return result.affectedRows;
  },
};
