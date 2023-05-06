import ApplicationLayout from '@/layouts/ApplicationLayout';
import { Button, Callout, FormGroup, H3, InputGroup, Spinner, TextArea } from '@blueprintjs/core';
import { ReactNode, useEffect, useState } from 'react';
import { useApi } from '@/api/api';
import { User, UserChatRequest, UserFeedback } from '@/api/types/model';
import dayjs from 'dayjs';
import { Page } from './_app';
import { AppToaster } from '@/utils/toaster';


const FeedbackPage: Page = () => {
  const { getMe, addFeedback, getFeedback, getUsers, deleteFeedback } = useApi();

  const [feedback, setFeedback] = useState('');

  const [allFeedback, setAllFeedback] = useState<UserFeedback[]>([]);

  const [me, setMe] = useState<User>();
  useEffect(() => {
    getMe({
      onSuccess: setMe
    });
  }, [getMe]);

  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    getUsers({
      onSuccess: setUsers,
    });
  }, [getUsers]);

  useEffect(() => {
    if (!me?.IsAdmin) return;

    getFeedback({
      onSuccess: setAllFeedback,
    });
  }, [getFeedback, me?.IsAdmin]);

  const onSend = () => {
    setFeedback('');
    addFeedback({ feedback }, {
      onSuccess: () => {
        AppToaster?.show({
          message: 'Feedback sent',
          intent: 'success',
        });
      },
    });
  };

  const onRemove = (id: number) => {
    deleteFeedback(id, {
      onSuccess: () => {
        AppToaster?.show({
          message: 'Feedback removed',
          intent: 'success',
        });
      },
    });
  };

  return (
    <div className='max-w-3xl mx-auto flex flex-wrap p-2 justify-center space-y-4'>
      <Callout className='flex flex-col space-y-4'>
        <p>
          Do you have feedback? Please let us know!
        </p>

        <TextArea
          value={feedback}
          placeholder='Feedback'
          onChange={e => setFeedback(e.target.value)}
        />

        <div className='flex justify-end'>
          <Button onClick={onSend}>
            Send
          </Button>
        </div>
      </Callout>

      {me?.IsAdmin && (
        <Callout>
          <H3>
            All feedback (Admin)
          </H3>

          <div className='space-y-4 pt-4'>
            {allFeedback.map(f => {
              const user = users.find(u => u.id === f.UserId);
              return (
                <div key={f.ID} className='flex flex-row justify-between'>
                  <div>
                    <p>
                      {f.Feedback}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {`${dayjs(f.CreatedAt).format('DD/MM/YYYY HH:mm')} by ${user?.Name} <${user?.Email}>`}
                    </p>
                  </div>

                  <Button icon='remove' onClick={() => onRemove(f.ID)} />
                </div>
              );
            })}

            {allFeedback.length === 0 && (
              <p>
                No feedback yet
              </p>
            )}
          </div>
        </Callout>
      )}
    </div>
  );
};

FeedbackPage.authenticated = true;
FeedbackPage.getLayout = (page: ReactNode) => {
  return (
    <ApplicationLayout pageName='Feedback'>
      {page}
    </ApplicationLayout>
  );
};

export default FeedbackPage;