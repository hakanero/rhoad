// Small inline icon set. 16px, stroke-based, currentColor.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const wrap = (d: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 16 16" {...P} aria-hidden>{d}</svg>
)

export const I = {
  home: () => wrap(<><path d="M2.5 7.5 8 3l5.5 4.5V13a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z"/><path d="M6.5 14V9.5h3V14"/></>),
  pitch: () => wrap(<><path d="M4 2.5h6l3 3V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"/><path d="M5.5 8h5M5.5 10.5h5"/></>),
  content: () => wrap(<><rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M6 3v10"/></>),
  next: () => wrap(<><path d="M3 8h9"/><path d="M8.5 4.5 12 8l-3.5 3.5"/></>),
  plus: () => wrap(<path d="M8 3.5v9M3.5 8h9"/>),
  receipt: () => wrap(<><path d="M4 2.5h8v11l-2-1-2 1-2-1-2 1z"/><path d="M6 6h4M6 8.5h4"/></>),
  people: () => wrap(<><circle cx="6" cy="5.5" r="2.25"/><path d="M2.5 13c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5"/><circle cx="11" cy="6" r="1.75"/><path d="M10.5 9.5c1.7 0 3 1.4 3 3.2"/></>),
  link: () => wrap(<><path d="M6.5 9.5 9.5 6.5"/><path d="M7 4.5 8.2 3.3a2.3 2.3 0 0 1 3.3 3.3L10.3 7.8"/><path d="M9 11.5 7.8 12.7a2.3 2.3 0 0 1-3.3-3.3L5.7 8.2"/></>),
  check: () => wrap(<path d="M3.5 8.5 6.5 11.5 12.5 4.5"/>),
  out: () => wrap(<><path d="M6.5 13H3.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3"/><path d="M10 11l3-3-3-3M13 8H6.5"/></>),
  clock: () => wrap(<><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></>),
}
