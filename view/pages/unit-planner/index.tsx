import ApplicationLayout from '@/layouts/ApplicationLayout';
import { Page } from '../_app';
import { Button, Card, Classes, Dialog, DialogBody, FormGroup, InputGroup, TreeNodeInfo } from '@blueprintjs/core';
import { useState } from 'react';
import { ContextsOfInterestCard } from '../../components/UnitPlanner/ContextsOfInterestCard';
import { useRequests } from '@/utils/http';
import { KeyConceptsCard } from '@/components/UnitPlanner/KeyConceptsCard';
import { SubjectAimsCard } from '@/components/UnitPlanner/SubjectAimsCard';
import { syllabusToTree, syllabus, filterSelectedNodesTree, SyllabusContentCard } from '@/components/UnitPlanner/SyllabusContentCard';

type ChatRequest = {
  query: string;
  history: {
    user: string;
    assistant: string;
  }[];
};

const getSelectedIds = (tree: TreeNodeInfo[]): string[] => {
  const ids: string[] = [];
  for (const node of tree) {
    if (node.isSelected) {
      ids.push(node.id as string);
    }
    if (node.childNodes) {
      ids.push(...getSelectedIds(node.childNodes));
    }
  }
  return ids;
};

const UnitPlannerPage: Page = () => {
  const requests = useRequests();
  const [selectedAims, setSelectedAims] = useState<string[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [contexts, setContexts] = useState<string[]>([]);

  const [tree, setTree] = useState<TreeNodeInfo[]>(syllabusToTree(syllabus));

  const [isOutputDialogOpen, setIsOutputDialogOpen] = useState(false);

  const [outputLoading, setOutputLoading] = useState(false);
  const [output, setOutput] = useState('');

  const onSubmit = async () => {
    setOutput('');
    setOutputLoading(true);
    setIsOutputDialogOpen(true);

    const filteredTree = filterSelectedNodesTree(tree);
    const syllabusContent = getSelectedIds(filteredTree);

    let query = '';
    if (syllabusContent.length > 0) {
      query += `I want to plan a unit on the following topics: "${syllabusContent.join(', ')}". `;
    }
    if (selectedAims.length > 0) {
      query += `I want to teach the following subject aims: ${selectedAims.join(', ')}. `;
    }
    if (selectedConcepts.length > 0) {
      query += `I want to teach the following key concepts: ${selectedConcepts.join(', ')}. `;
    }
    if (contexts.length > 0) {
      query += `I want to teach the following contexts of interest: ${contexts.join(', ')}.`;
    }

    const request: ChatRequest = { query, history: [] };

    const stream = requests.stream('/chat', request);

    for await (const data of stream) {
      setOutput(d => d + data);
    }

    setOutputLoading(false);
  };

  return (
    <div className='max-w-3xl w-full mx-auto space-y-2'>
      <Card>
        <FormGroup
          label='Subject'
        >
          <InputGroup />
        </FormGroup>

        <FormGroup
          label='Teachers'
        >
          <InputGroup />
        </FormGroup>

        <FormGroup
          label='Grades'
        >
          <InputGroup />
        </FormGroup>

        <FormGroup
          label='Name of Unit'
        >
          <InputGroup />
        </FormGroup>
      </Card>

      <SubjectAimsCard selectedAims={selectedAims} setSelectedAims={setSelectedAims} />

      <KeyConceptsCard selectedConcepts={selectedConcepts} setSelectedConcepts={setSelectedConcepts} />

      <SyllabusContentCard
        tree={tree}
        setTree={setTree}
      />

      <ContextsOfInterestCard
        contexts={contexts}
        setContexts={setContexts}
      />

      <div className='flex flex-row justify-end'>
        <Button
          onClick={onSubmit}
          intent='primary'
        >
          Generate
        </Button>
      </div>

      <Dialog
        isOpen={isOutputDialogOpen}
        title='Output'
        canOutsideClickClose={!outputLoading}
        canEscapeKeyClose={!outputLoading}
        isCloseButtonShown={!outputLoading}
        onClose={() => setIsOutputDialogOpen(false)}
        className={Classes.DARK + ' max-w-4xl xs:w-full [&.bp4-dialog]:w-full'}
        portalClassName='w-full'
      >
        <DialogBody className='whitespace-pre-line'>
          {output}
        </DialogBody>
      </Dialog>
    </div>
  );
};

UnitPlannerPage.authenticated = true;
UnitPlannerPage.getLayout = (page) => {
  return (
    <ApplicationLayout pageName='Unit Planner'>
      {page}
    </ApplicationLayout>
  );
};

export default UnitPlannerPage;