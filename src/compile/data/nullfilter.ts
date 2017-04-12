import {FieldDef} from '../../fielddef';
import {QUANTITATIVE, TEMPORAL} from '../../type';
import {contains, Dict, differ, differArray, extend, hash, keys} from '../../util';
import {VgFilterTransform} from '../../vega.schema';
import {Model} from './../model';
import {DataFlowNode} from './dataflow';

const DEFAULT_NULL_FILTERS = {
  nominal: false,
  ordinal: false,
  quantitative: true,
  temporal: true
};

export class NullFilterNode extends DataFlowNode {
  private _aggregator: Dict<FieldDef>;

  constructor(model: Model) {
    super();

    this._aggregator = model.reduceFieldDef(function(aggregator: Dict<FieldDef>, fieldDef: FieldDef) {
      if (fieldDef.aggregate !== 'count') { // Ignore * for count(*) fields.
        if (model.config.filterInvalid ||
          (model.config.filterInvalid === undefined && (fieldDef.field && DEFAULT_NULL_FILTERS[fieldDef.type]))) {
          aggregator[fieldDef.field] = fieldDef;
        } else {
          // define this so we know that we don't filter nulls for this field
          // this makes it easier to merge into parents
          aggregator[fieldDef.field] = null;
        }
      }
      return aggregator;
    }, {});
  }

  get aggregator() {
      return this._aggregator;
  }

  public merge(other: NullFilterNode) {
    const t = Object.keys(this._aggregator).map(k => k + ' ' + hash(this._aggregator[k]));
    const o = Object.keys(other.aggregator).map(k => k + ' ' + hash(other.aggregator[k]));

    if (!differArray(t, o)) {
      this._aggregator = extend(this._aggregator, other._aggregator);
      other.remove();
    }
  }

  public assemble(): VgFilterTransform {
    const filters = keys(this._aggregator).reduce((_filters, field) => {
      const fieldDef = this._aggregator[field];
      if (fieldDef !== null) {
        _filters.push('datum["' + fieldDef.field + '"] !== null');
        if (contains([QUANTITATIVE, TEMPORAL], fieldDef.type)) {
          // TODO(https://github.com/vega/vega-lite/issues/1436):
          // We can be even smarter and add NaN filter for N,O that are numbers
          // based on the `parse` property once we have it.
          _filters.push('!isNaN(datum["'+ fieldDef.field + '"])');
        }
      }
      return _filters;
    }, []);

    return filters.length > 0 ?
      {
        type: 'filter',
        expr: filters.join(' && ')
      } : null;
  }
}
