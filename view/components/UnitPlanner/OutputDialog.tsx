import { AppToaster } from '@/utils/toaster';
import { Button, Classes, Dialog, DialogBody, DialogProps } from '@blueprintjs/core';
import ChatBox from '../ChatBox/ChatBox';

interface Props extends DialogProps {
  controller?: AbortController;
  loading?: boolean;
  children?: string;
}

const OutputDialog = ({ loading, children, controller, ...props }: Props) => {
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

        {!loading && <>
          <Button icon='cross' className='ml-2' onClick={e => props.onClose?.(e)} />
        </>}

        {(loading && controller) && (
          <Button icon='cross' className='ml-2' onClick={() => controller.abort()} />
        )}
      </div>

      <DialogBody>
        <ChatBox initialResponse={children} loading={loading} />
      </DialogBody>
    </Dialog>
  );
};

export default OutputDialog;