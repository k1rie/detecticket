import { useState } from 'react';
import styles from './ResultsMatrix.module.css';

const STATUS_COLOR = {
  duplicate: { bg: 'rgba(224,92,110,0.82)',   border: '#e05c6e', text: '#e05c6e',  label: 'DUP' },
  related:   { bg: 'rgba(201,129,61,0.75)',   border: '#c9813d', text: '#c9813d',  label: 'REL' },
  different: { bg: 'rgba(255,255,255,0.04)',  border: 'transparent', text: 'var(--text-muted)', label: '—' },
};

function buildDuplicateGroups(tickets, results) {
  const parent = tickets.map((_, i) => i);
  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  function union(a, b) { parent[find(a)] = find(b); }
  results.filter((r) => r.status === 'duplicate').forEach((r) => union(r.indexA, r.indexB));
  const map = {};
  tickets.forEach((_, i) => {
    const root = find(i);
    if (!map[root]) map[root] = [];
    map[root].push(i);
  });
  return Object.values(map).filter((g) => g.length > 1);
}

function buildRelatedGroups(tickets, results) {
  return results
    .filter((r) => r.status === 'related')
    .map((r) => ({ indexA: r.indexA, indexB: r.indexB, angleDeg: r.angleDeg, similarity: r.similarity }));
}

function shortTitle(title, max = 28) {
  return title.length > max ? title.slice(0, max) + '…' : title;
}

