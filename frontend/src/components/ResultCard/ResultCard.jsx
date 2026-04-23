import TicketCard  from '../TicketCard/TicketCard';
import StatusBadge from '../StatusBadge/StatusBadge';
import AngleMeter  from '../AngleMeter/AngleMeter';
import styles from './ResultCard.module.css';

const STATUS_CLS = {
  duplicate: styles.cardDuplicate,
  related:   styles.cardRelated,
  different: styles.cardDifferent,
};

export default function ResultCard({ ticketA, ticketB, analysis }) {
  return (
    <div className={`${styles.card} ${STATUS_CLS[analysis.status] ?? ''} fade-in`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span>Resultado del análisis</span>
          <StatusBadge status={analysis.status} />
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.tickets}>
          <TicketCard ticket={ticketA} index={0} label="Ticket A" />
          <div className={styles.vs}><span>VS</span></div>
          <TicketCard ticket={ticketB} index={1} label="Ticket B" />
        </div>

        <div className={styles.meterCol}>
          <AngleMeter
            angleDeg={analysis.angleDeg}
            similarity={analysis.similarity}
            status={analysis.status}
          />
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Ángulo (rad)</span>
          <span className={styles.statValue}>{analysis.angle.toFixed(4)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Ángulo (°)</span>
          <span className={styles.statValue}>{analysis.angleDeg.toFixed(2)}°</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Similitud</span>
          <span className={styles.statValue}>{analysis.similarity.toFixed(2)}%</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Estado</span>
          <StatusBadge status={analysis.status} />
        </div>
      </div>
    </div>
  );
}
