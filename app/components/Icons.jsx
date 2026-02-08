'use client';

/**
 * Inline SVG ikonlar — font yüklenene kadar ikon ismi yerine hemen görünsün.
 * Material Symbols görünümüne yakın, currentColor ile renk alır.
 */
const sizeMap = { sm: 18, md: 24, lg: 28 };

export function IconMovieFilter({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
      </svg>
    </span>
  );
}

export function IconSearch({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </span>
  );
}

export function IconTrendingUp({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    </span>
  );
}

export function IconLocationOn({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    </span>
  );
}

export function IconVideocam({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
      </svg>
    </span>
  );
}

export function IconArrowForward({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M6.23 20.23L8 22l10-10L8 2 6.23 3.77 14.46 12z" />
      </svg>
    </span>
  );
}

export function IconExpandMore({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
      </svg>
    </span>
  );
}

export function IconLightbulb({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
      </svg>
    </span>
  );
}

export function IconMap({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
      </svg>
    </span>
  );
}

export function IconSchedule({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
      </svg>
    </span>
  );
}

export function IconNorthEast({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z" />
      </svg>
    </span>
  );
}

export function IconRefresh({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
      </svg>
    </span>
  );
}

export function IconShare({ className = '', size = 'md' }) {
  const s = typeof size === 'number' ? size : sizeMap[size] || 24;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: s, height: s }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="block">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
      </svg>
    </span>
  );
}
