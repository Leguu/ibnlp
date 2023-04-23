import { Card, H6, Button, Drawer, Classes, Callout, FormGroup, Checkbox } from '@blueprintjs/core';
import { useState } from 'react';
import { RemovableItem } from './RemovableItem';

const concepts: string[] = [
  'Creativity',
  'Change',
  'Ethics',
  'Sustainability'
];

const KeyConceptsCard = ({ selectedConcepts, setSelectedConcepts }: {
  selectedConcepts: string[];
  setSelectedConcepts: (selectedAims: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div className='flex flex-row items-center justify-between'>
        <div>
          <H6 className='m-0'>Key Concepts</H6>
          <p className='text-sm text-gray-400'>Select the key concepts you wish to target in this unit.</p>
        </div>

        <Button icon='add' onClick={() => setOpen(true)} />
      </div>

      {selectedConcepts.length > 0 && (
        <div className='pt-3'>
          <ul className='list-inside list-disc'>
            {selectedConcepts.map(concept => (
              <RemovableItem key={concept} onRemove={() => setSelectedConcepts(selectedConcepts.filter(a => a !== concept))}>
                {concept}
              </RemovableItem>
            ))}
          </ul>
        </div>
      )}

      <Drawer
        isOpen={open}
        className={`${Classes.DARK} max-w-lg`}
        onClose={() => setOpen(false)}
        title='Select Key Concepts'
      >
        <div className={Classes.DRAWER_BODY}>
          <Callout intent='primary'>
            Your options are saved automatically
          </Callout>

          <div className='p-6 space-y-4'>
            {concepts.map(concept => (
              <Checkbox
                key={concept}
                label={concept}
                checked={selectedConcepts.includes(concept)}
                onClick={() => {
                  if (selectedConcepts.includes(concept)) {
                    setSelectedConcepts(selectedConcepts.filter(a => a !== concept));
                  } else {
                    setSelectedConcepts([...selectedConcepts, concept]);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </Drawer>
    </Card>
  );
};

export default KeyConceptsCard;