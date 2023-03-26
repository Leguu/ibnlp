import { useRequests } from '@/utils/http';
import { AppToaster } from '@/utils/toaster';
import { Button, Classes, Dialog, DialogBody, FormGroup, InputGroup } from '@blueprintjs/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();

  const { post } = useRequests();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState(false);

  const submit = async () => {
    setLoading(true);
    setTimeout(() => {
      post('/register', { username, password, authCode: accessCode }, {
        onSuccess: () => {
          setLoading(false);
          AppToaster?.show({
            message: 'Successfully registered! Please log in.',
            icon: 'tick-circle',
            intent: 'success'
          });
          router.push('/search');
        }
      })
        .finally(() => {
          setLoading(false);
        });
    }, 1000
    );
  };

  return (
    <Dialog
      title='Registration'
      isCloseButtonShown={false}
      isOpen={true}
      className={Classes.DARK}
    >
      <DialogBody className='max-w-2xl'>
        <p>
          {'Use the access code given to you by your administrator to register. Since we\'re in pre-alpha, your account may be removed during development. '}
        </p>

        <div className='pt-4 space-y-3 pb-4'>
          <FormGroup
            inline
            label='Access Code'
            intent={failure ? 'danger' : 'none'}
            className="flex-grow pl-1"
          >
            <InputGroup
              placeholder="Access Code"
              disabled={loading}
              value={accessCode}
              intent={failure ? 'danger' : 'none'}
              onChange={e => setAccessCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </FormGroup>

          <FormGroup
            intent={failure ? 'danger' : 'none'}
            className="flex-grow pl-1"
          >
            <InputGroup
              placeholder="Username"
              disabled={loading}
              value={username}
              intent={failure ? 'danger' : 'none'}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </FormGroup>

          <FormGroup
            intent={failure ? 'danger' : 'none'}
            helperText={failure && ""}
            className="flex-grow pl-1"
          >
            <InputGroup
              placeholder="Password"
              disabled={loading}
              value={password}
              intent={failure ? 'danger' : 'none'}
              type='password'
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </FormGroup>

          <div className='w-full flex flex-row justify-end align-middle'>
            <Link href='/search'>
              Already have an account? Go back.
            </Link>
            <Button
              onClick={submit}
              loading={loading}
              disabled={accessCode === '' || username === '' || password === ''}
              className='mx-2 h-0'
              rightIcon="arrow-right"
            >
              Register
            </Button>
          </div>
        </div>
      </DialogBody>
    </Dialog>
  );
}