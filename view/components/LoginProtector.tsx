import { Button, Classes, Dialog, DialogBody, FormGroup, InputGroup, Spinner } from "@blueprintjs/core";
import React, { useEffect, useState } from "react";

const login = (password: string) =>
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

interface Props {
  children: React.ReactNode;
}

export default function LoginProtector({ children }: Props) {
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
    setLoading(true);
    setTimeout(() =>
      fetch('/api/login')
        .then(r => {
          setLoading(false);
          if (r.ok) setIsAuthenticated(true);
        })
      , 0);
  }, []);

  const submit = () => {
    setLoggingIn(true);
    setTimeout(() =>
      login(password)
        .then(r => {
          setLoggingIn(false);
          if (r.ok) setIsAuthenticated(true);
          else onError();
        }), 1000
    );
  };

  const body = <>
    <DialogBody className="pb-0 sm:h-full">
      <p>You are not authenticated. Please input the password given to you by your administrator.</p>

      <div className='flex flex-row mt-3'>
        <FormGroup
          intent={failure ? 'danger' : 'none'}
          helperText={failure && "Incorrect password."}
          className="flex-grow pl-1"
        >
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

        <Button
          onClick={submit}
          loading={loggingIn}
          disabled={password === ''}
          className='mx-2 h-0'
          rightIcon="log-in"
        >
          Enter
        </Button>
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
      {body}
    </Dialog>

    {isAuthenticated && children}
  </>;
}