import './globals.css';
import type { Metadata } from 'next';
import { Lora, Karla } from 'next/font/google';
import Link from 'next/link';
import { Providers } from './providers';
import styles from './layout.module.css';

const lora = Lora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-lora',
  display: 'swap',
});

const karla = Karla({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-karla',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quick Meal Planner',
  description: 'Recipe catalog and meal planning app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${karla.variable}`}>
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
