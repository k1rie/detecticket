import { useState, useEffect, useCallback } from 'react';
import { X, Search, Database, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { listTickets } from '../../services/api';
import styles from './DBSelectorDrawer.module.css';

const STATUS_OPTIONS   = ['', 'open', 'resolved', 'duplicate', 'related'];
const PRIORITY_COLORS  = { low: '#5aaa7a', medium: '#c4a882', high: '#c9813d', critical: '#e05c6e' };
const STATUS_COLORS    = { open: '#c4a882', resolved: '#5aaa7a', closed: '#7a7268', duplicate: '#e05c6e', related: '#c9813d' };

export default function DBSelectorDrawer({ open, onClose, selectedIds, onToggle, onAddSelected }) {
  const [tickets, setTickets]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [page, setPage]         = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: page * LIMIT };
      if (status) params.status = status;
      const data = await listTickets(params);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const filtered = search.trim()
    ? tickets.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase()) ||
          t.external_id?.toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  const selectedCount = selectedIds.size;
  const totalPages    = Math.ceil(total / LIMIT);

  function handleSelectAll() {
    filtered.forEach((t) => { if (!selectedIds.has(t.id)) onToggle(t); });
  }

  function handleClearAll() {
    filtered.forEach((t) => { if (selectedIds.has(t.id)) onToggle(t); });
  }

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={`${styles.drawer} fade-in`}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <div className={styles.drawerHeaderIcon}><Database size={15} strokeWidth={1.5} /></div>
            <div>
              <div className={styles.drawerTitle}>Seleccionar de DB</div>
              <div className={styles.drawerSubtitle}>{total} ticket{total !== 1 ? 's' : ''} guardados</div>
            </div>
          </div>
          <button className={styles.drawerClose} onClick={onClose}><X size={15} /></button>
        </div>

        {/* Search + filter */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search size={12} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar tickets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <button
              className={`btn-ghost${showFilter ? ` ${styles.filterActive}` : ''}`}
              onClick={() => setShowFilter((v) => !v)}
            >
              <ChevronDown size={12} style={{ transform: showFilter ? 'rotate(180deg)' : '', transition: '0.2s' }} />
            </button>
            {showFilter && (
              <div className={`${styles.filterDropdown} fade-in`}>
                <span className="label">Estado</span>
                <div className={styles.filterOpts}>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      className={`btn-ghost${status === s ? ` ${styles.filterActive}` : ''}`}
                      style={{ padding: '3px 10px', fontSize: 11 }}
                      onClick={() => { setStatus(s); setPage(0); setShowFilter(false); }}
                    >
                      {s || 'Todos'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="btn-ghost" onClick={load} disabled={loading} style={{ padding: '7px 9px' }}>
            <RefreshCw size={12} />
          </button>
        </div>

        {/* Select all / clear */}
        {filtered.length > 0 && (
          <div className={styles.bulkRow}>
            <button className={styles.bulkBtn} onClick={handleSelectAll}>
              Seleccionar todos ({filtered.length})
            </button>
            <span className={styles.bulkSep}>·</span>
            <button className={styles.bulkBtn} onClick={handleClearAll}>
              Quitar selección
            </button>
          </div>
        )}

        {/* List */}
        <div className={styles.list}>
          {loading ? (
            <div className={styles.stateEmpty}>
              <div className="spinner" />
              <span>Cargando…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.stateEmpty}>
              <Database size={22} strokeWidth={1} style={{ opacity: 0.25 }} />
              <span>No hay tickets{search ? ' para esa búsqueda' : ''}.</span>
            </div>
          ) : (
            filtered.map((t) => {
              const selected = selectedIds.has(t.id);
              return (
                <button
                  key={t.id}
                  className={`${styles.ticketRow}${selected ? ` ${styles.ticketRowSelected}` : ''}`}
                  onClick={() => onToggle(t)}
                >
                  <div className={`${styles.checkbox}${selected ? ` ${styles.checkboxChecked}` : ''}`}>
                    {selected && <Check size={9} strokeWidth={3} />}
                  </div>
                  <div className={styles.ticketBody}>
                    <div className={styles.ticketTop}>
                      <span className={styles.ticketTitle}>{t.title}</span>
                      <div className={styles.ticketPills}>
                        {t.status   && <span className={styles.pill} style={{ color: STATUS_COLORS[t.status]   ?? '#7a7268' }}>{t.status}</span>}
                        {t.priority && <span className={styles.pill} style={{ color: PRIORITY_COLORS[t.priority] ?? '#7a7268' }}>{t.priority}</span>}
                      </div>
                    </div>
                    {t.description && (
                      <div className={styles.ticketDesc}>{t.description}</div>
                    )}
                    <div className={styles.ticketMeta}>
                      {t.external_id && <span className={styles.ticketId}>{t.external_id}</span>}
                      {t.category    && <span className={styles.ticketCat}>{t.category}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button className="btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)} style={{ fontSize: 11, padding: '5px 9px' }}>←</button>
            <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
            <button className="btn-ghost" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ fontSize: 11, padding: '5px 9px' }}>→</button>
          </div>
        )}

        {/* Footer CTA */}
        <div className={styles.footer}>
          <span className={styles.footerCount}>
            {selectedCount > 0 ? `${selectedCount} seleccionado${selectedCount !== 1 ? 's' : ''}` : 'Ninguno seleccionado'}
          </span>
          <button
            className="btn-primary"
            disabled={selectedCount === 0}
            onClick={() => { onAddSelected(); onClose(); }}
          >
            <Check size={13} />
            Agregar {selectedCount > 0 ? selectedCount : ''} al análisis
          </button>
        </div>
      </div>
    </>
  );
}
