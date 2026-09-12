import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Providers } from './providers';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'Quick Meal Planner',
  description: 'Recipe catalog and meal planning app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link href="/" className={styles.brand}>
                Quick Meal Planner
              </Link>
              <nav aria-label="Primary">
                <Link href="/recipes/new" className={styles.newRecipeLink}>
                  + New recipe
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
