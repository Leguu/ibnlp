import { notNullOrUndefined } from '@/utils/notNullOrUndefined';
import { Button, Tree, TreeNodeInfo } from '@blueprintjs/core';
import { cloneDeep } from 'lodash';
import { SyllabusContent } from './FormCards/SyllabusContentCard';

interface Props {
  tree: TreeNodeInfo<SyllabusContent>[];
  onTreeChange: (tree: TreeNodeInfo<SyllabusContent>[]) => void;
  hideUnselected?: boolean;
  canRemove?: boolean;
  canSelect?: boolean;
}

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

export const hasSelectedNodes = <T,>(node: TreeNodeInfo<T>): boolean => {
  if (node.isSelected) {
    return true;
  } else if (node.childNodes) {
    return node.childNodes.some(n => hasSelectedNodes(n));
  }

  return false;
};

export const filterSelectedNodesTree = <T,>(tree: TreeNodeInfo<T>[]): TreeNodeInfo<T>[] => {
  const filter = <X,>(node: TreeNodeInfo<X>): TreeNodeInfo<X> | undefined => {
    if (hasSelectedNodes(node)) {
      if (node.childNodes) {
        const filteredChildNodes = node.childNodes
          .map(filter)
          .filter(notNullOrUndefined);

        return {
          ...node,
          className: 'whitespace-pre-wrap',
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

const SyllabusTree = ({ tree, onTreeChange, canRemove, canSelect, hideUnselected }: Props) => {
  const handleNodeClick = (node: TreeNodeInfo, nodePath: number[], e: React.MouseEvent<HTMLElement>) => {
    if (node.childNodes) {
      if (node.isExpanded) {
        handleNodeCollapse(node, nodePath);
      } else {
        handleNodeExpand(node, nodePath);
      }
      return;
    };

    if (canSelect) {
      const cloneTree = cloneDeep(tree);
      Tree.nodeFromPath(nodePath, cloneTree).isSelected = !node.isSelected;

      onTreeChange(cloneTree);
    }
  };

  const handleNodeCollapse = (_node: TreeNodeInfo, nodePath: number[]) => {
    const cloneTree = cloneDeep(tree);
    Tree.nodeFromPath(nodePath, cloneTree).isExpanded = false;
    onTreeChange(cloneTree);
  };

  const handleNodeExpand = (_node: TreeNodeInfo, nodePath: number[]) => {
    const cloneTree = cloneDeep(tree);
    Tree.nodeFromPath(nodePath, cloneTree).isExpanded = true;
    onTreeChange(cloneTree);
  };

  const deselectNodeById = (id: string, tree: TreeNodeInfo<SyllabusContent>[]) => {
    const clonedTree = cloneDeep(tree);
    const node = nodeById(id, clonedTree);
    if (node) {
      node.isSelected = false;
      onTreeChange(clonedTree);
    }
  };

  const mapNode = (node: TreeNodeInfo): TreeNodeInfo => ({
    ...node,
    childNodes: node.childNodes?.map(mapNode),
    isSelected: false,
    label: !node.childNodes ? (
      <div className='flex flex-row items-center'>
        <Button icon='minus' onClick={() => deselectNodeById(node.id as string, tree)} minimal />
        <p className='ml-2 text-ellipsis overflow-hidden'>{node.label}</p>
      </div>
    ) : node.label
  });

  const hiddenTree = hideUnselected ? filterSelectedNodesTree(tree) : tree;

  const removableTree = canRemove ? hiddenTree.map(mapNode) : hiddenTree;

  return (
    <Tree
      contents={removableTree}
      onNodeClick={handleNodeClick}
      onNodeCollapse={handleNodeCollapse}
      onNodeExpand={handleNodeExpand}
    />
  );
};

export default SyllabusTree;