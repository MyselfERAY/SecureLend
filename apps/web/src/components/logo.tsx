import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const config = {
    sm: { badge: 'h-7 w-7 rounded-lg text-xs', wordmark: 'text-base', gap: 'gap-2' },
    md: { badge: 'h-9 w-9 rounded-xl text-sm', wordmark: 'text-xl', gap: 'gap-2.5' },
    lg: { badge: 'h-12 w-12 rounded-2xl text-base', wordmark: 'text-2xl', gap: 'gap-3' },
  }[size];

  return (
    <Link href="/" className={`inline-flex items-center ${config.gap} group ${className}`}>
      {/* Badge mark */}
      <div
        className={`flex flex-shrink-0 items-center justify-center ${config.badge} bg-slate-900 font-black text-white shadow-sm group-hover:bg-blue-700 transition-colors duration-200`}
        aria-hidden="true"
      >
        sL
      </div>

      {/* Wordmark */}
      <span className={`${config.wordmark} font-bold leading-none tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors duration-200`}>
        secure<span className="font-black">Lend</span>
      </span>
    </Link>
  );
}
