import './globals.css';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import { Sidebar } from '@/src/components/Sidebar';
import { NavigationGuardProvider } from '@/src/components/NavigationGuard';
import { RecipeMetadataProvider } from '@/src/components/RecipeMetadataContext';
import styles from './layout.module.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quick Meal Planner',
  description: 'Recipe catalog and meal planning app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>
        <Providers>
          <RecipeMetadataProvider>
            <NavigationGuardProvider>
              <div className={styles.appShell}>
                <Sidebar />
                <div className={styles.content}>{children}</div>
              </div>
            </NavigationGuardProvider>
          </RecipeMetadataProvider>
        </Providers>
      </body>
    </html>
  );
}
