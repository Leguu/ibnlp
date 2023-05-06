import ApplicationLayout from '@/layouts/ApplicationLayout';
import { Button, Callout, Card, Classes, FormGroup, H5, InputGroup, Spinner } from '@blueprintjs/core';
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
  const { getStats, getUsers, inviteUser, deleteUser } = useApi();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setLoading(true);
    getUsers({
      onSuccess: users => {
        setUsers(users);
        setLoading(false);
      }
    });
  }, [getUsers]);

  const [email, setEmail] = useState('');

  const onInvite = useCallback(() => {
    inviteUser({ email }, {
      onSuccess: () => {
        AppToaster?.show({
          message: 'User invited',
          intent: 'success',
        });
      },
    });
  }, [email, inviteUser]);

  const onRemove = useCallback((id: string) => {
    deleteUser(id, {
      onSuccess: () => {
        AppToaster?.show({
          message: 'User removed',
          intent: 'success',
        });
      },
    });
  }, [deleteUser]);

  return (
    <div className='max-w-3xl mx-auto flex flex-wrap p-2 justify-center space-y-4'>
      {loading && (
        <Callout>
          <Spinner />
        </Callout>
      )}

      {!loading && (
        <Callout>
          Users:

          {users.map(user => (
            <div key={user.id}>
              {`${user.Name} <${user.Email}>`}

              <Button onClick={() => onRemove(user.id)}>
                Remove
              </Button>
            </div>
          ))}

          <div className='flex flex-row space-x-2'>
            <InputGroup
              type='email'
              placeholder='Email'
              className='w-full'
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <Button onClick={onInvite}>
              Invite
            </Button>
          </div>
        </Callout>
      )}
    </div>
  );
};

StatisticsPage.authenticated = true;
StatisticsPage.requireAdmin = true;
StatisticsPage.getLayout = (page: ReactNode) => {
  return (
    <ApplicationLayout pageName='User Management'>
      {page}
    </ApplicationLayout>
  );
};

export default StatisticsPage;