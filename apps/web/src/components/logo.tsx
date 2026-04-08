import Link from 'next/link';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 group ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white text-xs font-black tracking-tight select-none">
        KG
      </div>
      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition tracking-tight">
        Kira Güvence
      </span>
    </Link>
  );
}
