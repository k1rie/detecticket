import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { getAllConfig, updateConfig } from '../../services/api';
import styles from './Config.module.css';

const THRESHOLD_INFO = {
  threshold_duplicate: {
    label: 'Umbral Duplicado',
    desc: 'Ángulo máximo (rad) para clasificar un par como duplicado. Menor = más estricto.',
    min: 0.05, max: 1.40, step: 0.01, color: 'var(--status-duplicate)',
  },
  threshold_related: {
    label: 'Umbral Relacionado',
    desc: 'Ángulo máximo (rad) para clasificar un par como relacionado. Por encima = diferente.',
    min: 0.10, max: 1.57, step: 0.01, color: 'var(--status-related)',
  },
};

function ThresholdSlider({ config, onSave }) {
  const info = THRESHOLD_INFO[config.config_key];
  const [val, setVal]       = useState(parseFloat(config.config_value));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const changed = Math.abs(val - parseFloat(config.config_value)) > 0.0001;

  const deg = ((val * 180) / Math.PI).toFixed(1);
  const pct = ((val - info.min) / (info.max - info.min)) * 100;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(config.config_key, val.toFixed(3));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.tsc} style={{ '--t-color': info.color }}>
      <div className={styles.tscHeader}>
        <div>
          <div className={styles.tscLabel}>{info.label}</div>
          <code className={styles.tscKey}>{config.config_key}</code>
        </div>
        <div className={styles.tscValues}>
          <span className={styles.tscRad}>{val.toFixed(3)}</span>
          <span className={styles.tscUnit}>rad</span>
          <span className={styles.tscDeg}>{deg}°</span>
        </div>
      </div>

      <p className={styles.tscDesc}>{info.desc}</p>

      <div className={styles.tscSliderWrap}>
        <span className={styles.tscBound}>{info.min}</span>
        <div className={styles.tscTrack}>
          <div className={styles.tscFill} style={{ width: `${pct}%`, background: info.color }} />
          <input
            type="range"
            className={styles.tscInput}
            min={info.min} max={info.max} step={info.step}
            value={val}
            onChange={(e) => setVal(parseFloat(e.target.value))}
            style={{ '--tc': info.color }}
          />
        </div>
        <span className={styles.tscBound}>{info.max}</span>
      </div>

      <div className={styles.tscFooter}>
        <span className={styles.tscHint}>
          <Info size={10} />
          θ &lt; {val.toFixed(3)} rad → <strong>{config.config_key === 'threshold_duplicate' ? 'Duplicado' : 'Relacionado'}</strong>
        </span>
        {changed && !saved && (
          <button className={`btn-primary ${styles.tscSaveBtn}`} onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 12, height: 12 }} />Guardando</> : <><Save size={11} />Guardar</>}
          </button>
        )}
        {saved && (
          <span className={`${styles.tscSaved} fade-in`}><CheckCircle2 size={12} /> Guardado</span>
        )}
      </div>
    </div>
  );
}

function ConfigRow({ item, onSave }) {
  const [val, setVal]       = useState(item.config_value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const changed = val !== item.config_value;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(item.config_key, val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.cfgRow}>
      <div className={styles.cfgRowInfo}>
        <code className={styles.cfgRowKey}>{item.config_key}</code>
        {item.description && <p className={styles.cfgRowDesc}>{item.description}</p>}
      </div>
      <div className={styles.cfgRowRight}>
        <span className={styles.typePill}>{item.value_type}</span>
        <input
          className={`input-field ${styles.rowInput}`}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && changed && handleSave()}
        />
        {changed && !saved && (
          <button className={`btn-primary ${styles.saveBtn}`} onClick={handleSave} disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Save size={12} />}
          </button>
        )}
        {saved && <CheckCircle2 size={14} style={{ color: 'var(--status-different)', flexShrink: 0 }} />}
      </div>
    </div>
  );
}

export default function Config() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try { setConfigs(await getAllConfig()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(key, value) {
    await updateConfig(key, value);
    await load();
  }

  const thresholdConfigs = configs.filter((c) => c.config_key in THRESHOLD_INFO);
  const otherConfigs     = configs.filter((c) => !(c.config_key in THRESHOLD_INFO));

  const dupVal = parseFloat(configs.find((c) => c.config_key === 'threshold_duplicate')?.config_value ?? 0.95);
  const relVal = parseFloat(configs.find((c) => c.config_key === 'threshold_related')?.config_value  ?? 1.20);
  const maxRad = Math.PI / 2;
  const dupPct = Math.min((dupVal / maxRad) * 100, 100);
  const relPct = Math.min(((relVal - dupVal) / maxRad) * 100, 100);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className="page-eyebrow">Sistema</div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">
            Ajusta los umbrales de clasificación en tiempo real. Los cambios aplican en la próxima comparación.
          </p>
        </div>
        <button className="btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {error && (
        <div className={`${styles.error} fade-in`}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}><div className="spinner" /><span>Cargando…</span></div>
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Umbrales de Clasificación</h2>
            <p className={styles.sectionSub}>Modifica los ángulos de corte para ajustar la sensibilidad del detector.</p>

            <div className={styles.tscGrid}>
              {thresholdConfigs.map((c) => (
                <ThresholdSlider key={c.config_key} config={c} onSave={handleSave} />
              ))}
            </div>

            <div className={styles.refCard}>
              <div className={styles.refLabel}>Zonas actuales de clasificación</div>
              <div className={styles.refBar}>
                <div className={`${styles.refSeg} ${styles.refSegDup}`} style={{ width: `${dupPct}%` }}>
                  <span>Duplicado</span>
                </div>
                <div className={`${styles.refSeg} ${styles.refSegRel}`} style={{ width: `${relPct}%` }}>
                  <span>Relacionado</span>
                </div>
                <div className={`${styles.refSeg} ${styles.refSegDiff}`} style={{ flex: 1 }}>
                  <span>Diferente</span>
                </div>
              </div>
              <div className={styles.refAxis}>
                <span>0 rad (0°)</span>
                <span>{dupVal.toFixed(2)} rad ({((dupVal * 180) / Math.PI).toFixed(1)}°)</span>
                <span>{relVal.toFixed(2)} rad ({((relVal * 180) / Math.PI).toFixed(1)}°)</span>
                <span>π/2 (90°)</span>
              </div>
            </div>
          </section>

          {otherConfigs.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Otras configuraciones</h2>
              <div className={styles.rowsCard}>
                {otherConfigs.map((c) => (
                  <ConfigRow key={c.config_key} item={c} onSave={handleSave} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
