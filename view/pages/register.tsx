import { useRequests } from '@/utils/http';
import { AppToaster } from '@/utils/toaster';
import { Button, Classes, Dialog, DialogBody, FormGroup, InputGroup } from '@blueprintjs/core';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';
import { GoogleLoginButton } from 'react-social-login-buttons';

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
      post('/register', { username, password }, {
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

  useEffect(() => {
    post('/register/access', {}, {
      handleErrors: false,
      onSuccess: () => {
        setCurrentStep(1);
      }
    });
  }, [post]);

  const verifyAccessCode = async () => {
    setLoading(true);
    post('/register/access', { auth_code: accessCode }, {
      onSuccess: () => {
        setCurrentStep(1);
      },
    }).then(() => setLoading(false));
  };

  const [currentStep, setCurrentStep] = useState(0);

  const steps: ReactNode[] = [<>
    <p>
      {'Use the access code given to you by your administrator to register.'}
    </p>

    <div className='flex flex-row items-center'>
      <FormGroup
        inline
        label='Access Code'
        intent={failure ? 'danger' : 'none'}
        className="flex-grow mb-0"
      >
        <InputGroup
          placeholder="Access Code"
          disabled={loading}
          value={accessCode}
          intent={failure ? 'danger' : 'none'}
          onChange={e => setAccessCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && verifyAccessCode()}
        />
      </FormGroup>

      <Button loading={loading} onClick={verifyAccessCode}>
        Verify
      </Button>
    </div>
  </>, <>
    <div className='max-w-xs space-y-5'>
      <GoogleLoginButton onClick={() => router.push('/api/oauth/google/login')} />

      <div className='px-1'>
        <Button onClick={() => setCurrentStep(2)} className='w-full' alignText='left'>
          Standard Registration
        </Button>
      </div>
    </div>
  </>, <>
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
      <Button disabled={loading} onClick={() => setCurrentStep(1)}>
        Back
      </Button>
      <Button
        onClick={submit}
        loading={loading}
        disabled={username === '' || password === ''}
        className='mx-2 h-0'
        rightIcon="arrow-right"
      >
        Register
      </Button>
    </div>
  </>];

  return (
    <Dialog
      title='Registration'
      isCloseButtonShown={false}
      isOpen={true}
      className={Classes.DARK + ' max-w-xl [&.bp4-dialog]:w-full'}
    >
      <DialogBody className='max-w-2xl'>
        <div className='pt-2 space-y-3 pb-2'>
          {steps[currentStep]}
        </div>
      </DialogBody>
    </Dialog>
  );
}