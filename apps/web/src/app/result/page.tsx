import { redirect } from 'next/navigation';
import { ResultApproved } from '@/components/result-approved';
import { ResultRejected } from '@/components/result-rejected';

const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL || 'http://localhost:4000';

export default async function ResultPage(props: {
  searchParams: Promise<{ id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const id = searchParams.id;

  if (!id) {
    redirect('/');
  }

  try {
    const response = await fetch(
      `${API_INTERNAL_URL}/api/v1/applications/${id}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      redirect('/');
    }

    const result = await response.json();
    const application = result.data;

    if (application.status === 'APPROVED') {
      return <ResultApproved application={application} />;
    }

    return <ResultRejected application={application} />;
  } catch {
    redirect('/');
  }
}
