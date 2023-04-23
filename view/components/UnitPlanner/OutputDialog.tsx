import { Classes, Dialog, DialogBody, DialogProps } from '@blueprintjs/core';
import { ReactNode } from 'react';

interface Props extends DialogProps {
  loading?: boolean;
  children?: ReactNode;
}

const OutputDialog = ({ loading, children, ...props }: Props) => {
  return (
    <Dialog
      title='Output'
      canOutsideClickClose={!loading}
      canEscapeKeyClose={!loading}
      isCloseButtonShown={!loading}
      className={Classes.DARK + ' max-w-4xl xs:w-full [&.bp4-dialog]:w-full'}
      portalClassName='w-full'
      {...props}
    >
      <DialogBody className='whitespace-pre-line'>
        {children}
        {loading && (
          <div className='inline-flex ml-1 h-3 w-2 bg-white blinking' />
        )}
      </DialogBody>
    </Dialog>
  );
};

export default OutputDialog;