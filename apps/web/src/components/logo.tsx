import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

export default function Logo({ className = '', size = 'md', variant = 'dark' }: LogoProps) {
  const config = {
    sm: { badge: 'h-7 w-7 rounded-lg text-xs', wordmark: 'text-base', gap: 'gap-2' },
    md: { badge: 'h-9 w-9 rounded-xl text-sm', wordmark: 'text-xl', gap: 'gap-2.5' },
    lg: { badge: 'h-12 w-12 rounded-2xl text-base', wordmark: 'text-2xl', gap: 'gap-3' },
  }[size];

  const colors =
    variant === 'light'
      ? {
          badge: 'bg-blue-600 group-hover:bg-blue-500',
          wordmark: 'text-white group-hover:text-blue-200',
        }
      : {
          badge: 'bg-slate-900 group-hover:bg-blue-700',
          wordmark: 'text-slate-900 group-hover:text-blue-700',
        };

  return (
    <Link href="/" className={`inline-flex items-center ${config.gap} group ${className}`}>
      <div
        className={`flex flex-shrink-0 items-center justify-center ${config.badge} ${colors.badge} font-black text-white shadow-sm transition-colors duration-200`}
        aria-hidden="true"
      >
        sL
      </div>
      <span className={`${config.wordmark} font-bold leading-none tracking-tight ${colors.wordmark} transition-colors duration-200`}>
        secure<span className="font-black">Lend</span>
      </span>
    </Link>
  );
}
