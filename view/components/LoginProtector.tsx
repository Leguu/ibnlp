import { useApi } from '@/api/api';
import { useRequests } from '@/utils/http';
import wait from '@/utils/wait';
import { Button, Classes, Dialog, DialogBody, Divider, FormGroup, InputGroup, Spinner } from "@blueprintjs/core";
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from "react";
import { GoogleLoginButton } from 'react-social-login-buttons';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function LoginProtector({ children, requireAdmin }: Props) {
  const router = useRouter();

  const { getMe } = useApi();

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    getMe({
      handleErrors: false,
      onSuccess: me => {
        if (requireAdmin && !me.IsAdmin) {
          router.push('/portal');
          return;
        }

        setIsAuthenticated(true);
      }
    });
  }, [getMe, requireAdmin, router]);

  const loginDialog = <>
    <DialogBody className="pb-0 w-screen sm:h-full max-w-xl">
      <p>You are not authenticated, please log in.</p>

      <div className='pt-4 space-y-3 pb-4'>
        <GoogleLoginButton onClick={() => router.push('/api/oauth/google/login')} />
      </div>
    </DialogBody>
  </>;

  return <>
    <Dialog
      title='Authentication'
      isCloseButtonShown={false}
      className={Classes.DARK}
      usePortal
      isOpen={!isAuthenticated}
    >
      {loginDialog}
    </Dialog>

    {isAuthenticated && children}
  </>;
}