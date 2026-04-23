import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompareArrows, Trash2, Wand2 } from 'lucide-react';
import { compareTickets } from '../../services/api';
import ResultCard from '../../components/ResultCard/ResultCard';
import VectorChart, { STATUS_COLOR } from '../../components/VectorChart/VectorChart';
import styles from './Compare.module.css';

const STATUS_LABEL = { duplicate: 'Duplicado', related: 'Relacionado', different: 'Diferente' };

const EXAMPLES = [
  {
    a: { title: 'No puedo iniciar sesión en mi cuenta', description: 'Al intentar ingresar mis credenciales, el sistema me dice que la contraseña es incorrecta aunque la acabo de cambiar.' },
    b: { title: 'Error al ingresar al sistema con mis datos', description: 'Cuando pongo mi usuario y contraseña el portal me dice que son incorrectos y no me deja entrar.' },
  },
  {
    a: { title: 'La aplicación se cierra sola al abrir fotos', description: 'Cada vez que intento ver una imagen en la galería, la app crashea y vuelve al menú principal.' },
    b: { title: 'No puedo procesar el pago con tarjeta de crédito', description: 'Al ingresar los datos de mi tarjeta de crédito, el sistema muestra un error y no completa la transacción.' },
  },
];

function TicketInput({ label, value, onChange }) {
  const isB = label === 'Ticket B';
  return (
    <motion.div
      className={isB ? `${styles.inputCard} ${styles.inputCardB}` : styles.inputCard}
      initial={{ opacity: 0, x: isB ? 24 : -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: isB ? 0.1 : 0, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.inputLabel}>{label}</div>
      <div className="field-group">
        <label className="label">Título</label>
        <input
          className="input-field"
          placeholder="Ej: No puedo iniciar sesión en mi cuenta"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </div>
      <div className="field-group">
        <label className="label">Descripción</label>
        <textarea
          className="input-field textarea-field"
          placeholder="Describe el problema con detalle…"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </div>
    </motion.div>
  );
}

export default function Compare() {
  const [ticketA, setTicketA] = useState({ title: '', description: '' });
  const [ticketB, setTicketB] = useState({ title: '', description: '' });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const canCompare = ticketA.title.trim() && ticketB.title.trim();

  async function handleCompare() {
    if (!canCompare) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await compareTickets(ticketA, ticketB);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function loadExample(ex) {
    setTicketA(ex.a);
    setTicketB(ex.b);
    setResult(null);
    setError('');
  }

  function handleClear() {
    setTicketA({ title: '', description: '' });
    setTicketB({ title: '', description: '' });
    setResult(null);
    setError('');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className="page-eyebrow">Análisis Semántico</div>
          <h1 className="page-title">Comparar Tickets</h1>
          <p className="page-subtitle">Introduce dos tickets y obtén su ángulo de coseno y nivel de similitud.</p>
        </div>

        <div>
          <div className="label">Ejemplos</div>
          <div className={styles.examplesRow}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} className="btn-ghost" onClick={() => loadExample(ex)}>
                <Wand2 size={12} />
                Ejemplo {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.inputs}>
        <TicketInput label="Ticket A" value={ticketA} onChange={setTicketA} />
        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <div className={styles.dividerIcon}>
            <GitCompareArrows size={14} />
          </div>
          <div className={styles.dividerLine} />
        </div>
        <TicketInput label="Ticket B" value={ticketB} onChange={setTicketB} />
      </div>

      <div className={styles.controls}>
        <button className="btn-ghost" onClick={handleClear}>
          <Trash2 size={13} />
          Limpiar
        </button>
        <button
          className="btn-primary"
          onClick={handleCompare}
          disabled={!canCompare || loading}
        >
          {loading ? (
            <><div className="spinner" />Analizando…</>
          ) : (
            <><GitCompareArrows size={14} />Comparar Tickets</>
          )}
        </button>
      </div>

      {error && (
        <div className={`${styles.error} fade-in`}>Error: {error}</div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            className={styles.result}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <ResultCard
              ticketA={result.ticketA}
              ticketB={result.ticketB}
              analysis={result.analysis}
            />

            {/* Vector visualization */}
            <div className={styles.vectorSection}>
              <div className={styles.vectorHeader}>
                <span className={styles.vectorTitle}>Espacio Vectorial</span>
                <span className={styles.vectorSub}>
                  Proyección 2D — Vector A en eje x, Vector B a ángulo θ
                </span>
              </div>

              <div className={styles.vectorBody}>
                <div className={styles.chartWrap}>
                  <VectorChart analysis={result.analysis} />

                  {/* Threshold legend */}
                  <div className={styles.thresholdLegend}>
                    <span className={styles.thLegItem} style={{ '--lc': '#f06072' }}>
                      — dup &lt; {((result.analysis.thresholds?.duplicate ?? 0) * 180 / Math.PI).toFixed(1)}°
                    </span>
                    <span className={styles.thLegItem} style={{ '--lc': '#e0924a' }}>
                      — rel &lt; {((result.analysis.thresholds?.related ?? 0) * 180 / Math.PI).toFixed(1)}°
                    </span>
                  </div>
                </div>

                <div className={styles.vectorStats}>
                  {/* Similarity */}
                  <div className={styles.vStat}>
                    <div className={styles.vStatLabel}>Similitud coseno</div>
                    <div className={styles.vStatValue}
                      style={{ color: STATUS_COLOR[result.analysis.status] }}>
                      {result.analysis.similarity.toFixed(1)}%
                    </div>
                    <div className={styles.vStatBar}>
                      <div
                        className={styles.vStatFill}
                        style={{
                          width: `${result.analysis.similarity}%`,
                          background: STATUS_COLOR[result.analysis.status],
                        }}
                      />
                    </div>
                  </div>

                  {/* Angle */}
                  <div className={styles.vStat}>
                    <div className={styles.vStatLabel}>Ángulo entre vectores</div>
                    <div className={styles.vStatValue} style={{ color: 'var(--text-primary)' }}>
                      {result.analysis.angleDeg.toFixed(2)}°
                      <span className={styles.vStatUnit}> ({result.analysis.angle.toFixed(4)} rad)</span>
                    </div>
                    <div className={styles.vStatBar}>
                      <div
                        className={styles.vStatFill}
                        style={{
                          width: `${Math.min((result.analysis.angle / Math.PI) * 100, 100)}%`,
                          background: 'rgba(255,255,255,0.15)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className={styles.vStat}>
                    <div className={styles.vStatLabel}>Clasificación</div>
                    <div className={styles.statusPill}
                      style={{
                        background: `${STATUS_COLOR[result.analysis.status]}18`,
                        color: STATUS_COLOR[result.analysis.status],
                        border: `1px solid ${STATUS_COLOR[result.analysis.status]}44`,
                      }}>
                      {STATUS_LABEL[result.analysis.status]}
                    </div>
                  </div>

                  {/* Thresholds */}
                  <div className={styles.vStat}>
                    <div className={styles.vStatLabel}>Umbrales configurados</div>
                    <div className={styles.thresholdRows}>
                      <div className={styles.thRow}>
                        <span className={styles.thDot} style={{ background: '#f06072' }} />
                        <span>Duplicado</span>
                        <span className={styles.thVal}>
                          &lt; {((result.analysis.thresholds?.duplicate ?? 0) * 180 / Math.PI).toFixed(1)}°
                        </span>
                      </div>
                      <div className={styles.thRow}>
                        <span className={styles.thDot} style={{ background: '#e0924a' }} />
                        <span>Relacionado</span>
                        <span className={styles.thVal}>
                          &lt; {((result.analysis.thresholds?.related ?? 0) * 180 / Math.PI).toFixed(1)}°
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
