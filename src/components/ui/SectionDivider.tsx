import styles from './SectionDivider.module.css';

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className={styles.divider} role="separator" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <div className={styles.rule} />
    </div>
  );
}
