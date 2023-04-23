
import { Button, Classes, Drawer, InputGroup, Radio, RadioGroup, TreeNode, TreeNodeInfo } from '@blueprintjs/core';
import { useEffect, useState } from 'react';
import SyllabusTree, { filterSelectedNodesTree, hasSelectedNodes } from '../SyllabusTree';
import { cloneDeep } from 'lodash';
import { useRequests } from '@/utils/http';
import { getTreeIds } from '@/pages/unit-planner';
import { SyllabusContent } from '../FormCards/SyllabusContentCard';
import { notNullOrUndefined } from '@/utils/notNullOrUndefined';
import OutputDialog from '../OutputDialog';
import { Tooltip2 } from '@blueprintjs/popover2';

interface Props {
  syllabusContent: string[];
}

const availableResources = [
  'Teacher notes',
  'Student notes',
  'Fill-in-the-gap activity',
  'Multiple Choice Questions',
  'True or False Questions',
  'Real-life examples',
  'Short business cases for student discussion',
  'List of discussion prompts',
  'Other'
];

const LearningResourcesGenerator = ({ syllabusContent }: Props) => {
  const { stream } = useRequests();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isOutputLoading, setIsOutputLoading] = useState(false);
  const [isOutputDialogOpen, setIsOutputDialogOpen] = useState(false);
  const [output, setOutput] = useState('');

  const [selectedResource, setSelectedResource] = useState<string>();
  const [customResource, setCustomResource] = useState('');

  const resourceToCreate = selectedResource === 'Other' ? customResource : selectedResource;

  useEffect(() => {
    setSelectedResource(undefined);
    setCustomResource('');
  }, [isDrawerOpen]);

  const onGenerate = async () => {
    const query = `Create a ${resourceToCreate} for the topic "${syllabusContent.join(', ')}".`;

    const response = stream('/chat', { query, history: [] });

    setIsDrawerOpen(false);
    setIsOutputDialogOpen(true);
    setIsOutputLoading(true);
    setOutput('');

    for await (const output of response) {
      setOutput(o => o + output);
    }

    setIsOutputLoading(false);
  };

  return <>
    <Button
      intent='primary'
      rightIcon='chevron-right'
      onClick={() => setIsDrawerOpen(true)}
      className='w-full'
    >
      Resources
    </Button>

    <OutputDialog
      isOpen={isOutputDialogOpen}
      onClose={() => setIsOutputDialogOpen(false)}
      loading={isOutputLoading}
    >
      {output}
    </OutputDialog>

    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      className={`${Classes.DARK} max-w-lg`}
      title='Learning activities and resources'
    >
      <div className='p-4'>
        <RadioGroup
          label='Please select a type of resource to create'
          selectedValue={selectedResource}
          onChange={e => setSelectedResource(e.currentTarget.value)}
        >
          {availableResources.map(resource => (
            <Radio label={resource} key={resource} value={resource} />
          ))}
        </RadioGroup>

        {selectedResource === 'Other' && (
          <InputGroup
            placeholder='Please specify'
            value={customResource}
            onChange={e => setCustomResource(e.currentTarget.value)}
          />
        )}


        <div className='flex justify-end p-2'>
          <Button intent='primary' onClick={onGenerate} disabled={!resourceToCreate}>
            Generate
          </Button>
        </div>
      </div>
    </Drawer>

  </>;
};

export default LearningResourcesGenerator;