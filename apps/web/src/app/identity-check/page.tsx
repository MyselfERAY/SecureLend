import { IdentityVerification } from '@/components/identity-verification';

export default function IdentityCheckPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Kimlik Doğrulama
          </h1>
          <p className="text-muted-foreground">
            KPS (Kimlik Paylaşım Sistemi) üzerinden kimlik bilgilerinizi doğrulayın.
          </p>
        </div>
        
        <IdentityVerification />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Kimlik doğrulama işlemi T.C. İçişleri Bakanlığı Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü
            tarafından sağlanan KPS servisi üzerinden gerçekleştirilmektedir.
          </p>
        </div>
      </div>
    </div>
  );
}