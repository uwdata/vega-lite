import {AggregateOp, AggregateTransform as VgAggregateTransform} from 'vega';
import {isArgmaxDef, isArgminDef, isExponentialDef} from '../../aggregate';
import {
  Channel,
  getPositionChannelFromLatLong,
  getSecondaryRangeChannel,
  isGeoPositionChannel,
  isScaleChannel,
  isXorY
} from '../../channel';
import {
  binRequiresRange,
  FieldDef,
  getBandPosition,
  hasBandEnd,
  isScaleFieldDef,
  isTypedFieldDef,
  vgField
} from '../../channeldef';
import * as log from '../../log';
import {isFieldRange} from '../../scale';
import {AggregateTransform} from '../../transform';
import {Dict, duplicate, hash, keys, replacePathInField, setEqual} from '../../util';
import {isUnitModel, ModelWithField} from '../model';
import {UnitModel} from '../unit';
import {DataFlowNode} from './dataflow';
import {isRectBasedMark} from '../../mark';
import {OFFSETTED_RECT_END_SUFFIX, OFFSETTED_RECT_START_SUFFIX} from './timeunit';

type Measures = Dict<Partial<Record<AggregateOp, {aliases: Set<string>; aggregateParam?: number}>>>;

function addDimension(dims: Set<string>, channel: Channel, fieldDef: FieldDef<string>, model: ModelWithField) {
  const channelDef2 = isUnitModel(model) ? model.encoding[getSecondaryRangeChannel(channel)] : undefined;

  if (
    isTypedFieldDef(fieldDef) &&
    isUnitModel(model) &&
    hasBandEnd(fieldDef, channelDef2, model.markDef, model.config)
  ) {
    dims.add(vgField(fieldDef, {}));
    dims.add(vgField(fieldDef, {suffix: 'end'}));

    const {mark, markDef, config} = model;

    const bandPosition = getBandPosition({fieldDef, markDef, config});

    if (isRectBasedMark(mark) && bandPosition !== 0.5 && isXorY(channel)) {
      dims.add(vgField(fieldDef, {suffix: OFFSETTED_RECT_START_SUFFIX}));
      dims.add(vgField(fieldDef, {suffix: OFFSETTED_RECT_END_SUFFIX}));
    }

    if (fieldDef.bin && binRequiresRange(fieldDef, channel)) {
      dims.add(vgField(fieldDef, {binSuffix: 'range'}));
    }
  } else if (isGeoPositionChannel(channel)) {
    const posChannel = getPositionChannelFromLatLong(channel);
    dims.add(model.getName(posChannel));
  } else {
    dims.add(vgField(fieldDef));
  }
  if (isScaleFieldDef(fieldDef) && isFieldRange(fieldDef.scale?.range)) {
    dims.add(fieldDef.scale.range.field);
  }
  return dims;
}

function mergeMeasures(parentMeasures: Measures, childMeasures: Measures) {
  for (const field of keys(childMeasures)) {
    // when we merge a measure, we either have to add an aggregation operator or even a new field
    const ops = childMeasures[field];
    for (const op of keys(ops)) {
      if (field in parentMeasures) {
        // add operator to existing measure field
        parentMeasures[field][op] = {
          aliases: new Set([...(parentMeasures[field][op]?.aliases ?? []), ...ops[op].aliases])
        };

        const childAggregateParam = childMeasures[field][op].aggregateParam;
        if (childAggregateParam) {
          parentMeasures[field][op].aggregateParam = childAggregateParam;
        }
      } else {
        parentMeasures[field] = {[op]: ops[op]};
      }
    }
  }
}

export class AggregateNode extends DataFlowNode {
  public clone() {
    return new AggregateNode(null, new Set(this.dimensions), duplicate(this.measures));
  }

  /**
   * @param dimensions string set for dimensions
   * @param measures dictionary mapping field name => dict of aggregation functions and names to use
   */
  constructor(
    parent: DataFlowNode,
    private dimensions: Set<string>,
    private measures: Measures
  ) {
    super(parent);
  }

  get groupBy() {
    return this.dimensions;
  }

