import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Sidebar     from './components/Sidebar/Sidebar';
import Dashboard   from './pages/Dashboard/Dashboard';
import Compare     from './pages/Compare/Compare';
import BatchDetect from './pages/BatchDetect/BatchDetect';
import Tickets     from './pages/Tickets/Tickets';
import Metrics     from './pages/Metrics/Metrics';
import Config      from './pages/Config/Config';
import Login       from './pages/Login/Login';
import Submit      from './pages/Submit/Submit';
import styles from './App.module.css';

const AUTH_PASSWORD = 'detectar2024';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0,        transition: { duration: 0.12 } },
};

function ProtectedRoute({ authed, children }) {
  return authed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();
  const [authed,     setAuthed]     = useState(() => localStorage.getItem('dt_auth') === '1');
  const [navOpen,    setNavOpen]    = useState(false);

  function handleLogin(pw) {
    if (pw === AUTH_PASSWORD) {
      localStorage.setItem('dt_auth', '1');
      setAuthed(true);
      return true;
    }
    return false;
  }

  // Public pages don't need the app shell
  if (location.pathname === '/submit') {
    return <Submit />;
  }
  if (location.pathname === '/login') {
    return authed
      ? <Navigate to="/" replace />
      : <Login onLogin={handleLogin} />;
  }

  if (!authed) return <Navigate to="/login" replace />;

  return (
    <div className={styles.appLayout}>
      {/* Mobile overlay */}
      {navOpen && (
        <div className={styles.overlay} onClick={() => setNavOpen(false)} />
      )}

      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <main className={styles.appMain}>
        {/* Mobile top bar */}
        <div className={styles.mobileBar}>
          <button className={styles.hamburger} onClick={() => setNavOpen(v => !v)}>
            {navOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className={styles.mobileTitle}>DetecTicket</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className={styles.pageWrap}
          >
            <Routes location={location}>
              <Route path="/"        element={<Dashboard />}   />
              <Route path="/compare" element={<Compare />}     />
              <Route path="/batch"   element={<BatchDetect />} />
              <Route path="/tickets" element={<Tickets />}     />
              <Route path="/metrics" element={<Metrics />}     />
              <Route path="/config"  element={<Config />}      />
              <Route path="*"        element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
