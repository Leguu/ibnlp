import ApplicationLayout from '@/layouts/ApplicationLayout';
import { Page } from '../_app';
import { Button, Card, Classes, Dialog, DialogBody, Divider, FormGroup, InputGroup, Label, TreeNodeInfo } from '@blueprintjs/core';
import { useState } from 'react';
import ContextsOfInterestCard from '@/components/UnitPlanner/FormCards/ContextsOfInterestCard';
import StandardGenerators from '@/components/UnitPlanner/Generators/StandardGenerators';
import KeyConceptsCard from '@/components/UnitPlanner/FormCards/KeyConceptsCard';
import SubjectAimsCard from '@/components/UnitPlanner/FormCards/SubjectAimsCard';
import OutputDialog from '@/components/UnitPlanner/OutputDialog';
import InquiryQuestionsGenerator from '@/components/UnitPlanner/Generators/InquiryQuestionsGenerator';
import ATLGenerator from '@/components/UnitPlanner/Generators/ATLGenerator';
import SyllabusContentCard, { syllabusToTree, SyllabusContent } from '@/components/UnitPlanner/FormCards/SyllabusContentCard';
import { filterSelectedNodesTree } from '@/components/UnitPlanner/SyllabusTree';
import LearningObjectivesGenerator from '@/components/UnitPlanner/Generators/LearningObjectivesGenerator';
import LearningResourcesGenerator from '@/components/UnitPlanner/Generators/LearningResourcesGenerator';
import { businessManagementSyllabus } from '@/components/UnitPlanner/FormCards/businessManagementSyllabus';
import { useApi } from '@/api/api';

export const getTreeIds = (tree: TreeNodeInfo[]): string[] => {
  const ids: string[] = [];
  for (const node of tree) {
    ids.push(node.id as string);
    if (node.childNodes) {
      ids.push(...getTreeIds(node.childNodes));
    }
  }
  return ids;
};

const UnitPlannerPage: Page = () => {
  const { streamChat } = useApi();

  const [selectedAims, setSelectedAims] = useState<string[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [contexts, setContexts] = useState<string[]>([]);

  const [tree, setTree] = useState<TreeNodeInfo<SyllabusContent>[]>(syllabusToTree(businessManagementSyllabus));

  const [isOutputDialogOpen, setIsOutputDialogOpen] = useState(false);

  const [outputLoading, setOutputLoading] = useState(false);
  const [output, setOutput] = useState('');

  const [abortController, setAbortController] = useState<AbortController>();

  const onSubmit = async (query: string) => {
    setOutput('');
    setOutputLoading(true);
    setIsOutputDialogOpen(true);

    const controller = new AbortController();

    setAbortController(controller);

    const stream = streamChat({ query, history: [] }, { signal: controller.signal });

    for await (const data of stream) {
      setOutput(d => d + data);
    }

    setOutputLoading(false);
  };

  return (
    <div className='pt-5 max-w-5xl w-full mx-auto lg:grid grid-cols-none lg:grid-cols-12 gap-4'>
      <div className='space-y-2 w-full col-span-9'>
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
      </div>

      <div className='col-span-3 p-4'>
        <Label className='[&.bp4-label]:mb-1'>Generate:</Label>

        <div className='space-y-2'>
          <InquiryQuestionsGenerator
            contextOfInterest={contexts}
            keyConcepts={selectedConcepts}
            subjectAims={selectedAims}
            syllabusContent={getTreeIds(filterSelectedNodesTree(tree))}
          />

          <StandardGenerators
            contextOfInterest={contexts}
            keyConcepts={selectedConcepts}
            subjectAims={selectedAims}
            syllabusContent={getTreeIds(filterSelectedNodesTree(tree))}
            onPromptGenerated={onSubmit}
          />

          <Divider />

          <ATLGenerator
            syllabusContent={getTreeIds(filterSelectedNodesTree(tree))}
          />

          <LearningObjectivesGenerator
            tree={tree}
          />

          <LearningResourcesGenerator
            syllabusContent={getTreeIds(filterSelectedNodesTree(tree))}
            contextsOfInterest={contexts}
          />
        </div>
      </div>

      <OutputDialog
        isOpen={isOutputDialogOpen}
        loading={outputLoading}
        onClose={() => setIsOutputDialogOpen(false)}
        controller={abortController}
      >
        {output}
      </OutputDialog>
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