import { query, queryOne } from '../config/db.js';

export const Config = {
  async get(key) {
    const row = await queryOne(
      'SELECT config_value, value_type FROM system_config WHERE config_key = ?',
      [key]
    );
    if (!row) return null;
    return castValue(row.config_value, row.value_type);
  },

  async set(key, value) {
    await query(
      `UPDATE system_config SET config_value = ? WHERE config_key = ?`,
      [String(value), key]
    );
  },

  async getAll() {
    const rows = await query('SELECT * FROM system_config ORDER BY config_key');
    return rows.map((r) => ({ ...r, parsed_value: castValue(r.config_value, r.value_type) }));
  },

  async getThresholds() {
    const dup = await this.get('threshold_duplicate');
    const rel = await this.get('threshold_related');
    return {
      duplicate: dup ?? 0.18,
      related: rel ?? 0.55,
    };
  },
};

function castValue(val, type) {
  switch (type) {
    case 'float':  return parseFloat(val);
    case 'int':    return parseInt(val, 10);
    case 'bool':   return val === 'true';
    default:       return val;
  }
}
