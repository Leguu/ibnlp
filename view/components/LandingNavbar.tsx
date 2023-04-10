import { Icon, Button, Divider, Navbar as BPNavbar, OverflowList } from "@blueprintjs/core";
import Link from "next/link";
import React from "react";

export default function LandingNavbar() {
  return (
    <BPNavbar className='sticky h-12 max-w-7xl xl:mt-2 
        flex flex-row items-center
        ml-auto mr-auto select-none'>

      <Icon icon='search-around' />

      <Link href='/' style={{ color: 'inherit' }} className='focus:outline-none'>
        <h6 className='ml-3 font-semibold decoration-0 text-inherit'>Semantic Inquiry</h6>
      </Link>

      <div className='flex-grow' />

      <Link href='/about' className="hidden md:block">
        <Button minimal>About Us</Button>
      </Link>

      <Link href='/why-semantic' className="hidden md:block">
        <Button minimal>Why Semantic</Button>
      </Link>

      <Divider className='h-6' />

      <Link href='/portal'>
        <Button minimal rightIcon='log-in'>
          Access
        </Button>
      </Link>
    </BPNavbar>
  );
}