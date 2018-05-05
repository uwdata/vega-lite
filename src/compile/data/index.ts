import {Dict} from '../../util';
import {Split} from '../split';
import {OutputNode} from './dataflow';
import {FacetNode} from './facet';
import {SourceNode} from './source';

export interface DataComponent {
  /**
   * A dictionary of sources indexed by a hash.
   */
  sources: Dict<SourceNode>;

  /**
   * Registry of output nodes.
   */
  outputNodes: Dict<OutputNode | FacetNode>;

  /**
   * How often is an output node used. If it is not used, we don't need to
   * instantiate it in the assemble step.
   */
  outputNodeRefCounts: Dict<number>;

  /**
   * The output node before aggregation.
   */
  raw?: OutputNode;

  /**
   * The main output node.
   */
  main?: OutputNode;

  /**
   * For facets, we store the reference to the root node.
   */
  facetRoot?: FacetNode;

  /**
   * True if the data for this model is faceted.
   * A dataset is faceted if a parent model is a facet and no new dataset is
   * defined (which would make the data unfaceted again).
   */
  isFaceted: boolean;

  /**
   * Parse properties passed down from ancestors. Helps us to keep track of what has been parsed or is derived.
   */
  ancestorParse?: AncestorParse;
}

export class AncestorParse extends Split<Dict<string>> {
  constructor(
    public readonly explicit: Partial<Dict<string>> = {},
    public readonly implicit: Partial<Dict<string>> = {},
    public parseNothing = false
  ) {
    super(explicit, implicit);
  }

  public clone(): AncestorParse {
    const clone = super.clone() as AncestorParse;
    clone.parseNothing = this.parseNothing;
    return clone;
  }
}
