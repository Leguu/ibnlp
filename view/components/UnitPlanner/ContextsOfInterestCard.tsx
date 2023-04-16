import { Card, Button, FormGroup, InputGroup } from '@blueprintjs/core';
import { useState } from 'react';
import { RemovableItem } from './RemovableItem';

export const ContextsOfInterestCard = ({ contexts, setContexts }: {
  contexts: string[];
  setContexts: (selectedAims: string[]) => void;
}) => {
  const [inputValue, setInputValue] = useState('');

  const error = contexts.includes(inputValue);
  const disabled = error || inputValue === '';

  return (
    <Card>
      <FormGroup
        label='Contexts of Interest'
        helperText={error ? 'This context has already been added' : 'Add in a name of specific organisation, MNC, industry of interest or country.'}
        intent={error ? 'danger' : 'none'}
      >
        <div className='flex flex-row items-center justify-between' >
          <InputGroup
            className='flex-grow mr-2'
            value={inputValue}
            intent={error ? 'danger' : 'none'}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !disabled) {
                setContexts([...contexts, inputValue]);
                setInputValue('');
              }
            }}
          />
          <Button icon='add' intent={error ? 'danger' : 'none'} disabled={disabled} onClick={() => {
            setContexts([...contexts, inputValue]);
            setInputValue('');
          }} />
        </div>
      </FormGroup>

      {contexts.length > 0 && (
        <ul>
          {contexts.map(concept => (
            <RemovableItem key={concept} onRemove={() => setContexts(contexts.filter(c => c !== concept))}>
              <p>{concept}</p>
            </RemovableItem>
          ))}
        </ul>
      )}
    </Card>
  );
};
