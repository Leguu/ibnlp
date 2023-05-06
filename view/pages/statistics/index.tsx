import ApplicationLayout from '@/layouts/ApplicationLayout';
import { Callout, Card, Classes, FormGroup, H5, InputGroup, Spinner } from '@blueprintjs/core';
import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Page } from '../_app';
import { useRequests } from '@/utils/http';
import { Popover2, Tooltip2 } from '@blueprintjs/popover2';
import { useApi } from '@/api/api';
import { User, UserChatRequest } from '@/api/types/model';
import { useRouter } from 'next/router';
import { AppToaster } from '@/utils/toaster';
import dayjs from 'dayjs';


const StatisticsPage: Page = () => {
  const { getStats, getUsers } = useApi();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserChatRequest[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getUsers({
      onSuccess: setUsers
    });
  }, [getUsers]);

  useEffect(() => {
    var fromDay = dayjs(from);
    var toDay = dayjs(to);
    if (!fromDay.isValid() || !toDay.isValid()) return;

    setLoading(true);
    getStats({ From: fromDay.toISOString(), To: toDay.endOf('day').toISOString() }, {
      onSuccess: stats => {
        setStats(stats);
        setLoading(false);
      },
    });
  }, [from, getStats, to]);

  const userStatCount = stats.reduce((acc, curr) => {
    if (!acc[curr.UserId]) acc[curr.UserId] = 0;
    acc[curr.UserId]++;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className='max-w-3xl mx-auto flex flex-wrap p-2 justify-center space-y-4'>
      <Callout>
        <FormGroup label='From'>
          <InputGroup type='date' value={from} onChange={e => setFrom(e.target.value)} max={to} />
        </FormGroup>

        <FormGroup label='To'>
          <InputGroup type='date' value={to} onChange={e => setTo(e.target.value)} min={from} />
        </FormGroup>
      </Callout>

      {loading && (
        <Callout>
          <Spinner />
        </Callout>
      )}

      {!loading && stats.length > 0 && (
        <Callout>
          {Object.entries(userStatCount).map(([userId, count]) => {
            const user = users.find(u => u.id === userId);

            return (
              <div key={userId} className='flex items-center'>
                {`User "${user?.Name}" <${user?.Email}> made ${count} requests`}
              </div>
            );
          })}
        </Callout>
      )}
    </div>
  );
};

StatisticsPage.authenticated = true;
StatisticsPage.requireAdmin = true;
StatisticsPage.getLayout = (page: ReactNode) => {
  return (
    <ApplicationLayout pageName='Statistics'>
      {page}
    </ApplicationLayout>
  );
};

export default StatisticsPage;