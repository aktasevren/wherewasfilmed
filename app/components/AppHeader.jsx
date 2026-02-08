'use client';

import LogoTitle from '@/app/components/LogoTitle';

/**
 * Tüm sayfalarda aynı header: logo + başlık (LogoTitle) + isteğe bağlı sağ içerik.
 */
export default function AppHeader({ rightContent }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 py-8 pl-12 pr-8 flex justify-between items-center bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5" role="banner">
      <nav aria-label="Main navigation">
        <LogoTitle />
      </nav>
      {rightContent != null ? <div className="flex items-center" role="status" aria-live="polite">{rightContent}</div> : <div />}
    </header>
  );
}
