import styles from './StatusBadge.module.css';

const STATUS_MAP = {
  duplicate: { label: 'Duplicado', cls: styles.duplicate },
  related:   { label: 'Relacionado', cls: styles.related },
  different: { label: 'Diferente',   cls: styles.different },
};

export default function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] || STATUS_MAP.different;
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}
