import ApplicationLayout from '@/layouts/ApplicationLayout';
import { Card, Classes, H5 } from '@blueprintjs/core';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { Page } from '../_app';
import { useRequests } from '@/utils/http';
import { Popover2, Tooltip2 } from '@blueprintjs/popover2';
import { useApi } from '@/api/api';
import { User } from '@/api/types/model';

interface Props {
  title: string;
  description: ReactNode;
  href: string;
  disabled?: boolean;
  hoverText?: string;
}

const ProductCard = ({ title, description, href, disabled, hoverText }: Props) => {
  return (
    <Tooltip2
      content={hoverText}
      matchTargetWidth
      className={Classes.DARK}
    >
      <Link href={href} className={'hover:no-underline text-white' + (disabled ? ' pointer-events-none opacity-50' : '')} >
        <Card interactive={!disabled} className='w-80 min-h-[theme(spacing.40)] m-2'>
          <H5>{title}</H5>

          {description}
        </Card>
      </Link>
    </Tooltip2>
  );
};

const PortalPage: Page = () => {
  const { get } = useRequests();

  const { getMe } = useApi();

  const [me, setMe] = useState<User>();

  useEffect(() => {
    getMe({
      onSuccess: setMe
    });
  }, [getMe]);

  const [searchAvailable, setSearchAvailable] = useState(false);

  useEffect(() => {
    get('/search/ping', undefined, {
      onSuccess: () => {
        setSearchAvailable(true);
      },
      handleErrors: false
    });
  }, [get]);

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
        title='Feedback'
        href='/feedback'
        description={<>
          <p className='text-gray-500'>
            Have feedback? We would love to hear it!
          </p>
        </>}
      />

      <ProductCard
        title='Semantic Search'
        href='/search'
        disabled={!searchAvailable}
        hoverText={!searchAvailable ? 'Search is currently disabled. If you think this is a mistake, please contact your administrator.' : undefined}
        description={<>
          <p className='text-gray-500'>
            Search for content in any document using natural language.
          </p>
        </>}
      />

      {me?.IsAdmin && (
        <ProductCard
          title='Statistics'
          href='/statistics'
          description={(
            <p className='text-gray-500'>
              Admin Only. View statistics on usage.
            </p>
          )}
        />
      )}

      {me?.IsAdmin && (
        <ProductCard
          title='User Management'
          href='/user-management'
          description={(
            <p className='text-gray-500'>
              Admin Only. Manage users.
            </p>
          )}
        />
      )}
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