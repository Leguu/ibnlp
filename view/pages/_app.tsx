import '@/styles/globals.scss';
import { Classes, Colors } from '@blueprintjs/core';
import { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { ReactElement, ReactNode } from 'react';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout || ((page: ReactNode) => page);

  return (
    <div className={`${Classes.DARK} h-full`}>
      {getLayout((
        <Component {...pageProps} />
      ))}

      <div className='absolute bottom-2 right-2 md:bottom-4 md:right-10 text-gray-400 select-none z-50'>
        Pre-Alpha Build
      </div>
    </div>
  );
}
