'use client';

import { Suspense } from 'react';
import PublicExamDetailContent from './public-exam-detail-content';

export default function PublicExamDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PublicExamDetailContent />
    </Suspense>
  );
}
