import { ReactNode } from 'react';
import styles from './Tag.module.css';

type TagProps = {
  children: ReactNode;
  tone?: 'neutral' | 'green' | 'orange';
};

export function Tag({ children, tone = 'neutral' }: TagProps) {
  return <span className={[styles.tag, styles[tone]].join(' ')}>{children}</span>;
}
