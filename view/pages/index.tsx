import LandingNavbar from '@/components/LandingNavbar';
import { Callout, Divider } from '@blueprintjs/core';
import React from 'react';

export default function Start() {
  return <>
    <div className='pb-20'>
      <div className='h-screen rotating-dots'>
        <LandingNavbar />

        <div className='h-full flex flex-col items-center justify-center'>
          <h1 className='text-4xl font-bold font-serif bg-yellow-400 text-slate-800 px-4 py-1'>Search.</h1>

          <div className='pt-3 text-xl md:text-3xl lg:flex lg:space-x-3 font-sans font-light mb-12'>
            <h2 className='-skew-x-12'>Exactly what you mean.</h2>
            <h2 className='-skew-x-12'>Exactly how you meant it.</h2>
          </div>

          <Callout className='max-w-md'>
            Modern AI tools are not designed to be able to search customised data.
            They don&apos;t know what you mean, and they don&apos;t know how to find what you want.
            Semantic Inquiry is a search engine that is designed to understand the meaning of your search query,
            and to parse large amounts of data to find the most relevant results.
          </Callout>
        </div>
      </div>

      <Divider className='mb-10' />

      <div className='mx-auto max-w-7xl'>
        Insert some additional information about the project...
      </div>
    </div>
  </>;
}