import { Card, H6, Button, Drawer, Classes, Callout, FormGroup, Checkbox } from '@blueprintjs/core';
import { useState } from 'react';
import { RemovableItem } from './RemovableItem';

interface SubjectAim {
  name: string;
  aims: string[];
}

const aims: SubjectAim[] = [{
  name: 'Individuals and Societies',
  aims: [
    'Explore and critically engage with multiple perspectives and ways of thinking',
    'Investigate and evaluate the interactions between individuals and societies',
    'Think and act as informed and principled individuals in societies',
    'Understand and value the variety and diversity of the human experience across time and place',
  ]
}, {
  name: 'Business Management',
  aims: [
    'Develop as confident, creative and compassionate business leaders, entrepreneurs, social entrepreneurs and as change agents',
    'Foster an informed understanding of ethical and sustainable business practices',
    'Explore the connections between individuals, businesses and society',
    'Engage with decision-making as a process and a skill',
  ]
}];

export const SubjectAimsCard = ({ selectedAims, setSelectedAims }: {
  selectedAims: string[];
  setSelectedAims: (selectedAims: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div className='flex flex-row items-center justify-between'>
        <div>
          <H6 className='m-0'>Subject Aims</H6>
          <p className='text-sm text-gray-400'>Select the subject aims you wish to emphasize in this unit.</p>
        </div>

        <Button icon='add' onClick={() => setOpen(true)} />
      </div>

      {selectedAims.length > 0 && (
        <div className='pt-3'>
          <ul className='text-sm list-inside list-disc'>
            {selectedAims.map(aim => (
              <RemovableItem key={aim} onRemove={() => setSelectedAims(selectedAims.filter(a => a !== aim))}>
                {aim}
              </RemovableItem>
            ))}
          </ul>
        </div>
      )}

      <Drawer
        isOpen={open}
        className={`${Classes.DARK} max-w-lg`}
        onClose={() => setOpen(false)}
        title='Select Subject Aims'
      >
        <div className={Classes.DRAWER_BODY}>
          <Callout intent='primary'>
            Your aims are saved automatically
          </Callout>

          <div className='p-4'>
            {aims.map(aim => (
              <FormGroup key={aim.name} label={aim.name}>
                {aim.aims.map(subAim => (
                  <Checkbox
                    key={subAim}
                    label={subAim}
                    checked={selectedAims.includes(subAim)}
                    onClick={() => {
                      if (selectedAims.includes(subAim)) {
                        setSelectedAims(selectedAims.filter(a => a !== subAim));
                      } else {
                        setSelectedAims([...selectedAims, subAim]);
                      }
                    }}
                  />
                ))}
              </FormGroup>
            ))}
          </div>
        </div>
      </Drawer>
    </Card>
  );
};
