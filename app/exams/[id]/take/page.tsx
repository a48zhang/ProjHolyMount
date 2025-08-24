'use client';

import { Suspense } from 'react';
import TakeExamContent from './take-exam-content';

export default function TakeExamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TakeExamContent />
    </Suspense>
  );
}
