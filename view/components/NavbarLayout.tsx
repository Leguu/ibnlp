import { Navbar, Icon, Button, Divider } from "@blueprintjs/core";
import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}
export default function NavbarLayout({ children }: Props) {
  const navBar = (
    <Navbar className='sticky h-12 max-w-7xl mt-2 
        flex flex-row items-center
        ml-auto mr-auto select-none'>
      <Icon icon='search-around' />

      <h6 className='ml-3 font-semibold'>Semantic Inquiry</h6>

      <div className='flex-grow' />

      <Link href='/about'>
        <Button minimal>
          Who We Are
        </Button>
      </Link>

      <Divider className='h-6' />

      <Link href='/search'>
        <Button minimal rightIcon='log-in'>
          Access
        </Button>
      </Link>
    </Navbar>
  );

  return <>
    {navBar}

    {children}
  </>;
}