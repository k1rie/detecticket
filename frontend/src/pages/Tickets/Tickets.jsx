import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, Trash2, RefreshCw,
  Filter, ChevronDown, Hash, BarChart2,
  GitCompare, AlertCircle, AlertTriangle,
} from 'lucide-react';
import { listTickets, deleteTicket, deleteBulkByStatus } from '../../services/api';
import styles from './Tickets.module.css';

const STATUS_OPTIONS   = ['', 'open', 'resolved', 'closed', 'duplicate', 'related'];
const PRIORITY_COLORS  = { low: '#5aaa7a', medium: '#c4a882', high: '#c9813d', critical: '#e05c6e' };
const STATUS_COLORS    = { open: '#c4a882', resolved: '#5aaa7a', closed: '#7a7268', duplicate: '#e05c6e', related: '#c9813d' };

function MetaPill({ color, children }) {
  return (
    <span className={styles.pill} style={{ '--pill-color': color }}>
      {children}
    </span>
  );
}

function TicketRow({ ticket, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${ticket.title}"?`)) return;
    setDeleting(true);
    try { await onDelete(ticket.id); } finally { setDeleting(false); }
  }

  return (
    <div className={styles.row}>
      <div className={styles.rowLeft}>
        <div className={styles.rowIcon}>
          <FileText size={13} strokeWidth={1.5} />
        </div>
        <div className={styles.rowBody}>
          <div className={styles.rowTop}>
            <span className={styles.rowTitle}>{ticket.title}</span>
            <div className={styles.pills}>
              {ticket.status   && <MetaPill color={STATUS_COLORS[ticket.status]   ?? '#7a7268'}>{ticket.status}</MetaPill>}
              {ticket.priority && <MetaPill color={PRIORITY_COLORS[ticket.priority] ?? '#7a7268'}>{ticket.priority}</MetaPill>}
              {ticket.category && <MetaPill color="rgba(154,132,112,0.9)">{ticket.category}</MetaPill>}
            </div>
          </div>
          {ticket.description && (
            <p className={styles.rowDesc}>{ticket.description}</p>
          )}
          <div className={styles.rowMeta}>
            {ticket.external_id && (
              <span className={styles.metaItem}>
                <Hash size={9} /> {ticket.external_id}
              </span>
            )}
            <span className={styles.metaItem}>
              <GitCompare size={9} /> {ticket.comparison_count} comparaciones
            </span>
            {ticket.duplicate_count > 0 && (
              <span className={`${styles.metaItem} ${styles.metaItemDup}`}>
                <AlertCircle size={9} /> {ticket.duplicate_count} duplicado{ticket.duplicate_count !== 1 ? 's' : ''}
              </span>
            )}
            {ticket.avg_similarity != null && (
              <span className={styles.metaItem}>
                <BarChart2 size={9} /> {parseFloat(ticket.avg_similarity).toFixed(1)}% sim. prom.
              </span>
            )}
            <span className={`${styles.metaItem} ${styles.metaDate}`}>
              {new Date(ticket.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
      <button
        className={styles.deleteBtn}
        onClick={handleDelete}
        disabled={deleting}
        title="Eliminar ticket"
      >
        {deleting ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
      </button>
    </div>
  );
}

export default function Tickets() {
  const [tickets, setTickets]         = useState([]);
  const [total, setTotal]             = useState(0);
  const [dupTotal, setDupTotal]       = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [page, setPage]               = useState(0);
  const [showFilter, setShowFilter]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: page * LIMIT };
      if (statusFilter) params.status = statusFilter;
      const [data, dupData] = await Promise.all([
        listTickets(params),
        listTickets({ limit: 1, offset: 0, status: 'duplicate' }),
      ]);
      setTickets(data.tickets);
      setTotal(data.total);
      setDupTotal(dupData.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    await deleteTicket(id);
    load();
  }

  async function handleDeleteDuplicates() {
    if (!confirm(`¿Eliminar los ${dupTotal} ticket${dupTotal !== 1 ? 's' : ''} marcados como duplicado? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      const { deleted } = await deleteBulkByStatus('duplicate');
      if (statusFilter === 'duplicate') setStatus('');
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = search.trim()
    ? tickets.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className="page-eyebrow">Base de Datos</div>
          <h1 className="page-title">Tickets Guardados</h1>
          <p className="page-subtitle">
            Todos los tickets analizados, con sus métricas de comparación.
          </p>
        </div>
        <button className="btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={13} className={loading ? styles.spin : ''} />
          Actualizar
        </button>
      </div>

      {/* Duplicate banner */}
      {dupTotal > 0 && (
        <div className={styles.dupBanner}>
          <span className={styles.dupBannerText}>
            <AlertTriangle size={14} style={{ color: 'var(--status-duplicate)', flexShrink: 0 }} />
            Se detectaron{' '}
            <span className={styles.dupBannerCount}>{dupTotal} ticket{dupTotal !== 1 ? 's' : ''} duplicado{dupTotal !== 1 ? 's' : ''}</span>
            {' '}en la base de datos.
          </span>
          <button
            className={styles.bulkDeleteBtn}
            onClick={handleDeleteDuplicates}
            disabled={deleting}
          >
            {deleting
              ? <><div className="spinner" style={{ width: 12, height: 12, borderTopColor: '#fff' }} />Eliminando…</>
              : <><Trash2 size={13} />Eliminar {dupTotal} duplicado{dupTotal !== 1 ? 's' : ''}</>
            }
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por título o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterWrap}>
          <button
            className={`btn-ghost${showFilter ? ` ${styles.btnActive}` : ''}`}
            onClick={() => setShowFilter((v) => !v)}
          >
            <Filter size={12} />
            Filtrar
            <ChevronDown size={11} style={{ transform: showFilter ? 'rotate(180deg)' : '', transition: '0.2s' }} />
          </button>

          {showFilter && (
            <div className={`${styles.filterDropdown} fade-in`}>
              <label className="label">Estado</label>
              <div className={styles.filterOptions}>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    className={`${styles.filterOpt}${statusFilter === s ? ` ${styles.filterOptActive}` : ''}`}
                    onClick={() => { setStatus(s); setPage(0); setShowFilter(false); }}
                  >
                    {s || 'Todos'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick duplicate filter */}
        <button
          className={`btn-ghost${statusFilter === 'duplicate' ? ` ${styles.btnActive}` : ''}`}
          onClick={() => { setStatus(statusFilter === 'duplicate' ? '' : 'duplicate'); setPage(0); }}
          title="Ver solo duplicados"
        >
          <AlertCircle size={12} style={{ color: dupTotal > 0 ? 'var(--status-duplicate)' : undefined }} />
          Duplicados
          {dupTotal > 0 && <span className={styles.dupBadge}>{dupTotal}</span>}
        </button>

        <span className={styles.count}>{total} ticket{total !== 1 ? 's' : ''}</span>
      </div>

      {/* List */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.stateCenter}>
            <div className="spinner" />
            <span>Cargando tickets…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.stateCenter}>
            <FileText size={30} strokeWidth={1} />
            <span>{search ? 'No hay resultados para esa búsqueda.' : 'No hay tickets guardados aún.'}</span>
            <p>Los tickets se guardan automáticamente al hacer comparaciones.</p>
          </div>
        ) : (
          filtered.map((t) => (
            <TicketRow key={t.id} ticket={t} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className="btn-ghost"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span className={styles.pageInfo}>
            Página {page + 1} de {totalPages}
          </span>
          <button
            className="btn-ghost"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
