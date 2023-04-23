import { Button, Checkbox, Classes, Drawer } from '@blueprintjs/core';
import { useState } from 'react';
import OutputDialog from '../OutputDialog';
import { useRequests } from '@/utils/http';

interface Props {
  syllabusContent: string[];
}

const approachesToLearning = [
  'Thinking',
  'Communicating',
  'Self-Management',
  'Social',
  'Research',
];

const ATLGenerator = ({ syllabusContent }: Props) => {
  const { stream } = useRequests();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isOutputDialogOpen, setIsOutputDialogOpen] = useState(false);
  const [outputLoading, setOutputLoading] = useState(false);
  const [output, setOutput] = useState('');

  const [selectedATLs, setSelectedATLs] = useState<string[]>([]);

  const onGenerate = async () => {
    setIsDrawerOpen(false);
    setIsOutputDialogOpen(true);
    setOutputLoading(true);
    setOutput('');

    let prompt = `you are IB Business management teacher planning the development of ATL skills when studying "${syllabusContent.join(', ')}". 
    Suggest how "${selectedATLs.join(', ')}" can be taught (through learning activities) and assessed with rubric (generate it with three levels).`;

    const output = stream('/chat', { query: prompt, history: [] });

    for await (const data of output) {
      setOutput(d => d + data);
    }

    setOutputLoading(false);
  };

  return <>
    <Button
      className='w-full'
      intent='primary'
      onClick={() => setIsDrawerOpen(true)}
      rightIcon='chevron-right'
    >
      ATL Skills
    </Button>

    <OutputDialog
      isOpen={isOutputDialogOpen}
      onClose={() => setIsOutputDialogOpen(false)}
      loading={outputLoading}
    >
      {output}
    </OutputDialog>

    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      className={`${Classes.DARK} max-w-md`}
      title='ATL Skills'
    >
      <div className='p-4 w-full'>
        Select the ATL skills you wish to emphasize with this unit.

        <div className='mt-4'>
          {approachesToLearning.map(atl => (
            <Checkbox
              key={atl}
              label={atl}
              checked={selectedATLs.includes(atl)}
              onClick={() => {
                if (selectedATLs.includes(atl)) {
                  setSelectedATLs(selectedATLs.filter(a => a !== atl));
                } else {
                  setSelectedATLs([...selectedATLs, atl]);
                }
              }}
            />
          ))}
        </div>

        <div className='flex justify-end'>
          <Button
            intent='primary'
            onClick={onGenerate}
          >
            Generate
          </Button>
        </div>
      </div>
    </Drawer>
  </>;
};

export default ATLGenerator;