import { Icon, Button, Divider, Navbar as BPNavbar, OverflowList } from "@blueprintjs/core";
import Link from "next/link";
import React from "react";

export interface ApplicationNavbarProps {
  pageName?: string;
}

export default function ApplicationNavbar({ pageName }: ApplicationNavbarProps) {
  return (
    <BPNavbar className='sticky top-0 xl:top-2 left-0 right-0 h-12 max-w-7xl mb-4
        flex flex-row items-center
        ml-auto mr-auto select-none'
      style={{ height: ApplicationNavbar.height }}>

      <Icon icon='search-around' />

      <Link href='/portal' style={{ color: 'inherit' }} className='focus:outline-none'>
        <h6 className='ml-3 font-semibold decoration-0 text-inherit'>Semantic Inquiry</h6>
      </Link>

      {pageName && <>
        <Divider className='mx-3 h-6' />

        <h6 className='font-semibold decoration-0 text-inherit'>{pageName}</h6>
      </>}

      <div className='flex-grow' />

      <Link href='/teacher' className="hidden md:block">
        <Button minimal>Teacher Portal</Button>
      </Link>

      <Link href='/search' className="hidden md:block">
        <Button minimal>Search</Button>
      </Link>
    </BPNavbar>
  );
}

ApplicationNavbar.height = 48;