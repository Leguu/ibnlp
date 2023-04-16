import ApplicationNavbar, { ApplicationNavbarProps } from '@/components/ApplicationNavbar';

interface Props extends ApplicationNavbarProps {
  children: React.ReactNode;
}

export default function ApplicationLayout({ children, ...navbarProps }: Props) {
  return (
    <>
      <ApplicationNavbar {...navbarProps} />

      {children}
    </>
  );
}