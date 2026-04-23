import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, GitCompare, AlertCircle, CheckCircle2,
  Clock, RefreshCw, TrendingUp, Activity,
} from 'lucide-react';
import { getMetrics, getAccuracy } from '../../services/api';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import styles from './Metrics.module.css';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div className={styles.statCard} variants={cardItem}>
      <div className={styles.statIcon} style={{ color }}>
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div className={styles.statBody}>
        <div className={styles.statValue} style={{ color }}>{value ?? '—'}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </motion.div>
  );
}

function AngleBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={styles.angleBar}>
      <div className={styles.angleBarTop}>
        <span className={styles.angleBarLabel}>{label}</span>
        <span className={styles.angleBarValue} style={{ color }}>
          {value != null ? `${parseFloat(value).toFixed(4)} rad` : '—'}
        </span>
      </div>
      <div className={styles.angleTrack}>
        <div className={styles.angleFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Metrics() {
  const [data, setData]       = useState(null);
  const [accuracy, setAcc]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [m, a] = await Promise.all([getMetrics(), getAccuracy()]);
      setData(m);
      setAcc(a);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className={`${styles.page} ${styles.centered}`}>
      <div className="spinner" style={{ width: 22, height: 22 }} />
      <span>Cargando métricas…</span>
    </div>
  );

  if (error) return (
    <div className={`${styles.page} ${styles.centered}`}>
      <AlertCircle size={22} style={{ color: 'var(--status-duplicate)' }} />
      <span style={{ color: 'var(--status-duplicate)' }}>{error}</span>
    </div>
  );

  const c = data?.comparisons ?? {};
  const t = data?.thresholds  ?? {};
  const sessions = data?.recentSessions ?? [];
  const total    = c.total ?? 0;
  const dup      = c.duplicates ?? 0;
  const rel      = c.related   ?? 0;
  const diff     = c.different ?? 0;

  const dupPct  = total > 0 ? ((dup / total) * 100).toFixed(1) : '0';
  const relPct  = total > 0 ? ((rel / total) * 100).toFixed(1) : '0';
  const diffPct = total > 0 ? ((diff / total) * 100).toFixed(1) : '0';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className="page-eyebrow">Análisis de Datos</div>
          <h1 className="page-title">Métricas</h1>
          <p className="page-subtitle">Estadísticas globales de comparaciones y rendimiento del sistema.</p>
        </div>
        <button className="btn-ghost" onClick={load}>
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* Top stats */}
      <motion.div className={styles.statsGrid} variants={stagger} initial="hidden" animate="show">
        <StatCard icon={Activity}     label="Total comparaciones" value={total}       color="var(--accent)"           />
        <StatCard icon={BarChart2}    label="Tickets en DB"       value={data?.tickets?.total ?? 0} color="var(--accent-secondary)" />
        <StatCard icon={AlertCircle}  label="Duplicados"          value={`${dup} (${dupPct}%)`}   color="var(--status-duplicate)"  />
        <StatCard icon={GitCompare}   label="Relacionados"        value={`${rel} (${relPct}%)`}   color="var(--status-related)"    />
        <StatCard icon={CheckCircle2} label="Diferentes"          value={`${diff} (${diffPct}%)`} color="var(--status-different)"  />
        <StatCard icon={TrendingUp}   label="Similitud promedio"  value={c.avg_similarity != null ? `${parseFloat(c.avg_similarity).toFixed(2)}%` : '—'} color="var(--accent)" />
      </motion.div>

      {/* Distribution bar */}
      {total > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Distribución de resultados</h2>
          <div className={styles.distCard}>
            <div className={styles.distBarContainer}>
              <div className={`${styles.distSeg} ${styles.distSegDup}`}  style={{ width: `${dupPct}%`  }} title={`Duplicados: ${dupPct}%`}  />
              <div className={`${styles.distSeg} ${styles.distSegRel}`}  style={{ width: `${relPct}%`  }} title={`Relacionados: ${relPct}%`} />
              <div className={`${styles.distSeg} ${styles.distSegDiff}`} style={{ width: `${diffPct}%` }} title={`Diferentes: ${diffPct}%`}  />
            </div>
            <div className={styles.distLegend}>
              {[
                ['var(--status-duplicate)', `Duplicados ${dupPct}%`],
                ['var(--status-related)',   `Relacionados ${relPct}%`],
                ['var(--status-different)', `Diferentes ${diffPct}%`],
              ].map(([color, label]) => (
                <div key={label} className={styles.distLegendItem}>
                  <span className={styles.distDot} style={{ background: color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Angle stats */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Estadísticas de ángulo (radians)</h2>
        <div className={styles.angleCard}>
          <AngleBar label="Ángulo mínimo (par más similar)"  value={c.min_angle}  max={Math.PI / 2} color="var(--status-duplicate)" />
          <AngleBar label="Ángulo promedio"                  value={c.avg_angle}  max={Math.PI / 2} color="var(--accent)"           />
          <AngleBar label="Ángulo máximo (par más distinto)" value={c.max_angle}  max={Math.PI / 2} color="var(--status-different)"  />
          <div className={styles.thresholds}>
            <div className={styles.thresholdMarker} style={{ left: `${(t.duplicate / (Math.PI / 2)) * 100}%` }}>
              <div className={`${styles.markerLine} ${styles.markerLineDup}`} />
              <span className={styles.markerLabel}>Dup {t.duplicate} rad</span>
            </div>
            <div className={styles.thresholdMarker} style={{ left: `${(t.related / (Math.PI / 2)) * 100}%` }}>
              <div className={`${styles.markerLine} ${styles.markerLineRel}`} />
              <span className={styles.markerLabel}>Rel {t.related} rad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback accuracy */}
      {accuracy.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Precisión por configuración de umbrales</h2>
          <div className={styles.accuracyTable}>
            <div className={styles.accHeader}>
              <span>Umbral dup.</span>
              <span>Umbral rel.</span>
              <span>Comparaciones</span>
              <span>Correctas</span>
              <span>Incorrectas</span>
              <span>Precisión</span>
            </div>
            {accuracy.map((row, i) => (
              <div key={i} className={styles.accRow}>
                <span className={styles.accMono}>{row.threshold_duplicate}</span>
                <span className={styles.accMono}>{row.threshold_related}</span>
                <span>{row.total}</span>
                <span style={{ color: 'var(--status-different)' }}>{row.correct ?? 0}</span>
                <span style={{ color: 'var(--status-duplicate)' }}>{row.incorrect ?? 0}</span>
                <span className={styles.accPct} style={{
                  color: row.accuracy_pct >= 80 ? 'var(--status-different)' : row.accuracy_pct >= 60 ? 'var(--status-related)' : 'var(--status-duplicate)',
                }}>
                  {row.accuracy_pct != null ? `${row.accuracy_pct}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sesiones recientes</h2>
        {sessions.length === 0 ? (
          <div className={styles.empty}>
            <Clock size={18} strokeWidth={1.5} />
            <span>No hay sesiones de análisis aún.</span>
          </div>
        ) : (
          <div className={`${styles.sessionsList} ${styles.sessionBorder}`}>
            {sessions.map((s) => (
              <div key={s.id} className={styles.sessionRow}>
                <div className={styles.sessionLeft}>
                  <div className={styles.sessionId}>#{s.id}</div>
                  <div>
                    <div className={styles.sessionName}>{s.name ?? `Sesión ${s.id}`}</div>
                    <div className={styles.sessionMeta}>
                      <span>{s.ticket_count} tickets</span>
                      <span>·</span>
                      <span>{s.comparison_count} comparaciones</span>
                      {s.processing_ms && <><span>·</span><span>{s.processing_ms}ms</span></>}
                      <span>·</span>
                      <span>{new Date(s.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.sessionStats}>
                  {s.duplicate_count > 0 && <StatusBadge status="duplicate" />}
                  {s.related_count   > 0 && <StatusBadge status="related"   />}
                  <span className={styles.sessionSim}>
                    {s.avg_similarity != null ? `${parseFloat(s.avg_similarity).toFixed(1)}% sim.` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
