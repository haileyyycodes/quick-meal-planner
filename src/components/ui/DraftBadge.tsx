import styles from './DraftBadge.module.css';

export function DraftBadge() {
  return (
    <span className={styles.badge} title="Missing a category, total time, ingredients, or steps">
      Draft
    </span>
  );
}
