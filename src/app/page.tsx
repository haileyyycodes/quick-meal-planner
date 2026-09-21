'use client';

import { useRouter } from 'next/navigation';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Button } from '@/src/components/ui/Button';

export default function HomePage() {
  const router = useRouter();

  return (
    <main>
      <EmptyState
        title="Select a recipe"
        description="Choose a recipe from the list to view it, or add a new one."
        action={
          <Button variant="primary" onClick={() => router.push('/recipes/new')}>
            + New recipe
          </Button>
        }
      />
    </main>
  );
}
