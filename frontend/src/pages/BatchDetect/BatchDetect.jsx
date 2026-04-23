import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Layers, AlertTriangle,
  ChevronDown, ChevronUp, Database, PenLine,
} from 'lucide-react';
import { batchAnalyze }   from '../../services/api';
import StatusBadge        from '../../components/StatusBadge/StatusBadge';
import AngleMeter         from '../../components/AngleMeter/AngleMeter';
import DBSelectorDrawer   from '../../components/DBSelectorDrawer/DBSelectorDrawer';
import ResultsMatrix      from '../../components/ResultsMatrix/ResultsMatrix';
import VectorChart, { STATUS_COLOR } from '../../components/VectorChart/VectorChart';
import styles from './BatchDetect.module.css';

// ── Spectral embed: cosine-similarity matrix → 2D unit directions ─────────────
function embed2D(n, results) {
  // Build cosine similarity matrix
  const S = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
  for (const r of results) {
    const c = Math.cos(r.angle);
    S[r.indexA][r.indexB] = c;
    S[r.indexB][r.indexA] = c;
  }

  if (n === 1) return [{ x: 1, y: 0 }];
  if (n === 2) {
    // Exact: place symmetrically around x-axis
    const half = r => Math.cos(r.angle) >= 0
      ? S[0][1] / 2 : 0;
    const ang = results[0]?.angle ?? 0;
    return [{ x: Math.cos(-ang / 2), y: Math.sin(-ang / 2) },
            { x: Math.cos( ang / 2), y: Math.sin( ang / 2) }];
  }

  function norm(v) {
    const l = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    return l < 1e-12 ? v : v.map(x => x / l);
  }
  function matVec(M, v) {
    return M.map(row => row.reduce((s, x, j) => s + x * v[j], 0));
  }
  function topEigen(M, deflate = null) {
    let v = norm(Array.from({ length: n }, (_, i) => 1 / (i + 1)));
    for (let it = 0; it < 300; it++) {
      let Mv = matVec(M, v);
      if (deflate) {
        const d = Mv.reduce((s, x, i) => s + x * deflate[i], 0);
        Mv = Mv.map((x, i) => x - d * deflate[i]);
      }
      const vNew = norm(Mv);
      if (vNew.reduce((s, x, i) => s + (x - v[i]) ** 2, 0) < 1e-14) { v = vNew; break; }
      v = vNew;
    }
    const Mv = matVec(M, v);
    return { vec: v, val: v.reduce((s, x, i) => s + x * Mv[i], 0) };
  }

  const e1 = topEigen(S);
  const e2 = topEigen(S, e1.vec);

  // Raw 2D coords, then normalise each to unit length (equal-length arrows)
  return Array.from({ length: n }, (_, i) => {
    const x = e1.vec[i] * Math.sqrt(Math.max(e1.val, 0));
    const y = e2.vec[i] * Math.sqrt(Math.max(e2.val, 0));
    const l = Math.sqrt(x * x + y * y) || 1;
    return { x: x / l, y: y / l };
  });
}

function arrowHead(ox, oy, tx, ty, s = 7) {
  const a = Math.atan2(ty - oy, tx - ox);
  return [
    [tx, ty],
    [tx - s * Math.cos(a - 0.4), ty - s * Math.sin(a - 0.4)],
    [tx - s * Math.cos(a + 0.4), ty - s * Math.sin(a + 0.4)],
  ].map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
}

