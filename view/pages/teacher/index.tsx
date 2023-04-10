import ApplicationLayout from '@/layouts/ApplicationLayout';
import { ReactNode } from 'react';

export default function TeacherPage() {
  return (
    <div>
      Coming soon...
    </div>
  );
}

TeacherPage.getLayout = (page: ReactNode) => {
  return (
    <ApplicationLayout pageName='Teacher'>
      {page}
    </ApplicationLayout>
  );
};