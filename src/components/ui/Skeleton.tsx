import styles from './Skeleton.module.css';

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className={styles.list}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={styles.row}>
          <div className={styles.bar} style={{ width: '40%' }} />
          <div className={styles.bar} style={{ width: '15%' }} />
          <div className={styles.bar} style={{ width: '20%' }} />
        </div>
      ))}
    </div>
  );
}
