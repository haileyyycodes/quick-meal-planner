'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CaretLeft, CaretRight, List } from '@phosphor-icons/react';
import { IconRail } from './IconRail';
import { SecondaryPanel } from './SecondaryPanel';
import styles from './Sidebar.module.css';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SECONDARY_PANEL_ID = 'secondary-panel';

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the mobile drawer whenever the route changes (covers link clicks and back/forward).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;

    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <>
      <div className={styles.mobileBar}>
        <button
          ref={toggleRef}
          type="button"
          className={styles.mobileToggle}
          aria-expanded={mobileOpen}
          aria-controls="main-nav"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <List size={22} aria-hidden="true" />
          <span className={styles.srOnly}>Open main menu</span>
        </button>
        <span className={styles.mobileBrand}>Quick Meal Planner</span>
      </div>

      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside
        id="main-nav"
        ref={panelRef}
        className={mobileOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar}
      >
        <IconRail />
        <button
          type="button"
          className={styles.panelToggle}
          aria-expanded={!panelCollapsed}
          aria-controls={SECONDARY_PANEL_ID}
          data-tooltip={panelCollapsed ? 'Show panel' : 'Hide panel'}
          onClick={() => setPanelCollapsed((collapsed) => !collapsed)}
        >
          {panelCollapsed ? <CaretRight size={14} aria-hidden="true" /> : <CaretLeft size={14} aria-hidden="true" />}
          <span className={styles.srOnly}>{panelCollapsed ? 'Show recipe panel' : 'Hide recipe panel'}</span>
        </button>
        <SecondaryPanel id={SECONDARY_PANEL_ID} collapsed={panelCollapsed} />
      </aside>
    </>
  );
}
