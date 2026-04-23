import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, GitCompareArrows, Layers,
  Database, BarChart2, Settings, Cpu,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/',        icon: LayoutDashboard,  label: 'Dashboard', end: true },
  { to: '/compare', icon: GitCompareArrows, label: 'Comparar'            },
  { to: '/batch',   icon: Layers,           label: 'Lote'                },
];

const DB_ITEMS = [
  { to: '/tickets', icon: Database,  label: 'Tickets'  },
  { to: '/metrics', icon: BarChart2, label: 'Métricas' },
  { to: '/config',  icon: Settings,  label: 'Config'   },
];

const linkAnim = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

function NavGroup({ title, items, baseDelay = 0, onClose }) {
  return (
    <div className={styles.navGroup}>
      <span className={styles.navLabel}>{title}</span>
      {items.map(({ to, icon: Icon, label, end }, i) => (
        <motion.div
          key={to}
          variants={linkAnim}
          initial="hidden"
          animate="show"
          transition={{ delay: baseDelay + i * 0.06 }}
        >
          <NavLink
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `${styles.link}${isActive ? ` ${styles.linkActive}` : ''}`
            }
          >
            <Icon size={16} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        </motion.div>
      ))}
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <aside className={`${styles.sidebar}${open ? ` ${styles.sidebarOpen}` : ''}`}>
      <motion.div
        className={styles.logo}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.logoIcon}>
          <Cpu size={16} strokeWidth={1.5} />
        </div>
        <span className={styles.logoText}>DetecTicket</span>
      </motion.div>

      <nav className={styles.nav}>
        <NavGroup title="Análisis" items={NAV_ITEMS} baseDelay={0.06} onClose={onClose} />
        <NavGroup title="Datos"    items={DB_ITEMS}  baseDelay={0.24} onClose={onClose} />
      </nav>

      <motion.div
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <div className={styles.modelBadge}>
          <span className={styles.modelDot} />
          <span>MiniLM-L12-v2</span>
        </div>
      </motion.div>
    </aside>
  );
}
