import { Button, Classes, Drawer, TreeNode, TreeNodeInfo } from '@blueprintjs/core';
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


const assessmentObjectiveCommandTerms: Record<number, string[]> = {
  1: ['Define', 'Describe', 'Identify', 'List', 'Outline', 'State'],
  2: ['Analyse', 'Apply', 'Comment', 'Demonstrate', 'Distinguish', 'Explain', 'Suggest'],
  3: ['Compare', 'Compare and Contrast', 'Contrast', 'Discuss', 'Evaluate', 'Examine', 'Justify', 'Recommend', 'To what extent'],
  4: ['Annotate', 'Calculate', 'Complete', 'Construct', 'Determine', 'Draw', 'Label', 'Plot', 'Prepare']
};

const getAssessmentObjectiveCommandTerm = (level: number): string[] => {
  const levels = Object.keys(assessmentObjectiveCommandTerms)
    .map(Number)
    .filter(l => l <= level);

  const commandTerms = levels.flatMap(l => assessmentObjectiveCommandTerms[l]);

  return commandTerms;
};

interface Props {
  tree: TreeNodeInfo<SyllabusContent>[];
}

const deselect = <T,>(node: TreeNodeInfo<T>): TreeNodeInfo<T> => {
  node.isSelected = false;
  if (node.childNodes) {
    node.childNodes.map(deselect);
  }
  return node;
};

const LearningObjectivesGenerator = ({ tree }: Props) => {
  const { streamChat } = useApi();

  const [innerTree, setInnerTree] = useState<TreeNodeInfo<SyllabusContent>[]>([]);

  useEffect(() => {
    const unselectedTree = filterSelectedNodesTree(tree);
    setInnerTree(unselectedTree.map(deselect));
  }, [tree]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isOutputLoading, setIsOutputLoading] = useState(false);
  const [isOutputDialogOpen, setIsOutputDialogOpen] = useState(false);
  const [output, setOutput] = useState('');

  const [abortController, setAbortController] = useState<AbortController>();

  const onGenerate = async () => {
    const selectedNodes = filterSelectedNodesTree(innerTree);
    const selectedIds = getTreeIds(selectedNodes);

    const highestLevel = Math.max(...selectedNodes.map(n => n.nodeData?.depthOfTeaching).filter(notNullOrUndefined));

    const commandTerms = getAssessmentObjectiveCommandTerm(highestLevel);

    const query = ` You will act as an experienced International baccalaureate Business teacher who plans the curriculum according to the specifications below. 
    Your task is to write the learning outcomes for the topics of "${selectedIds.join(', ')}". 
    You must start each learning objective with one of the "${commandTerms.join(', ')}" below. `;

    const controller = new AbortController();
    setAbortController(controller);

    const response = streamChat({ query, history: [] }, { signal: controller.signal, });

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
    <Tooltip2
      content={!tree.some(hasSelectedNodes) ? 'Please select syllabus content before continuing' : undefined}
      className='w-full'
    >
      <Button
        intent='primary'
        rightIcon='chevron-right'
        onClick={() => setIsDrawerOpen(true)}
        className='w-full'
        disabled={!tree.some(hasSelectedNodes)}
      >
        Learning Objectives
      </Button>
    </Tooltip2>

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
      title='Learning Objectives'
    >
      <div className='p-4'>
        Please select which syllabus content you would like to generate learning objectives for:
      </div>

      <SyllabusTree
        tree={innerTree}
        onTreeChange={setInnerTree}
        canSelect
      />

      <div className='flex justify-end p-4'>
        <Button intent='primary' onClick={onGenerate} disabled={!innerTree.some(hasSelectedNodes)}>
          Generate
        </Button>
      </div>
    </Drawer>

  </>;
};

export default LearningObjectivesGenerator;