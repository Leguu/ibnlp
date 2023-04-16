import ApplicationLayout from '@/layouts/ApplicationLayout';
import { Card, H5 } from '@blueprintjs/core';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Page } from '../_app';

const ProductCard = ({ title, description, href }: { title: string, description: ReactNode, href: string; }) => {
  return (
    <Link href={href} className='hover:no-underline text-white'>
      <Card interactive className='w-80'>
        <H5>{title}</H5>

        {description}
      </Card>
    </Link>
  );
};

const PortalPage: Page = () => {
  return (
    <div className='max-w-3xl mx-auto flex flex-wrap space-y-3 p-4 space-x-3 justify-center'>
      <ProductCard
        title='Unit Planner'
        description={<>
          <p className='text-sm text-gray-500'>
            Plan your lessons with our unit planner:
          </p>

          <ul className='text-sm text-gray-500 list-inside list-disc'>
            <li>Quizzes</li>
            <li>Lectures</li>
            <li>Notes</li>
          </ul>
        </>}
        href='/unit-planner'
      />

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