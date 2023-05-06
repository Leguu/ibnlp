
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
import { useApi } from '@/api/api';

interface Props {
  syllabusContent: string[];
  contextsOfInterest: string[];
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
] as const;

type AvailableResources = typeof availableResources[number];

const promptAddition: Partial<Record<AvailableResources, string>> = {
  'Teacher notes': 'Detailed and explained subject notes for teachers with ideas for possible classroom activities',
  'Student notes': 'Bullet-pointed student notes with definitions for key terms',
  'Fill-in-the-gap activity': '10 Fill in the gap sentences for key subject terms and add all answers at the very end ',
  'Multiple Choice Questions': '10 Multiple choice questions with feedback to students',
  'True or False Questions': 'True false exercise with 10 sentences with feedback to students',
  'Real-life examples': 'Three Real-life examples (50 words each)',
  'Short business cases for student discussion': 'Short business cases (100 words) for student discussion with 3 discussion prompts',
  'List of discussion prompts': 'List of 7 classroom discussion questions (order them from easy to difficult according to Bloom\'s taxonomy)'
};

const LearningResourcesGenerator = ({ syllabusContent, contextsOfInterest }: Props) => {
  const { streamChat } = useApi();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isOutputLoading, setIsOutputLoading] = useState(false);
  const [isOutputDialogOpen, setIsOutputDialogOpen] = useState(false);
  const [output, setOutput] = useState('');

  const [selectedResource, setSelectedResource] = useState<AvailableResources>();
  const [customResource, setCustomResource] = useState('');

  const [abortController, setAbortController] = useState<AbortController>();

  useEffect(() => {
    setSelectedResource(undefined);
    setCustomResource('');
  }, [isDrawerOpen]);

  const resourceToCreate = selectedResource === 'Other' ? customResource : selectedResource;

  const onGenerate = async () => {
    let query = `Create a ${resourceToCreate} for IB Business management topic "${syllabusContent.join(', ')}".`;

    if (contextsOfInterest) {
      query += ` Incorporate the contexts "${contextsOfInterest}".`;
    }

    if (resourceToCreate && promptAddition[resourceToCreate as AvailableResources]) {
      query += ` Additional instructions: "${promptAddition[resourceToCreate as AvailableResources]}".`;
    }

    const controller = new AbortController();
    setAbortController(controller);

    const response = streamChat({ query, history: [] }, { signal: controller.signal });

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
      controller={abortController}
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
          onChange={e => setSelectedResource(e.currentTarget.value as AvailableResources)}
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