  public static makeFromEncoding(parent: DataFlowNode, model: UnitModel): AggregateNode {
    let isAggregate = false;
    model.forEachFieldDef(fd => {
      if (fd.aggregate) {
        isAggregate = true;
      }
    });

    const meas: Measures = {};
    const dims = new Set<string>();

    if (!isAggregate) {
      // no need to create this node if the model has no aggregation
      return null;
    }

    model.forEachFieldDef((fieldDef, channel: Channel) => {
      const {aggregate, field} = fieldDef;
      if (aggregate) {
        if (aggregate === 'count') {
          meas['*'] ??= {};
          meas['*']['count'] = {aliases: new Set([vgField(fieldDef, {forAs: true})])};
        } else {
          if (isArgminDef(aggregate) || isArgmaxDef(aggregate)) {
            const op = isArgminDef(aggregate) ? 'argmin' : 'argmax';
            const argField = aggregate[op];
            meas[argField] ??= {};
            meas[argField][op] = {aliases: new Set([vgField({op, field: argField}, {forAs: true})])};
          } else if (isExponentialDef(aggregate)) {
            const op = 'exponential';
            const aggregateParam = aggregate[op];
            meas[field] ??= {};
            meas[field][op] = {aliases: new Set([vgField(fieldDef, {forAs: true})]), aggregateParam: aggregateParam};
          } else {
            meas[field] ??= {};
            meas[field][aggregate] = {aliases: new Set([vgField(fieldDef, {forAs: true})])};
          }

          // For scale channel with domain === 'unaggregated', add min/max so we can use their union as unaggregated domain
          if (isScaleChannel(channel) && model.scaleDomain(channel) === 'unaggregated') {
            meas[field] ??= {};
            meas[field]['min'] = {aliases: new Set([vgField({field, aggregate: 'min'}, {forAs: true})])};
            meas[field]['max'] = {aliases: new Set([vgField({field, aggregate: 'max'}, {forAs: true})])};
          }
        }
      } else {
        addDimension(dims, channel, fieldDef, model);
      }
    });

    if (dims.size + keys(meas).length === 0) {
      return null;
    }

    return new AggregateNode(parent, dims, meas);
  }

  public static makeFromTransform(parent: DataFlowNode, t: AggregateTransform): AggregateNode {
    const dims = new Set<string>();
    const meas: Measures = {};

    for (const s of t.aggregate) {
      const {op, field, as} = s;
      if (op) {
        const aliases = new Set([as ? as : vgField(s, {forAs: true})]);
        if (op === 'count') {
          meas['*'] ??= {};
          meas['*']['count'] = {aliases};
        } else {
          if (isExponentialDef(op)) {
            const opName = 'exponential';
            const aggregateParam = op[opName];
            meas[field] ??= {};
            meas[field][opName] = {
              aliases,
              aggregateParam
            };
          } else {
            meas[field] ??= {};
            meas[field][op] = {aliases};
          }
        }
      }
    }

    for (const s of t.groupby ?? []) {
      dims.add(s);
    }

    if (dims.size + keys(meas).length === 0) {
      return null;
    }

    return new AggregateNode(parent, dims, meas);
  }

  public merge(other: AggregateNode): boolean {
    if (setEqual(this.dimensions, other.dimensions)) {
      mergeMeasures(this.measures, other.measures);
      return true;
    }
    log.debug('different dimensions, cannot merge');
    return false;
  }

  public addDimensions(fields: readonly string[]) {
    fields.forEach(this.dimensions.add, this.dimensions);
  }

  public dependentFields() {
    return new Set([...this.dimensions, ...keys(this.measures)]);
  }

  public producedFields() {
    const out = new Set<string>();

    for (const field of keys(this.measures)) {
      for (const op of keys(this.measures[field])) {
        const m = this.measures[field][op].aliases;
        if (m.size === 0) {
          out.add(`${op}_${field}`);
        } else {
          m.forEach(out.add, out);
        }
      }
    }

    return out;
  }

  public hash() {
    return `Aggregate ${hash({dimensions: this.dimensions, measures: this.measures})}`;
  }

  public assemble(): VgAggregateTransform {
    const ops: AggregateOp[] = [];
    const fields: string[] = [];
    const as: string[] = [];
    const aggregateParams: (number | null)[] = [];

    for (const field of keys(this.measures)) {
      for (const op of keys(this.measures[field])) {
        for (const alias of this.measures[field][op].aliases) {
          as.push(alias);
          ops.push(op);
          fields.push(field === '*' ? null : replacePathInField(field));
          aggregateParams.push(this.measures[field][op].aggregateParam || null);
        }
      }
    }

    const result: VgAggregateTransform = {
      type: 'aggregate',
      groupby: [...this.dimensions].map(replacePathInField),
      ops,
      fields,
      as
    };

    if (aggregateParams.some(param => typeof param === 'number')) {
      result.aggregate_params = aggregateParams;
    }

    return result;
  }
}
