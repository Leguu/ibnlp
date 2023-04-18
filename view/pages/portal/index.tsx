import ApplicationLayout from '@/layouts/ApplicationLayout';
import { Card, H5 } from '@blueprintjs/core';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Page } from '../_app';

const ProductCard = ({ title, description, href }: { title: string, description: ReactNode, href: string; }) => {
  return (
    <Link href={href} className='hover:no-underline text-white'>
      <Card interactive className='w-80 min-h-[theme(spacing.40)] m-2'>
        <H5>{title}</H5>

        {description}
      </Card>
    </Link>
  );
};

const PortalPage: Page = () => {
  return (
    <div className='max-w-3xl mx-auto flex flex-wrap p-2 justify-center'>
      <ProductCard
        title='Unit Planner'
        description={<>
          <p className='text-gray-500'>
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

      <ProductCard
        title='Semantic Search'
        href='/search'
        description={<>
          <p className='text-gray-500'>
            Search for content in any document using natural language.
          </p>
        </>}
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