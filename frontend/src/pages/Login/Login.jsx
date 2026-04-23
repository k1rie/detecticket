import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Lock, Eye, EyeOff } from 'lucide-react';
import styles from './Login.module.css';

export default function Login({ onLogin }) {
  const [pw, setPw]         = useState('');
  const [show, setShow]     = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!pw) return;
    setLoading(true);
    setTimeout(() => {
      const ok = onLogin(pw);
      if (ok) { navigate('/'); }
      else { setError('Contraseña incorrecta.'); setLoading(false); }
    }, 380);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}><Cpu size={18} strokeWidth={1.5} /></div>
          <span className={styles.brandName}>DetecTicket</span>
        </div>

        <h1 className={styles.title}>Acceso al sistema</h1>
        <p className={styles.sub}>Ingresa la contraseña para continuar.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="field-group">
            <label className="label">Contraseña</label>
            <div className={styles.inputWrap}>
              <Lock size={12} className={styles.inputIcon} />
              <input
                type={show ? 'text' : 'password'}
                className={`input-field ${styles.input}`}
                placeholder="••••••••"
                value={pw}
                autoFocus
                onChange={e => { setPw(e.target.value); setError(''); }}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShow(v => !v)}>
                {show ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={`btn-primary ${styles.btn}`}
            disabled={!pw || loading}
          >
            {loading ? <><div className="spinner" />Verificando…</> : 'Entrar →'}
          </button>
        </form>

        <div className={styles.publicLink}>
          ¿Solo quieres enviar un ticket?{' '}
          <Link to="/submit" className={styles.publicLinkA}>Portal público →</Link>
        </div>
      </div>
    </div>
  );
}