function Cell({ pair, tickets }) {
  const [show, setShow] = useState(false);
  if (!pair) return <div className={`${styles.matrixCell} ${styles.matrixCellSelf}`} />;
  const s = STATUS_COLOR[pair.status];
  return (
    <div
      className={styles.matrixCell}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className={styles.matrixCellInner} style={{ background: s.bg }}>
        <span className={styles.matrixCellLabel} style={{ color: pair.status === 'different' ? 'var(--text-muted)' : '#fff' }}>
          {s.label}
        </span>
      </div>
      {show && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitles}>
            <span>{shortTitle(tickets[pair.indexA].title)}</span>
            <span className={styles.tooltipSep}>↔</span>
            <span>{shortTitle(tickets[pair.indexB].title)}</span>
          </div>
          <div className={styles.tooltipStats}>
            <span style={{ color: s.text }}>{pair.status.toUpperCase()}</span>
            <span>{pair.angleDeg.toFixed(1)}°</span>
            <span>{pair.similarity.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsMatrix({ tickets, results, stats }) {
  const [view, setView] = useState('groups');

  const pairMap = {};
  results.forEach((r) => { pairMap[`${r.indexA}-${r.indexB}`] = r; });
  function getPair(i, j) {
    if (i === j) return null;
    const [a, b] = i < j ? [i, j] : [j, i];
    return pairMap[`${a}-${b}`] ?? null;
  }

  const dupGroups    = buildDuplicateGroups(tickets, results);
  const relatedPairs = buildRelatedGroups(tickets, results);
  const isolatedIdxs = new Set(
    tickets.map((_, i) => i).filter((i) =>
      !results.some((r) => r.status !== 'different' && (r.indexA === i || r.indexB === i))
    )
  );

  return (
    <div className={styles.wrap}>
      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={`${styles.stat} ${styles.statDup}`}>
          <span className={styles.statVal}>{stats.duplicates}</span>
          <span className={styles.statLbl}>Duplicados</span>
        </div>
        <div className={`${styles.stat} ${styles.statRel}`}>
          <span className={styles.statVal}>{stats.related}</span>
          <span className={styles.statLbl}>Relacionados</span>
        </div>
        <div className={`${styles.stat} ${styles.statDiff}`}>
          <span className={styles.statVal}>{stats.different}</span>
          <span className={styles.statLbl}>Diferentes</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{stats.totalComparisons}</span>
          <span className={styles.statLbl}>Comparaciones</span>
        </div>
      </div>

      {/* Toggle */}
      <div className={styles.toggle}>
        <button className={`${styles.toggleBtn}${view === 'groups' ? ` ${styles.toggleBtnActive}` : ''}`} onClick={() => setView('groups')}>
          Grupos
        </button>
        <button className={`${styles.toggleBtn}${view === 'matrix' ? ` ${styles.toggleBtnActive}` : ''}`} onClick={() => setView('matrix')}>
          Matriz
        </button>
      </div>

      {/* GROUPS VIEW */}
      {view === 'groups' && (
        <div className={`${styles.groups} fade-in`}>
          {dupGroups.length === 0 && relatedPairs.length === 0 && (
            <div className={styles.noMatches}>
              <span>✓</span>
              <strong>Ningún ticket duplicado ni relacionado encontrado.</strong>
              <p>Todos los {tickets.length} tickets tratan problemas distintos.</p>
            </div>
          )}

          {dupGroups.map((group, gi) => (
            <div key={gi} className={`${styles.group} ${styles.groupDup}`}>
              <div className={styles.groupHeader}>
                <div className={`${styles.groupBadge} ${styles.groupBadgeDup}`}>Duplicados</div>
                <span className={styles.groupCount}>{group.length} tickets — mismo problema</span>
              </div>
              <div className={styles.groupTickets}>
                {group.map((idx) => {
                  const t = tickets[idx];
                  const pair = group
                    .filter((j) => j !== idx)
                    .map((j) => getPair(idx, j))
                    .filter(Boolean)
                    .sort((a, b) => a.angle - b.angle)[0];
                  return (
                    <div key={idx} className={styles.groupTicket}>
                      <div className={styles.ticketNum}>#{idx + 1}</div>
                      <div className={styles.ticketBody}>
                        <div className={styles.ticketTitle}>{t.title}</div>
                        {t.description && <div className={styles.ticketDesc}>{t.description}</div>}
                        {t.external_id && <code className={styles.ticketId}>{t.external_id}</code>}
                      </div>
                      {pair && (
                        <div className={`${styles.ticketSim} ${styles.ticketSimDup}`}>
                          {pair.similarity.toFixed(1)}%<br />
                          <span>{pair.angleDeg.toFixed(1)}°</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.groupFooter}>
                <span>Recomendación: mantén solo uno, cierra los demás como duplicados.</span>
              </div>
            </div>
          ))}

          {relatedPairs.length > 0 && (
            <div className={styles.relatedSection}>
              <div className={styles.relatedTitle}>
                <div className={`${styles.groupBadge} ${styles.groupBadgeRel}`}>Relacionados</div>
                <span>Pueden compartir causa raíz o vincularse entre sí</span>
              </div>
              {relatedPairs.map((r, i) => (
                <div key={i} className={styles.relatedPair}>
                  <div className={styles.relatedPairTickets}>
                    <div className={styles.relatedTicket}>
                      <span className={styles.ticketNum}>#{r.indexA + 1}</span>
                      <span className={styles.relatedTicketTitle}>{tickets[r.indexA].title}</span>
                    </div>
                    <div className={styles.connector}>
                      <div className={styles.connectorLine} />
                      <div className={styles.connectorInfo}>
                        <span className={styles.connectorAngle}>{r.angleDeg.toFixed(1)}°</span>
                        <span className={styles.connectorSim}>{r.similarity.toFixed(1)}%</span>
                      </div>
                      <div className={styles.connectorLine} />
                    </div>
                    <div className={styles.relatedTicket}>
                      <span className={styles.ticketNum}>#{r.indexB + 1}</span>
                      <span className={styles.relatedTicketTitle}>{tickets[r.indexB].title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isolatedIdxs.size > 0 && (
            <div className={styles.isolated}>
              <div className={styles.isolatedTitle}>
                <div className={`${styles.groupBadge} ${styles.groupBadgeDiff}`}>Únicos</div>
                <span>Sin relación con ningún otro ticket</span>
              </div>
              <div className={styles.isolatedList}>
                {[...isolatedIdxs].map((idx) => (
                  <div key={idx} className={styles.isolatedTicket}>
                    <span className={styles.ticketNum}>#{idx + 1}</span>
                    <span className={styles.isolatedTitleText}>{tickets[idx].title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MATRIX VIEW */}
      {view === 'matrix' && (
        <div className={`${styles.matrixWrap} fade-in`}>
          <div className={styles.matrix} style={{ '--cols': tickets.length + 1 }}>
            <div className={styles.matrixCorner} />
            {tickets.map((t, i) => (
              <div key={i} className={styles.matrixColHeader} title={t.title}>
                <span className={styles.matrixHeaderNum}>#{i + 1}</span>
                <span className={styles.matrixHeaderTitle}>{shortTitle(t.title, 18)}</span>
              </div>
            ))}
            {tickets.map((t, i) => (
              <>
                <div key={`row-${i}`} className={styles.matrixRowHeader} title={t.title}>
                  <span className={styles.matrixHeaderNum}>#{i + 1}</span>
                  <span className={styles.matrixHeaderTitle}>{shortTitle(t.title, 22)}</span>
                </div>
                {tickets.map((_, j) => (
                  <Cell key={`${i}-${j}`} pair={getPair(i, j)} tickets={tickets} />
                ))}
              </>
            ))}
          </div>

          <div className={styles.legend}>
            {[
              ['rgba(224,92,110,0.82)', 'Duplicado'],
              ['rgba(201,129,61,0.75)', 'Relacionado'],
              ['rgba(255,255,255,0.05)', 'Diferente', 'border: 1px solid rgba(255,255,255,0.09)'],
            ].map(([bg, label, extra]) => (
              <div key={label} className={styles.legendItem}>
                <div className={styles.legendSwatch} style={{ background: bg, ...(extra ? { border: '1px solid rgba(255,255,255,0.09)' } : {}) }} />
                <span>{label}</span>
              </div>
            ))}
            <div className={styles.legendItem}>
              <div className={`${styles.legendSwatch} ${styles.legendSwatchSelf}`} />
              <span>Mismo ticket</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
