import { useApi } from '@/api/api';
import { useRequests } from '@/utils/http';
import { AppToaster } from '@/utils/toaster';
import { Icon, Button, Divider, Navbar as BPNavbar, OverflowList } from "@blueprintjs/core";
import { log } from 'console';
import Link from "next/link";
import { useRouter } from 'next/router';
import React from "react";

export interface ApplicationNavbarProps {
  pageName?: string;
}

export default function ApplicationNavbar({ pageName }: ApplicationNavbarProps) {
  const router = useRouter();

  const { logout } = useApi();

  const onLogout = () => {
    logout({
      onSuccess: () => {
        router.push('/');
        AppToaster?.show({
          message: 'Logged out successfully',
          intent: 'success',
          icon: 'tick'
        });
      }
    });
  };

  return (
    <BPNavbar className='sticky top-0 xl:top-2 left-0 right-0 h-12 max-w-7xl mb-4
        flex flex-row items-center
        ml-auto mr-auto select-none'
      style={{ height: ApplicationNavbar.height }}>

      <Link href='/portal' style={{ color: 'inherit' }} className='flex focus:outline-none'>
        <Icon icon='search-around' />
      </Link>

      <Link href='/portal' style={{ color: 'inherit' }} className='focus:outline-none'>
        <h6 className='ml-3 font-semibold decoration-0 text-inherit hidden md:block'>
          Semantic Inquiry
        </h6>
      </Link>

      {pageName && <>
        <Divider className='mx-3 h-6' />

        <h6 className='font-semibold decoration-0 text-inherit'>{pageName}</h6>
      </>}

      <div className='flex-grow' />

      {router.pathname !== '/portal' && <>
        <Link href='/portal' className="hidden md:block">
          <Button minimal>Portal</Button>
        </Link>
        <Divider className='h-6 mx-3 mr-5 hidden md:block' />
      </>}

      <Button icon='log-out' onClick={onLogout}>
        Logout
      </Button>
    </BPNavbar>
  );
}

ApplicationNavbar.height = 48;