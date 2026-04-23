import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitCompareArrows, Layers, Cpu, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getModelStatus } from '../../services/api';
import styles from './Dashboard.module.css';

const FEATURE_CARDS = [
  {
    icon: GitCompareArrows,
    title: 'Comparar Tickets',
    desc: 'Compara dos tickets directamente y obtén el ángulo de coseno y similitud semántica al instante.',
    to: '/compare',
  },
  {
    icon: Layers,
    title: 'Detección en Lote',
    desc: 'Analiza múltiples tickets simultáneamente y detecta todos los pares duplicados o relacionados.',
    to: '/batch',
  },
];

const THRESHOLDS = [
  { label: 'Duplicado',   angle: '< 0.95 rad',      range: '0° — 54.4°', color: 'var(--status-duplicate)', desc: 'Mismo problema, tickets redundantes.' },
  { label: 'Relacionado', angle: '0.95 – 1.20 rad', range: '54° — 68°',  color: 'var(--status-related)',   desc: 'Problemas similares, pueden vincularse.' },
  { label: 'Diferente',   angle: '> 1.20 rad',       range: '> 68°',     color: 'var(--status-different)', desc: 'Problemas distintos, tickets independientes.' },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [modelStatus, setModelStatus] = useState('unknown');

  useEffect(() => {
    getModelStatus()
      .then((d) => setModelStatus(d.modelStatus))
      .catch(() => setModelStatus('error'));
  }, []);

  const statusCls = {
    ready:   styles.statusReady,
    loading: styles.statusLoading,
    idle:    styles.statusIdle,
    error:   styles.statusError,
    unknown: styles.statusUnknown,
  }[modelStatus] ?? styles.statusUnknown;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Sistema de Detección</div>
          <h1 className={styles.title}>DetecTicket</h1>
          <p className={styles.subtitle}>
            Detección semántica de tickets duplicados usando similitud vectorial con ángulo del coseno.
          </p>
        </div>
        <div className={styles.modelStatus}>
          <div className={`${styles.statusPill} ${statusCls}`}>
            {modelStatus === 'ready' ? (
              <CheckCircle2 size={13} />
            ) : modelStatus === 'error' ? (
              <AlertCircle size={13} />
            ) : (
              <div className="spinner" style={{ width: 13, height: 13 }} />
            )}
            <span>
              {modelStatus === 'ready'   ? 'Modelo listo'
              : modelStatus === 'loading' ? 'Cargando modelo…'
              : modelStatus === 'idle'    ? 'Modelo en espera'
              : modelStatus === 'error'   ? 'Error al cargar'
              : 'Verificando…'}
            </span>
          </div>
          <div className={styles.modelName}>
            <Cpu size={12} />
            paraphrase-multilingual-MiniLM-L12-v2
          </div>
        </div>
      </div>

      <motion.div className={styles.featureGrid} variants={stagger} initial="hidden" animate="show">
        {FEATURE_CARDS.map(({ icon: Icon, title, desc, to }) => (
          <motion.button key={to} className={styles.featureCard} variants={item} onClick={() => navigate(to)}>
            <div className={styles.featureIcon}>
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <div className={styles.featureBody}>
              <h3 className={styles.featureTitle}>{title}</h3>
              <p className={styles.featureDesc}>{desc}</p>
            </div>
            <ChevronRight size={15} className={styles.featureArrow} />
          </motion.button>
        ))}
      </motion.div>

      <div className={styles.formulaSection}>
        <h2 className={styles.sectionTitle}>Fórmula de Similitud</h2>
        <div className={styles.formulaBlock}>
          <div className={styles.formulaDisplay}>
            <span className={styles.formulaName}>Ángulo del Coseno</span>
            <div className={styles.formulaEq}>
              <span className={styles.formulaTheta}>θ</span>
              <span className={styles.formulaOp}>=</span>
              <span className={styles.formulaFn}>arccos</span>
              <span className={styles.formulaParen}>(</span>
              <div className={styles.formulaFraction}>
                <span className={`${styles.formulaNum} ${styles.formulaHighlight}`}>&lt;u, v&gt;</span>
                <span className={styles.formulaDivLine} />
                <span className={styles.formulaDen}>
                  <span className={styles.formulaHighlight}>‖u‖</span>
                  <span> · </span>
                  <span className={styles.formulaHighlight}>‖v‖</span>
                </span>
              </div>
              <span className={styles.formulaParen}>)</span>
            </div>
          </div>
          <div className={styles.formulaLegend}>
            {[
              ['<u,v>', 'Producto punto de los vectores de embedding'],
              ['‖u‖, ‖v‖', 'Norma euclidiana de cada vector'],
              ['θ → 0', 'Tickets idénticos (duplicados)'],
              ['θ → π/2', 'Tickets sin relación'],
            ].map(([code, label]) => (
              <div key={code} className={styles.legendItem}>
                <code>{code}</code>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.thresholdsSection}>
        <h2 className={styles.sectionTitle}>Umbrales de Clasificación</h2>
        <motion.div className={styles.thresholdsGrid} variants={stagger} initial="hidden" animate="show">
          {THRESHOLDS.map(({ label, range, angle, color, desc }) => (
            <motion.div key={label} className={styles.thresholdCard} variants={item} style={{ '--t-color': color }}>
              <div className={styles.thresholdDot} />
              <div className={styles.thresholdBody}>
                <div className={styles.thresholdLabel}>{label}</div>
                <div className={styles.thresholdAngle}>{angle}</div>
                <div className={styles.thresholdRange}>{range}</div>
                <p className={styles.thresholdDesc}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
