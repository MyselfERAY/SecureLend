import { KpsVerification } from '@/components/kps-verification';

export default function KpsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        KPS Doğrulama
      </h1>
      <KpsVerification />
    </div>
  );
}
