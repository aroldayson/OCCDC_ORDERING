export function SidebarToggleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="3.5"
        width="15"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="6.5"
        y1="5.5"
        x2="6.5"
        y2="14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type SidebarToggleButtonProps = {
  onClick: () => void;
  ariaLabel: string;
  className?: string;
};

export function SidebarToggleButton({ onClick, ariaLabel, className = "" }: SidebarToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 ${className}`}
      aria-label={ariaLabel}
    >
      <SidebarToggleIcon />
    </button>
  );
}
