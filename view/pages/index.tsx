import LandingNavbar from '@/components/LandingNavbar';
import { Callout, Divider } from '@blueprintjs/core';
import React from 'react';

export default function Start() {
  return <>
    <div className='h-screen '>
      <div className='h-full rotating-dots'>
        <LandingNavbar />

        <div className='h-full flex flex-col items-center justify-center'>
          <h1 className='text-4xl font-bold font-serif bg-yellow-400 text-slate-800 px-4 py-1'>Semantic Inquiry</h1>

          <div className='pt-3 text-xl md:text-3xl lg:flex lg:space-x-3 font-sans font-light mb-12'>
            <h2 className='-skew-x-12'>An AI unit planner for IB teachers</h2>
          </div>
        </div>
      </div>
    </div>
  </>;
}