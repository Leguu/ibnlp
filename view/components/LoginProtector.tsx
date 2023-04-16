import { useRequests } from '@/utils/http';
import wait from '@/utils/wait';
import { Button, Classes, Dialog, DialogBody, Divider, FormGroup, InputGroup, Spinner } from "@blueprintjs/core";
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from "react";
import { GoogleLoginButton } from 'react-social-login-buttons';

interface Props {
  children: React.ReactNode;
}

export default function LoginProtector({ children }: Props) {
  const router = useRouter();
  const { post, get } = useRequests();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failure, setFailure] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const onError = () => {
    setFailure(true);
    setIsAuthenticated(false);
    setLoggingIn(false);
  };

  useEffect(() => {
    get('/login', {
      handleErrors: false,
      onSuccess: () => setIsAuthenticated(true),
    }).finally(() => setLoading(false));
  }, [get]);

  const submit = async () => {
    setLoggingIn(true);

    await wait(1000);

    post('/login', { username, password }, {
      onSuccess: () => {
        setLoggingIn(false);
        setIsAuthenticated(true);
      },
      onError: onError
    });
  };

  const loginDialog = <>
    <DialogBody className="pb-0 w-screen sm:h-full max-w-xl">
      <p>You are not authenticated. Please input your username and password.</p>

      <div className='pt-4 space-y-3 pb-4'>
        <GoogleLoginButton onClick={() => router.push('/api/oauth/google/login')} />

        <div className='flex flex-row items-center'>
          <Divider className='flex-grow' />
          Or
          <Divider className='flex-grow' />
        </div>

        <div className='flex flex-row space-x-4'>
          <FormGroup intent={failure ? 'danger' : 'none'} inline className='flex-grow block'>
            <InputGroup
              placeholder="Username"
              disabled={loggingIn}
              value={username}
              intent={failure ? 'danger' : 'none'}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </FormGroup>

          <FormGroup intent={failure ? 'danger' : 'none'} helperText={failure && ""} inline className='flex-grow block'>
            <InputGroup
              placeholder="Password"
              disabled={loggingIn}
              value={password}
              intent={failure ? 'danger' : 'none'}
              type='password'
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </FormGroup>
        </div>

        <div className='w-full flex flex-row justify-end align-middle'>
          <Link href='/register'>
            {"Have an access code? Register."}
          </Link>

          <Button
            onClick={submit}
            loading={loggingIn}
            disabled={username === '' || password === ''}
            className='mx-2 h-0'
            rightIcon="log-in"
          >
            Enter
          </Button>
        </div>
      </div>
    </DialogBody>
  </>;

  return <>
    <Dialog
      title='Authentication'
      isCloseButtonShown={false}
      className={Classes.DARK}
      usePortal
      isOpen={!loading && !isAuthenticated}
    >
      {loginDialog}
    </Dialog>

    {isAuthenticated && children}
  </>;
}