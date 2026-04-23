import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  // Railway proxy requires TLS but with relaxed validation
  ssl: { rejectUnauthorized: false, minVersion: 'TLSv1' },
});

export async function query(sql, params = []) {
  // pool.query() uses client-side escaping — avoids MySQL 9.x server-side
  // prepared statement bugs (Incorrect arguments to mysqld_stmt_execute).
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

export async function getConnection() {
  return pool.getConnection();
}

export async function testConnection() {
  const row = await queryOne('SELECT VERSION() AS version, NOW() AS now');
  console.log(`[DB] Connected — MySQL ${row.version}`);
  return row;
}

export default pool;
