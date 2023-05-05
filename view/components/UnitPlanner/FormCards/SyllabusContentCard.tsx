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