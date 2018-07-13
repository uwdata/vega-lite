import {MAIN} from '../../data';
import {flatten, keys, vals} from '../../util';
import {AggregateNode} from './aggregate';
import {DataFlowNode, OutputNode} from './dataflow';
import {FacetNode} from './facet';
import {FilterInvalidNode} from './filterinvalid';
import {ParseNode} from './formatparse';
import {DataComponent} from './index';
import * as optimizers from './optimizers';
import {SourceNode} from './source';
import {StackNode} from './stack';

export const FACET_SCALE_PREFIX = 'scale_';

/**
 * Clones the subtree and ignores output nodes except for the leafs, which are renamed.
 */
function cloneSubtree(facet: FacetNode) {
  function clone(node: DataFlowNode): DataFlowNode[] {
    if (!(node instanceof FacetNode)) {
      const copy = node.clone();

      if (copy instanceof OutputNode) {
        const newName = FACET_SCALE_PREFIX + copy.getSource();
        copy.setSource(newName);

        facet.model.component.data.outputNodes[newName] = copy;
      } else if (copy instanceof AggregateNode || copy instanceof StackNode) {
        copy.addDimensions(facet.fields);
      }
      flatten(node.children.map(clone)).forEach((n: DataFlowNode) => (n.parent = copy));

      return [copy];
    }

    return flatten(node.children.map(clone));
  }
  return clone;
}

/**
 * Move facet nodes down to the next fork or output node. Also pull the main output with the facet node.
 * After moving down the facet node, make a copy of the subtree and make it a child of the main output.
 */
function moveFacetDown(node: DataFlowNode) {
  if (node instanceof FacetNode) {
    if (node.numChildren() === 1 && !(node.children[0] instanceof OutputNode)) {
      // move down until we hit a fork or output node

      const child = node.children[0];

      if (child instanceof AggregateNode || child instanceof StackNode) {
        child.addDimensions(node.fields);
      }

      child.swapWithParent();
      moveFacetDown(node);
    } else {
      // move main to facet
      moveMainDownToFacet(node.model.component.data.main);

      // replicate the subtree and place it before the facet's main node
      const copy: DataFlowNode[] = flatten(node.children.map(cloneSubtree(node)));
      copy.forEach(c => (c.parent = node.model.component.data.main));
    }
  } else {
    node.children.forEach(moveFacetDown);
  }
}

function moveMainDownToFacet(node: DataFlowNode) {
  if (node instanceof OutputNode && node.type === MAIN) {
    if (node.numChildren() === 1) {
      const child = node.children[0];

      if (!(child instanceof FacetNode)) {
        child.swapWithParent();
        moveMainDownToFacet(node);
      }
    }
  }
}

/**
 * Remove nodes that are not required starting from a root.
 */
function removeUnnecessaryNodes(node: DataFlowNode) {
  // remove output nodes that are not required
  if (node instanceof OutputNode && !node.isRequired()) {
    node.remove();
  }

  node.children.forEach(removeUnnecessaryNodes);
}

/**
 * Return all leaf nodes.
 */
function getLeaves(roots: DataFlowNode[]) {
  const leaves: DataFlowNode[] = [];
  function append(node: DataFlowNode) {
    if (node.numChildren() === 0) {
      leaves.push(node);
    } else {
      node.children.forEach(append);
    }
  }

  roots.forEach(append);
  return leaves;
}

/**
 * ParseNodes are not mergeable only if their `this._parse`s have a common key but different values for that key.
 */
export function isParseMergeable(x: ParseNode, y: ParseNode) {
  const xParse = x.parse;
  const yParse = y.parse;
  for (const k of keys(xParse)) {
    if (k in yParse && yParse[k] !== xParse[k]) {
      return false;
    }
  }
  return true;
}

export function mergeParse(node: DataFlowNode) {
  const parseChildren = node.children.filter((x): x is ParseNode => x instanceof ParseNode);

  if (parseChildren.length > 1) {
    const mergedParse = parseChildren.pop();
    const mergeableParseChildren = parseChildren.filter(x => isParseMergeable(x, mergedParse));
    mergeableParseChildren.forEach(x => {
      node.removeChild(x);
      x.parent = mergedParse;
      mergedParse.merge(x);
    });
  } else {
    node.children.forEach(mergeParse);
  }
}

/**
 * Optimizes the dataflow of the passed in data component.
 */
export function optimizeDataflow(dataComponent: DataComponent) {
  let roots: SourceNode[] = vals(dataComponent.sources);

  roots.forEach(removeUnnecessaryNodes);

  // remove source nodes that don't have any children because they also don't have output nodes
  roots = roots.filter(r => r.numChildren() > 0);
  getLeaves(roots).forEach(optimizers.iterateFromLeaves(optimizers.removeUnusedSubtrees));
  roots = roots.filter(r => r.numChildren() > 0);

  getLeaves(roots).forEach(optimizers.iterateFromLeaves(optimizers.moveParseUp));
  getLeaves(roots).forEach(optimizers.removeDuplicateTimeUnits);

  roots.forEach(moveFacetDown);
  roots.forEach(mergeParse);

  keys(dataComponent.sources).forEach(s => {
    if (dataComponent.sources[s].numChildren() === 0) {
      delete dataComponent.sources[s];
    }
  });
}
