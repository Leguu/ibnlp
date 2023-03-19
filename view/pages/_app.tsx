import '@/styles/globals.css';
import { Classes, Colors, PortalProvider } from '@blueprintjs/core';
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
    <div className={`${Classes.DARK} h-full`} style={{ background: Colors.DARK_GRAY1 }}>
      <PortalProvider>
        {getLayout((
          <Component {...pageProps} />
        ))}
      </PortalProvider>
    </div>
  );
}
