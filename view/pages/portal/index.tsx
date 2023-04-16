import ApplicationNavbar from '@/components/ApplicationNavbar';
import ApplicationLayout from '@/layouts/ApplicationLayout';
import { Card, H5 } from '@blueprintjs/core';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Page } from '../_app';

const PortalPage: Page = () => {
  return (
    <div className='max-w-3xl mx-auto flex flex-wrap space-y-3 p-4 space-x-3 justify-center'>

      <Link href='/teacher' className='hover:no-underline'>
        <Card interactive className='max-w-[theme(spacing.80)] w-full'>
          <H5>Teacher Resources</H5>

          <p className='text-sm text-gray-500'>
            Create and manage your own resources:
          </p>

          <ul className='text-sm text-gray-500 list-inside list-disc'>
            <li>Quizzes</li>
            <li>Lectures</li>
            <li>Notes</li>
          </ul>
        </Card>
      </Link>

      <Link href='/search' className='hover:no-underline'>
        <Card interactive className='max-w-[theme(spacing.80)] no-underline w-full'>
          <H5>Semantic Search</H5>

          <p className='text-sm text-gray-500'>
            Our flagship search product: Search your documents intelligently, what you want and how you meant it.
          </p>
        </Card>
      </Link>

    </div>
  );
};

PortalPage.authenticated = true;
PortalPage.getLayout = (page: ReactNode) => {
  return (
    <ApplicationLayout pageName='Portal'>
      {page}
    </ApplicationLayout>
  );
};

export default PortalPage;