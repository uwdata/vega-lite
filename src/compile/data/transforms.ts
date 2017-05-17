import {isArray} from 'vega-util';
import {expression, Filter} from '../../filter';
import * as log from '../../log';
import {CalculateTransform, FilterTransform, isCalculate, isFilter, isLookup, LookupTransform} from '../../transform';
import {duplicate} from '../../util';
import {VgFilterTransform, VgFormulaTransform, VgLookupTransform} from '../../vega.schema';
import {Model} from '../model';
import {DataFlowNode} from './dataflow';
import {FacetNode} from './facet';
import {SourceNode} from './source';

export class FilterNode extends DataFlowNode {
  public clone() {
    return new FilterNode(this.model, duplicate(this.filter));
  }

  constructor(private readonly model: Model, private filter: Filter) {
    super();
  }

  public assemble(): VgFilterTransform {
    return {
      type: 'filter',
      expr: expression(this.model, this.filter)
    };
  }
}

/**
 * We don't know what a calculate node depends on so we should never move it beyond anything that produces fields.
 */
export class CalculateNode extends DataFlowNode {
  public clone() {
    return new CalculateNode(duplicate(this.transform));
  }

  constructor(private transform: CalculateTransform) {
    super();
  }

  public producedFields() {
    const out = {};
    out[this.transform.as] = true;
    return out;
  }

  public assemble(): VgFormulaTransform {
    return {
      type: 'formula',
      expr: this.transform.calculate,
      as: this.transform.as
    };
  }
}

export class LookupNode extends DataFlowNode {
  private readonly secondaryDataName: string;

  constructor(private transform: LookupTransform, public secondary: DataFlowNode) {
    super();
  }

  public assemble(): VgLookupTransform {
    // TODO: this.transform.from.fields isn't used
    const DEFAULT_AS = '_lookup';
    let source: string;
    if (this.secondary instanceof FacetNode) {
      source = this.secondary.name;
    } else if (this.secondary instanceof SourceNode) {
      source = this.secondary.dataName;
    }

    /* TODO: handle foreign data retrevial using VALUES and renaming using AS (potentially implicit) or FIELDS (see above) */
    /* https://vega.github.io/vega/docs/transforms/lookup/ */
    /* VALUES: The data fields to copy from the secondary stream to the primary stream. If not specified, a reference to the full data record is copied. */
    /* AS: The output fields at which to write data found in the secondary stream. If not specified and a values parameter is supplied, the names of the fields in the values array will be used. This parameter is required if multiple fields are provided or values is unspecified. */

    const foreign = {
      as: this.transform.as
        ? ((this.transform.as instanceof Array) ? this.transform.as : [this.transform.as])
        : [DEFAULT_AS]
    };

    console.log(this.secondary);
    return {
      type: 'lookup',
      from: source,
      key: this.transform.from.key,
      fields: [this.transform.lookup],
      ...foreign,
      ...(this.transform.default ? {default: this.transform.default} : {})
    };
  }
}


/**
 * Parses a transforms array into a chain of connected dataflow nodes.
 */
export function parseTransformArray(model: Model, lookups: DataFlowNode[]) {
  let first: DataFlowNode;
  let last: DataFlowNode;
  let node: DataFlowNode;
  let previous: DataFlowNode;

  let lookupIndex = -1;
  model.transforms.forEach((t, i) => {
    if (isLookup(t)) {
      node = new LookupNode(t, lookups[lookupIndex]);
      lookupIndex++;
      lookups[lookupIndex].addChild(node);
      console.log(node);
    } else if (isCalculate(t)) {
      node = new CalculateNode(t);
    } else if (isFilter(t)) {
      node = new FilterNode(model, t.filter);
    } else {
      log.warn(log.message.invalidTransformIgnored(t));
      return;
    }

    if (i === 0) {
      first = node;
    } else {
      node.parent = previous;
    }
    previous = node;
  });

  last = node;

  return {first, last};
}
