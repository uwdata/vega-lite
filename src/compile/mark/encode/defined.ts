import {isCountingAggregateOp} from '../../../aggregate';
import {isScaleChannel} from '../../../channel';
import {Value} from '../../../channeldef';
import {VgEncodeEntry} from '../../../vega.schema';
import {signalOrValueRef} from '../../common';
import {getScaleInvalidDataMode, shouldBreakPath} from '../../invalid/ScaleInvalidDataMode';
import {UnitModel} from '../../unit';
import {fieldInvalidPredicate} from './invalid';

/**
 * Create Vega's "defined" encoding to break paths in a path mark for invalid values.
 */
export function defined(model: UnitModel): VgEncodeEntry {
  const {config, markDef} = model;

  // For each channel (x/y), add fields to break path to a set first.
  const fieldsToBreakPath = new Set<string>();

  model.forEachFieldDef((fieldDef, channel) => {
    let scaleType;
    if (!isScaleChannel(channel) || !(scaleType = model.getScaleType(channel))) {
      // Skip if the channel is not a scale channel or does not have a scale
      return;
    }

    const isCountAggregate = isCountingAggregateOp(fieldDef.aggregate);
    const invalidDataMode = getScaleInvalidDataMode({
      scaleChannel: channel,
      markDef,
      config,
      scaleType,
      isCountAggregate
    });
    if (shouldBreakPath(invalidDataMode)) {
      const field = model.vgField(channel, {expr: 'datum', binSuffix: model.stack?.impute ? 'mid' : undefined});
      if (field) {
        fieldsToBreakPath.add(field);
      }
    }
  });

  // If the set is not empty, return a defined signal.
  if (fieldsToBreakPath.size > 0) {
    const signal = [...fieldsToBreakPath].map(field => fieldInvalidPredicate(field, {invalid: false})).join(' && ');
    return {defined: {signal}};
  }
  return undefined;
}

export function valueIfDefined(prop: string, value: Value): VgEncodeEntry {
  if (value !== undefined) {
    return {[prop]: signalOrValueRef(value)};
  }
  return undefined;
}
