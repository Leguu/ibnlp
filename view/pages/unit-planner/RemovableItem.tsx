import { Button } from '@blueprintjs/core';
import { ReactNode } from 'react';

export const RemovableItem = ({ children, onRemove }: {
  children: ReactNode;
  onRemove: () => void;
}) => {
  return (
    <div className='flex items-center'>
      <Button icon='minus' minimal onClick={onRemove} />
      <div className='ml-2'>
        {children}
      </div>
    </div>
  );
};