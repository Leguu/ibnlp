import { notNullOrUndefined } from '@/utils/notNullOrUndefined';
import { TreeNodeInfo, Tree, Card, H6, Button, Drawer, Classes, Callout } from '@blueprintjs/core';
import { cloneDeep } from 'lodash';
import { useState } from 'react';
import { NewLineKind } from 'typescript';
import SyllabusTree from '../SyllabusTree';

export interface SyllabusContent {
  unit: string;
  depthOfTeaching?: number;
  topics?: SyllabusContent[];
}

export const syllabus: SyllabusContent[] = [{
  unit: 'Introduction to Business Management',
  topics: [{
    unit: 'What is a business?',
    topics: [
      { unit: 'The nature of business', depthOfTeaching: 1 },
      { unit: 'Primary, secondary, tertiary, and quaternary sectors', depthOfTeaching: 2 },
      { unit: 'Entrepreneurship', depthOfTeaching: 2 },
      { unit: 'Challenges and opportunities for starting up a business', depthOfTeaching: 2 },
    ]
  }, {
    unit: 'Types of business entities',
    topics: [
      { unit: 'Distinction between the private and the public sectors', depthOfTeaching: 2 },
      { unit: 'The main features of the following types of organizations: sole traders, partnerships, privately held companies, publicly held companies', depthOfTeaching: 3 },
      { unit: 'The main features of the following types of for-profit social enterprises: private sector companies, public sector companies, cooperatives', depthOfTeaching: 3 },
      { unit: 'The main features of the following type of non-profit social enterprise: non-governmental organizations (NGOs)', depthOfTeaching: 3 },
    ]
  }, {
    unit: 'Business objectives',
    topics: [
      { unit: 'Vision statement and mission statement', depthOfTeaching: 2 },
      { unit: 'Common business objectives including growth, profit, protecting shareholder value and ethical objectives', depthOfTeaching: 2 },
      { unit: 'Strategic and tactical objectives', depthOfTeaching: 3 },
      { unit: 'Corporate social responsibility (CSR)', depthOfTeaching: 3 },
    ]
  }, {
    unit: 'Stakeholders',
    topics: [
      { unit: 'Internal and external stakeholders', depthOfTeaching: 2 },
      { unit: 'Conflict between stakeholders', depthOfTeaching: 2 },
    ]
  }, {
    unit: 'Growth and evolution',
    topics: [
      { unit: 'Internal and external economies and diseconomies of scale', depthOfTeaching: 2 },
      { unit: 'The difference between internal and external growth', depthOfTeaching: 2 },
      { unit: 'Reasons for businesses to grow', depthOfTeaching: 3 },
      { unit: 'Reasons for businesses to stay small', depthOfTeaching: 3 },
      { unit: 'External growth methods: mergers and acquisitions (M&As), takeovers, joint ventures, strategic alliances, franchising', depthOfTeaching: 3 },
    ]
  }, {
    unit: 'Multinational companies (MNCs)',
    topics: [
      { unit: 'The impact of MNCs on the host countries', depthOfTeaching: 3 },
    ]
  }]
}];

export const syllabusToTree = (syllabus: SyllabusContent[]): TreeNodeInfo<SyllabusContent>[] => syllabus.map(s => ({
  id: s.unit,
  label: s.unit,
  hasCaret: s.topics ? true : false,
  childNodes: s.topics ? syllabusToTree(s.topics) : undefined,
  nodeData: { depthOfTeaching: s.depthOfTeaching, unit: s.unit },
  isExpanded: true,
  isSelected: false,
}));

export const SyllabusContentCard = ({ tree, setTree }: {
  tree: TreeNodeInfo<SyllabusContent>[];
  setTree: (tree: TreeNodeInfo<SyllabusContent>[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div className='flex flex-row items-center justify-between'>
        <div>
          <H6 className='m-0'>Syllabus Content</H6>
        </div>

        <Button icon='add' onClick={() => setOpen(true)} />
      </div>

      <SyllabusTree
        tree={tree}
        onTreeChange={setTree}
        canRemove
        hideUnselected
      />

      <Drawer
        isOpen={open}
        className={`${Classes.DARK} max-w-lg`}
        onClose={() => setOpen(false)}
        title='Select Subject Aims'
      >
        <div className={Classes.DRAWER_BODY}>
          <Callout intent='primary'>
            Your options are saved automatically
          </Callout>

          <SyllabusTree
            tree={tree}
            onTreeChange={setTree}
            canSelect
          />
        </div>
      </Drawer>
    </Card>
  );
};

export default SyllabusContentCard;