'use client';

import Link from 'next/link';
import { IconMovieFilter } from '@/app/components/Icons';

/**
 * Tek kaynak: logo + "where was it filmed".
 * Tüm sayfalarda birebir aynı görünsün — font/boyut CSS ile sabitlendi (site-logo-title).
 */
export default function LogoTitle() {
  return (
    <Link href="/" className="site-logo-title flex items-center gap-4" aria-label="Where Was Filmed - Go to homepage">
      <div className="p-2 bg-[#1111d4] rounded-lg text-white" aria-hidden="true">
        <IconMovieFilter size={24} />
      </div>
      <span className="site-logo-title-text">where was it filmed</span>
    </Link>
  );
}
