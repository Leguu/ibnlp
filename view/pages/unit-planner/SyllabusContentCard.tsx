import { notNullOrUndefined } from '@/utils/notNullOrUndefined';
import { TreeNodeInfo, Tree, Card, H6, Button, Drawer, Classes, Callout } from '@blueprintjs/core';
import { cloneDeep } from 'lodash';
import { useState } from 'react';
import { NewLineKind } from 'typescript';

interface SyllabusContent {
  unit: string;
  topics?: SyllabusContent[];
}

export const syllabus: SyllabusContent[] = [{
  unit: 'Introduction to Business Management',
  topics: [{
    unit: 'What is a business?',
  }, {
    unit: 'Types of business entities',
  }, {
    unit: 'Business objectives',
  }, {
    unit: 'Stakeholders',
  }, {
    unit: 'Growth and evolution',
  }, {
    unit: 'Multinational companies (MNCs)'
  }]
}];

export const syllabusToTree = (syllabus: SyllabusContent[]): TreeNodeInfo[] => syllabus.map(s => ({
  id: s.unit,
  label: s.unit,
  hasCaret: s.topics ? true : false,
  childNodes: s.topics ? syllabusToTree(s.topics) : undefined,
  isExpanded: false,
  isSelected: false,
}));

const nodeById = (id: string, tree: TreeNodeInfo[]): TreeNodeInfo | undefined => {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    } else if (node.childNodes) {
      const childNode = nodeById(id, node.childNodes);
      if (childNode) {
        return childNode;
      }
    }
  }
};

const deselectNodeById = (id: string, tree: TreeNodeInfo[]): TreeNodeInfo[] => {
  const clonedTree = cloneDeep(tree);
  const node = nodeById(id, clonedTree);
  if (node) {
    node.isSelected = false;
  }
  return clonedTree;
};

const hasSelectedNodes = (node: TreeNodeInfo): boolean => {
  if (node.isSelected) {
    return true;
  } else if (node.childNodes) {
    return node.childNodes.some(n => hasSelectedNodes(n));
  }

  return false;
};

export const filterSelectedNodesTree = (tree: TreeNodeInfo[]) => {
  const filter = (node: TreeNodeInfo): TreeNodeInfo | undefined => {
    if (hasSelectedNodes(node)) {
      if (node.childNodes) {
        const filteredChildNodes = node.childNodes
          .map(filter)
          .filter(notNullOrUndefined);

        return {
          ...node,
          childNodes: filteredChildNodes,
        };
      }

      return {
        ...node,
      };
    }
  };

  const clonedTree = cloneDeep(tree);

  return clonedTree
    .map(filter)
    .filter(notNullOrUndefined);
};

export const SyllabusContentCard = ({ tree, setTree }: {
  tree: TreeNodeInfo[];
  setTree: (tree: TreeNodeInfo[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  const handleNodeClick = (node: TreeNodeInfo, nodePath: number[], e: React.MouseEvent<HTMLElement>) => {
    if (node.childNodes) {
      if (node.isExpanded) {
        handleNodeCollapse(node, nodePath);
      } else {
        handleNodeExpand(node, nodePath);
      }
      return;
    };

    const cloneTree = cloneDeep(tree);
    Tree.nodeFromPath(nodePath, cloneTree).isSelected = !node.isSelected;

    setTree(cloneTree);
  };

  const handleNodeCollapse = (_node: TreeNodeInfo, nodePath: number[]) => {
    const cloneTree = cloneDeep(tree);
    Tree.nodeFromPath(nodePath, cloneTree).isExpanded = false;
    setTree(cloneTree);
  };

  const handleNodeExpand = (_node: TreeNodeInfo, nodePath: number[]) => {
    const cloneTree = cloneDeep(tree);
    Tree.nodeFromPath(nodePath, cloneTree).isExpanded = true;
    setTree(cloneTree);
  };

  // const newNode: Partial<TreeNodeInfo> = {
  //   label: (
  //     <div className='flex flex-row items-center'>
  //       <Button icon='minus' onClick={() => deselectNodeById(node.id as string, tree)} minimal />
  //       <p className='ml-2 text-ellipsis overflow-hidden'>{node.label}</p>
  //     </div>
  //   ),
  //   isExpanded: true,
  //   isSelected: false,
  // };


  const filteredTree = filterSelectedNodesTree(tree);

  return (
    <Card>
      <div className='flex flex-row items-center justify-between'>
        <div>
          <H6 className='m-0'>Syllabus Content</H6>
        </div>

        <Button icon='add' onClick={() => setOpen(true)} />
      </div>

      {filteredTree.length > 0 && (
        <Tree contents={filteredTree} className='mt-2 overflow-x-auto' />
      )}

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

          <Tree
            contents={tree}
            onNodeClick={handleNodeClick}
            onNodeCollapse={handleNodeCollapse}
            onNodeExpand={handleNodeExpand}
          />
        </div>
      </Drawer>
    </Card>
  );
};