// ── VectorMap ─────────────────────────────────────────────────────────────────
function VectorMap({ tickets, results }) {
  const n = tickets.length;

  const dirs = useMemo(() => embed2D(n, results), [n, results]);

  const ticketStatus = useMemo(() => {
    const s = new Array(n).fill('different');
    for (const r of results) {
      if (r.status === 'duplicate') s[Math.max(r.indexA, r.indexB)] = 'duplicate';
      else if (r.status === 'related') {
        if (s[r.indexA] !== 'duplicate') s[r.indexA] = 'related';
        if (s[r.indexB] !== 'duplicate') s[r.indexB] = 'related';
      }
    }
    return s;
  }, [n, results]);

  const W = 620, H = 400;
  const ox = W / 2, oy = H / 2;   // origin = centre
  const VL = Math.min(W, H) * 0.36; // arrow length in px

  // Convert unit direction → SVG tip (y-axis flipped)
  const tip = (d) => [ox + d.x * VL, oy - d.y * VL];

  // Angle between two unit-direction vectors (for arc labels on close pairs)
  const nonDiff = results.filter(r => r.status !== 'different');

  return (
    <div className={styles.mapSection}>
      <div className={styles.mapHeader}>
        <span className={styles.mapTitle}>Plano Vectorial</span>
        <span className={styles.mapSub}>Cada ticket es un vector desde el origen — vectores cercanos = tickets similares</span>
        <div className={styles.mapLegend}>
          {[['duplicate','Duplicado'],['related','Relacionado'],['different','Diferente']].map(([s, l]) => (
            <span key={s} className={styles.mapLegendItem}>
              <span className={styles.mapLegendDot} style={{ background: STATUS_COLOR[s] }} />{l}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.mapBody}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>

          {/* Reference circle */}
          <circle cx={ox} cy={oy} r={VL}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 6" />
          <circle cx={ox} cy={oy} r={VL * 0.5}
            fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="2 6" />

          {/* X / Y axes */}
          <line x1={ox - VL - 18} y1={oy} x2={ox + VL + 18} y2={oy}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line x1={ox} y1={oy - VL - 18} x2={ox} y2={oy + VL + 18}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x={ox + VL + 22} y={oy + 4} fill="rgba(255,255,255,0.18)"
            fontSize="10" fontFamily="'Courier New',monospace" dominantBaseline="middle">x</text>
          <text x={ox + 4} y={oy - VL - 20} fill="rgba(255,255,255,0.18)"
            fontSize="10" fontFamily="'Courier New',monospace" dominantBaseline="middle">y</text>

          {/* Angle arcs between non-different pairs (only if ≤ 8 total) */}
          {n <= 8 && nonDiff.map((r, i) => {
            const aA = Math.atan2(dirs[r.indexA].y, dirs[r.indexA].x);
            const aB = Math.atan2(dirs[r.indexB].y, dirs[r.indexB].x);
            let diff = aB - aA;
            while (diff > Math.PI)  diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            const arcR = VL * 0.22;
            const ex = ox + arcR * Math.cos(aA + diff);
            const ey = oy - arcR * Math.sin(aA + diff);
            const sx = ox + arcR * Math.cos(aA);
            const sy = oy - arcR * Math.sin(aA);
            const large = Math.abs(diff) > Math.PI ? 1 : 0;
            const sweep = diff > 0 ? 0 : 1;
            return (
              <path key={i}
                d={`M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${arcR} ${arcR} 0 ${large} ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}`}
                fill="none"
                stroke={STATUS_COLOR[r.status]}
                strokeWidth="1"
                strokeOpacity="0.35"
                strokeDasharray={r.status === 'related' ? '3 2' : undefined}
              />
            );
          })}

          {/* Vector arrows */}
          {dirs.map((d, i) => {
            const [tx, ty] = tip(d);
            const col   = STATUS_COLOR[ticketStatus[i]];
            const title = tickets[i].title;
            const label = title.length > 22 ? title.slice(0, 20) + '…' : title;

            // Push label away from origin
            const lx = ox + d.x * (VL + 22);
            const ly = oy - d.y * (VL + 22);
            const anchor = d.x > 0.1 ? 'start' : d.x < -0.1 ? 'end' : 'middle';

            return (
              <g key={i} className={styles.mapNode}
                style={{ animationDelay: `${i * 60}ms` }}>
                {/* Arrow shaft */}
                <line x1={ox} y1={oy} x2={tx.toFixed(1)} y2={ty.toFixed(1)}
                  stroke={col} strokeWidth="2" strokeOpacity="0.75" strokeLinecap="round" />
                {/* Arrowhead */}
                <polygon points={arrowHead(ox, oy, tx, ty)} fill={col} fillOpacity="0.9" />
                {/* Tip circle with index */}
                <circle cx={tx.toFixed(1)} cy={ty.toFixed(1)} r="9"
                  fill={col} fillOpacity="0.12" stroke={col} strokeWidth="1.2" />
                <text x={tx.toFixed(1)} y={ty.toFixed(1)}
                  fill={col} fontSize="9" fontWeight="700" fontFamily="var(--font)"
                  textAnchor="middle" dominantBaseline="middle">{i + 1}</text>
                {/* Title label outside circle */}
                <text x={lx.toFixed(1)} y={ly.toFixed(1)}
                  fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="var(--font)"
                  textAnchor={anchor} dominantBaseline="middle">{label}</text>
              </g>
            );
          })}

          {/* Origin dot */}
          <circle cx={ox} cy={oy} r="4" fill="rgba(255,255,255,0.2)" />
          <circle cx={ox} cy={oy} r="2" fill="rgba(255,255,255,0.5)" />
        </svg>
      </div>
    </div>
  );
}

function PairRow({ pair, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const rowCls = `${styles.pairRow}${pair.status === 'duplicate' ? ` ${styles.pairRowDuplicate}` : pair.status === 'related' ? ` ${styles.pairRowRelated}` : ''}`;

  return (
    <div className={rowCls}>
      <button className={styles.pairHeader} onClick={() => setOpen((v) => !v)}>
        <div className={styles.pairMain}>
          <StatusBadge status={pair.status} />
          <div className={styles.pairTitles}>
            <span className={styles.pairTicketTitle}>{pair.ticketA.title}</span>
            <span className={styles.pairSep}>↔</span>
            <span className={styles.pairTicketTitle}>{pair.ticketB.title}</span>
          </div>
        </div>
        <div className={styles.pairMeta}>
          <span className={styles.pairSimilarity}>{pair.similarity.toFixed(1)}%</span>
          <span className={styles.pairAngle}>{pair.angleDeg.toFixed(1)}°</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {open && (
        <div className={`${styles.pairDetail} fade-in`}>
          <div className={styles.pairDetailTop}>
            <div className={styles.pairDetailTickets}>
              <div className={styles.pairDetailTicket}>
                <div className={styles.pairDetailId}>{pair.ticketA.external_id || pair.ticketA.id || `#${pair.indexA + 1}`}</div>
                <div className={styles.pairDetailTitle}>{pair.ticketA.title}</div>
                {pair.ticketA.description && <div className={styles.pairDetailDesc}>{pair.ticketA.description}</div>}
              </div>
              <div className={styles.pairDetailTicket}>
                <div className={styles.pairDetailId}>{pair.ticketB.external_id || pair.ticketB.id || `#${pair.indexB + 1}`}</div>
                <div className={styles.pairDetailTitle}>{pair.ticketB.title}</div>
                {pair.ticketB.description && <div className={styles.pairDetailDesc}>{pair.ticketB.description}</div>}
              </div>
            </div>
            <div className={styles.pairDetailMeter}>
              <AngleMeter angleDeg={pair.angleDeg} similarity={pair.similarity} status={pair.status} />
            </div>
          </div>

          {/* Mini vector chart */}
          <div className={styles.pairVectorWrap}>
            <div className={styles.pairVectorLabel}>Espacio vectorial del par</div>
            <div className={styles.pairVectorRow}>
              <VectorChart analysis={pair} width={280} height={190} />
              <div className={styles.pairVectorStats}>
                <div className={styles.pvStat}>
                  <span className={styles.pvLabel}>Similitud</span>
                  <span className={styles.pvVal} style={{ color: STATUS_COLOR[pair.status] }}>
                    {pair.similarity.toFixed(1)}%
                  </span>
                </div>
                <div className={styles.pvStat}>
                  <span className={styles.pvLabel}>Ángulo</span>
                  <span className={styles.pvVal}>{pair.angleDeg.toFixed(2)}°</span>
                </div>
                <div className={styles.pvStat}>
                  <span className={styles.pvLabel}>Radianes</span>
                  <span className={styles.pvVal} style={{ fontSize: 12 }}>{pair.angle.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }) {
  return source === 'db'
    ? <span className={`${styles.sourceBadge} ${styles.sourceBadgeDb}`}><Database size={9} />DB</span>
    : <span className={`${styles.sourceBadge} ${styles.sourceBadgeManual}`}><PenLine size={9} />Manual</span>;
}

let manualCounter = 1;
function makeManualId() { return `MAN-${String(manualCounter++).padStart(3, '0')}`; }

export default function BatchDetect() {
  const [tickets, setTickets]       = useState([]);
  const [newTitle, setNewTitle]     = useState('');
  const [newDesc, setNewDesc]       = useState('');
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [pendingIds, setPendingIds]         = useState(new Set());
  const [pendingTickets, setPendingTickets] = useState(new Map());

  function addManual() {
    if (!newTitle.trim()) return;
    setTickets((prev) => [
      ...prev,
      { _key: makeManualId(), title: newTitle.trim(), description: newDesc.trim(), _source: 'manual' },
    ]);
    setNewTitle('');
    setNewDesc('');
    setResults(null);
  }

  function togglePending(ticket) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticket.id)) { next.delete(ticket.id); } else { next.add(ticket.id); }
      return next;
    });
    setPendingTickets((prev) => {
      const next = new Map(prev);
      if (next.has(ticket.id)) { next.delete(ticket.id); } else { next.set(ticket.id, ticket); }
      return next;
    });
  }

  function openDrawer() {
    const existing = new Set(tickets.filter((t) => t._source === 'db').map((t) => t._dbId));
    setPendingIds(new Set(existing));
    setPendingTickets(new Map(tickets.filter((t) => t._source === 'db').map((t) => [t._dbId, t])));
    setDrawerOpen(true);
  }

  function confirmDrawer() {
    const existingDbIds = new Set(tickets.filter((t) => t._source === 'db').map((t) => t._dbId));
    const toAdd = [];
    pendingIds.forEach((id) => {
      if (!existingDbIds.has(id)) {
        const t = pendingTickets.get(id);
        if (t) toAdd.push({
          _key: `DB-${id}`, _dbId: t.id, _source: 'db',
          title: t.title, description: t.description ?? '',
          external_id: t.external_id, category: t.category, priority: t.priority,
        });
      }
    });
    const toKeep = tickets.filter((t) => t._source !== 'db' || pendingIds.has(t._dbId));
    setTickets([...toKeep, ...toAdd]);
    setResults(null);
  }

  function removeTicket(key) {
    setTickets((prev) => prev.filter((t) => t._key !== key));
    setResults(null);
  }

  function clearAll() {
    setTickets([]);
    setResults(null);
    setError('');
  }

  async function handleAnalyze() {
    if (tickets.length < 2) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const payload = tickets.map(({ title, description, external_id }) => ({ title, description, external_id }));
      const data = await batchAnalyze(payload);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredResults = results?.results?.filter((r) =>
    filter === 'all' ? true : r.status === filter
  ) ?? [];

  const dbCount     = tickets.filter((t) => t._source === 'db').length;
  const manualCount = tickets.filter((t) => t._source === 'manual').length;
  const pairCount   = (tickets.length * (tickets.length - 1)) / 2;

  return (
    <div className={styles.page}>
      <DBSelectorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedIds={pendingIds}
        onToggle={togglePending}
        onAddSelected={confirmDrawer}
      />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className="page-eyebrow">Análisis Masivo</div>
          <h1 className="page-title">Detección en Lote</h1>
          <p className="page-subtitle">
            Combina tickets de la DB con entradas manuales y detecta duplicados en una sola pasada.
          </p>
        </div>
        {tickets.length > 0 && (
          <button className="btn-ghost" onClick={clearAll}>
            <Trash2 size={12} /> Limpiar todo
          </button>
        )}
      </div>

      {/* Add area */}
      <div className={styles.addArea}>
        <div className={styles.addCard}>
          <div className={styles.addCardLabel}>
            <PenLine size={12} /> Agregar manualmente
          </div>
          <div className={styles.addInputs}>
            <input
              className="input-field"
              placeholder="Título del ticket"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManual()}
            />
            <input
              className="input-field"
              placeholder="Descripción (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManual()}
            />
          </div>
          <button className="btn-primary" onClick={addManual} disabled={!newTitle.trim()}>
            <Plus size={13} /> Agregar
          </button>
        </div>

        <div className={styles.orDivider}>
          <div className={styles.orLine} />
          <span>o</span>
          <div className={styles.orLine} />
        </div>

        <button className={styles.dbBtn} onClick={openDrawer}>
          <div className={styles.dbBtnIcon}><Database size={18} strokeWidth={1.5} /></div>
          <div className={styles.dbBtnBody}>
            <span className={styles.dbBtnTitle}>Seleccionar desde la DB</span>
            <span className={styles.dbBtnSub}>
              {dbCount > 0 ? `${dbCount} ticket${dbCount !== 1 ? 's' : ''} seleccionado${dbCount !== 1 ? 's' : ''}` : 'Escoge tickets guardados'}
            </span>
          </div>
          <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {/* Summary chips */}
      {tickets.length > 0 && (
        <div className={styles.chips}>
          <div className={`${styles.chip} ${styles.chipTotal}`}>
            <Layers size={11} /> {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </div>
          {dbCount > 0 && (
            <div className={`${styles.chip} ${styles.chipDb}`}>
              <Database size={10} /> {dbCount} de DB
            </div>
          )}
          {manualCount > 0 && (
            <div className={`${styles.chip} ${styles.chipManual}`}>
              <PenLine size={10} /> {manualCount} manual{manualCount !== 1 ? 'es' : ''}
            </div>
          )}
          <div className={`${styles.chip} ${styles.chipPairs}`}>
            {pairCount} comparación{pairCount !== 1 ? 'es' : ''}
          </div>
        </div>
      )}

      {/* Ticket list */}
      {tickets.length > 0 && (
        <div className={styles.ticketList}>
          {tickets.map((t, i) => (
            <div key={t._key} className={styles.ticketItem}>
              <div className={styles.ticketIdx}>{i + 1}</div>
              <div className={styles.ticketBody}>
                <div className={styles.ticketTitleRow}>
                  <span className={styles.ticketTitle}>{t.title}</span>
                  <SourceBadge source={t._source} />
                  {t.priority && (
                    <span className={styles.priorityDot} style={{
                      background: { low: '#5aaa7a', medium: '#c4a882', high: '#c9813d', critical: '#e05c6e' }[t.priority] ?? '#7a7268',
                    }} title={t.priority} />
                  )}
                </div>
                {t.description && <div className={styles.ticketDesc}>{t.description}</div>}
                <div className={styles.ticketMeta}>
                  {t.external_id && <span className={styles.ticketExtId}>{t.external_id}</span>}
                  {t.category    && <span className={styles.ticketCat}>{t.category}</span>}
                </div>
              </div>
              <button className={`btn-ghost ${styles.removeBtn}`} onClick={() => removeTicket(t._key)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      {tickets.length >= 2 && (
        <div className={styles.controls}>
          <span className={styles.statsPre}>
            Se realizarán <strong>{pairCount}</strong> comparaciones
          </span>
          <button className="btn-primary" onClick={handleAnalyze} disabled={loading}>
            {loading
              ? <><div className="spinner" /> Analizando {tickets.length} tickets…</>
              : <><Layers size={14} /> Detectar Duplicados</>}
          </button>
        </div>
      )}

      {tickets.length === 1 && (
        <div className={styles.warn}>
          <AlertTriangle size={13} /> Agrega al menos 2 tickets para analizar.
        </div>
      )}

      {error && <div className={`${styles.error} fade-in`}>Error: {error}</div>}

      {/* Results */}
      {results && (
        <div className={`${styles.results} fade-in`}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>Resultados</h2>
          </div>

          <ResultsMatrix
            tickets={tickets}
            results={results.results}
            stats={results.stats}
          />

          <VectorMap tickets={tickets} results={results.results} />

          <details className={styles.pairDetails}>
            <summary className={styles.pairSummary}>
              Ver todas las comparaciones por par ({results.stats.totalComparisons})
            </summary>
            <div className={styles.filterTabs}>
              {['all','duplicate','related','different'].map((f) => (
                <button
                  key={f}
                  className={`${styles.filterTab}${filter === f ? ` ${styles.filterTabActive}` : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all'        ? `Todos (${results.stats.totalComparisons})`
                  : f === 'duplicate' ? `Duplicados (${results.stats.duplicates})`
                  : f === 'related'   ? `Relacionados (${results.stats.related})`
                  :                    `Diferentes (${results.stats.different})`}
                </button>
              ))}
            </div>
            <div className={styles.pairsList}>
              {filteredResults.length === 0
                ? <div className={styles.emptyPairs}>No hay resultados para este filtro.</div>
                : filteredResults.map((pair, i) => (
                    <PairRow key={i} pair={pair} defaultOpen={false} />
                  ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
