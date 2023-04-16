import ApplicationNavbar, { ApplicationNavbarProps } from '@/components/ApplicationNavbar';
import LoginProtector from '@/components/LoginProtector';

interface Props extends ApplicationNavbarProps {
  children: React.ReactNode;
}

export default function ApplicationLayout({ children, ...navbarProps }: Props) {
  return (
    <>
      <ApplicationNavbar {...navbarProps} />

      <div style={{
        height: `calc(100vh - ${ApplicationNavbar.height + 8 * 2}px)`,
      }}>
        {children}
      </div>
    </>
  );
}