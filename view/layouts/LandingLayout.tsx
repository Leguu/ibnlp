import LandingNavbar from '@/components/LandingNavbar';
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}
export default function LandingLayout({ children }: Props) {
  return <>
    <LandingNavbar />

    {children}
  </>;
}