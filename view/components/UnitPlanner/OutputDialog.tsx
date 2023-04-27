import { AppToaster } from '@/utils/toaster';
import { Button, Classes, Dialog, DialogBody, DialogProps } from '@blueprintjs/core';

interface Props extends DialogProps {
  loading?: boolean;
  children?: string;
}

const OutputDialog = ({ loading, children, ...props }: Props) => {
  return (
    <Dialog
      canOutsideClickClose={!loading}
      canEscapeKeyClose={!loading}
      className={Classes.DARK + ' max-w-4xl xs:w-full [&.bp4-dialog]:w-full'}
      portalClassName='w-full'
      {...props}
    >
      <div className={`${Classes.DIALOG_HEADER}`}>
        Output

        <div className='flex-grow' />

        <Button icon='clipboard' onClick={() => {
          navigator.clipboard.writeText(children as string);
          AppToaster?.show({ message: 'Copied to clipboard', intent: 'success' });
        }}>
          Copy
        </Button>

        {!loading && (
          <Button icon='cross' className='ml-2' onClick={e => props.onClose?.(e)} />
        )}
      </div>
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