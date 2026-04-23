import { Hash, FileText } from 'lucide-react';
import styles from './TicketCard.module.css';

export default function TicketCard({ ticket, index, label }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.id}>
          <Hash size={11} />
          <span>{ticket.id || `TK-${String(index + 1).padStart(4, '0')}`}</span>
        </div>
        {label && <span className={styles.label}>{label}</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.icon}>
          <FileText size={13} strokeWidth={1.5} />
        </div>
        <div className={styles.content}>
          <h4 className={styles.title}>{ticket.title}</h4>
          {ticket.description && (
            <p className={styles.desc}>{ticket.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
