import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle, Cpu, ArrowLeft } from 'lucide-react';
import { createTicket } from '../../services/api';
import styles from './Submit.module.css';

export default function Submit() {
  const [name,    setName]    = useState('');
  const [title,   setTitle]   = useState('');
  const [desc,    setDesc]    = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !title.trim()) return;
    setLoading(true);
    setError('');
    try {
      const fullDesc = [
        `Enviado por: ${name.trim()}`,
        desc.trim() ? `\n${desc.trim()}` : '',
      ].join('');
      await createTicket({ title: title.trim(), description: fullDesc, source: 'public' });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    setName(''); setTitle(''); setDesc('');
    setDone(false); setError('');
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Brand header */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}><Cpu size={18} strokeWidth={1.5} /></div>
          <span className={styles.brandName}>DetecTicket</span>
        </div>

        {done ? (
          <div className={styles.successCard}>
            <CheckCircle size={40} strokeWidth={1.2} className={styles.successIcon} />
            <h2 className={styles.successTitle}>¡Ticket enviado!</h2>
            <p className={styles.successSub}>
              Tu reporte fue registrado correctamente. El equipo lo revisará pronto.
            </p>
            <button className={`btn-primary ${styles.newBtn}`} onClick={handleNew}>
              Enviar otro ticket
            </button>
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.eyebrow}>Portal público</div>
              <h1 className={styles.title}>Reportar un problema</h1>
              <p className={styles.sub}>
                Completa el formulario y el equipo lo revisará lo antes posible.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="field-group">
                <label className="label">Tu nombre <span className={styles.req}>*</span></label>
                <input
                  className="input-field"
                  placeholder="Ej: María García"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="field-group">
                <label className="label">Título del problema <span className={styles.req}>*</span></label>
                <input
                  className="input-field"
                  placeholder="Ej: No puedo iniciar sesión en mi cuenta"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="label">Descripción <span className={styles.opt}>(opcional)</span></label>
                <textarea
                  className="input-field textarea-field"
                  placeholder="Describe el problema con detalle: qué estabas haciendo, qué pasó, qué esperabas que pasara…"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  rows={5}
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button
                type="submit"
                className={`btn-primary ${styles.submitBtn}`}
                disabled={!name.trim() || !title.trim() || loading}
              >
                {loading
                  ? <><div className="spinner" />Enviando…</>
                  : <><Send size={14} />Enviar reporte</>}
              </button>
            </form>
          </div>
        )}

        <div className={styles.footer}>
          ¿Eres del equipo?{' '}
          <Link to="/login" className={styles.footerLink}>Acceder al sistema →</Link>
        </div>
      </div>
    </div>
  );
}
