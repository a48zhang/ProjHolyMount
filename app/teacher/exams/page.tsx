'use client';

import { Suspense } from 'react';
import TeacherExamsContent from './teacher-exams-content';

export default function TeacherExamsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <TeacherExamsContent />
    </Suspense>
  );
}