import { query } from '../config/db.js';

export async function runMigrations() {
  console.log('[DB] Running migrations…');

  // ─── system_config ──────────────────────────────────────────────────────────
  // Stores adjustable thresholds and global settings.
  // Changing a row here changes system behavior without redeployment.
  await query(`
    CREATE TABLE IF NOT EXISTS system_config (
      id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
      config_key    VARCHAR(80)     NOT NULL UNIQUE,
      config_value  VARCHAR(255)    NOT NULL,
      value_type    ENUM('float','int','string','bool') NOT NULL DEFAULT 'string',
      description   TEXT,
      updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed defaults only if table is empty
  await query(`
    INSERT IGNORE INTO system_config (config_key, config_value, value_type, description) VALUES
      ('threshold_duplicate', '0.18',  'float',  'Max angle (radians) to classify a pair as duplicate'),
      ('threshold_related',   '0.55',  'float',  'Max angle (radians) to classify a pair as related (above = different)'),
      ('model_name',          'Xenova/paraphrase-multilingual-MiniLM-L12-v2', 'string', 'HuggingFace model used for embeddings'),
      ('embedding_cache',     'true',  'bool',   'Cache ticket embeddings in DB to avoid recomputing'),
      ('min_title_length',    '5',     'int',    'Minimum title length to accept a ticket'),
      ('max_batch_size',      '100',   'int',    'Maximum tickets allowed in a single batch request');
  `);

  // ─── tickets ────────────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
      external_id     VARCHAR(40)     DEFAULT NULL COMMENT 'Custom ID (e.g. TK-0001)',
      title           VARCHAR(500)    NOT NULL,
      description     TEXT            DEFAULT NULL,
      category        VARCHAR(100)    DEFAULT NULL,
      priority        ENUM('low','medium','high','critical') DEFAULT 'medium',
      status          ENUM('open','resolved','closed','duplicate','related') DEFAULT 'open',
      source          VARCHAR(100)    DEFAULT 'manual' COMMENT 'manual | api | import',
      -- Cached embedding (JSON array of floats). Avoids recomputing on repeated comparisons.
      embedding       LONGTEXT        DEFAULT NULL COMMENT 'JSON array — paraphrase-MiniLM embedding vector',
      embedding_model VARCHAR(120)    DEFAULT NULL COMMENT 'Model name used to generate this embedding',
      -- Metrics
      duplicate_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'How many times this ticket was classified as duplicate',
      related_count   SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'How many times classified as related',
      comparison_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total comparisons involving this ticket',
      avg_similarity  DECIMAL(6,3)    DEFAULT NULL COMMENT 'Average similarity % across all comparisons',
      min_angle_seen  DECIMAL(10,6)   DEFAULT NULL COMMENT 'Smallest angle seen (most similar match, radians)',
      -- Timestamps
      created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_external_id (external_id),
      INDEX idx_status (status),
      INDEX idx_category (category),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // ─── comparisons ────────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS comparisons (
      id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      ticket_a_id         INT UNSIGNED  NOT NULL,
      ticket_b_id         INT UNSIGNED  NOT NULL,
      -- Cosine angle result:  θ = arccos(<u,v> / (‖u‖ · ‖v‖))
      angle_rad           DECIMAL(10,6) NOT NULL COMMENT 'θ in radians',
      angle_deg           DECIMAL(8,4)  NOT NULL COMMENT 'θ in degrees',
      similarity_pct      DECIMAL(6,3)  NOT NULL COMMENT 'Similarity percentage (0–100)',
      status              ENUM('duplicate','related','different') NOT NULL,
      -- Snapshot of thresholds used at comparison time (for auditing threshold changes)
      threshold_duplicate DECIMAL(6,4)  NOT NULL COMMENT 'Duplicate threshold applied',
      threshold_related   DECIMAL(6,4)  NOT NULL COMMENT 'Related threshold applied',
      -- Optional human feedback for ML improvements
      feedback            ENUM('correct','incorrect','unsure') DEFAULT NULL,
      feedback_note       VARCHAR(255)  DEFAULT NULL,
      -- Session (null = single comparison, set for batch)
      session_id          INT UNSIGNED  DEFAULT NULL,
      created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_ticket_a (ticket_a_id),
      INDEX idx_ticket_b (ticket_b_id),
      INDEX idx_status (status),
      INDEX idx_session (session_id),
      INDEX idx_angle (angle_rad),
      INDEX idx_created_at (created_at),
      CONSTRAINT fk_comp_a FOREIGN KEY (ticket_a_id) REFERENCES tickets(id) ON DELETE CASCADE,
      CONSTRAINT fk_comp_b FOREIGN KEY (ticket_b_id) REFERENCES tickets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ─── analysis_sessions ─────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS analysis_sessions (
      id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
      name                VARCHAR(200)    DEFAULT NULL COMMENT 'Optional session label',
      type                ENUM('batch','single') NOT NULL DEFAULT 'batch',
      ticket_count        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      comparison_count    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      -- Aggregate metrics
      duplicate_count     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      related_count       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      different_count     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      avg_similarity      DECIMAL(6,3)    DEFAULT NULL,
      avg_angle_rad       DECIMAL(10,6)   DEFAULT NULL,
      min_angle_rad       DECIMAL(10,6)   DEFAULT NULL COMMENT 'Closest pair found',
      max_angle_rad       DECIMAL(10,6)   DEFAULT NULL COMMENT 'Most distant pair found',
      -- Threshold snapshot
      threshold_duplicate DECIMAL(6,4)    DEFAULT NULL,
      threshold_related   DECIMAL(6,4)    DEFAULT NULL,
      model_name          VARCHAR(120)    DEFAULT NULL,
      -- Timing
      processing_ms       INT UNSIGNED    DEFAULT NULL COMMENT 'Total processing time in ms',
      created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_type (type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('[DB] Migrations complete.');
}
