import * as log from '../../log';

import {hasScale, supportScaleType, rangeType, Channel} from '../../channel';
import {Mark} from '../../mark';
import {ScaleType, ScaleConfig} from '../../scale';
import {isDiscreteByDefault} from '../../timeunit';

import * as util from '../../util';
import {FieldDef} from '../../fielddef';

export type RangeType = 'continuous' | 'discrete' | 'flexible' | undefined;

/**
 * Determine if there is a specified scale type and if it is appropriate,
 * or determine default type if type is unspecified or inappropriate.
 */
// NOTE: CompassQL uses this method.
export default function type(
  specifiedType: ScaleType, channel: Channel, fieldDef: FieldDef, mark: Mark,
  hasTopLevelSize: boolean, specifiedRangeStep: number, scaleConfig: ScaleConfig): ScaleType {

  const defaultScaleType = defaultType(channel, fieldDef, mark, hasTopLevelSize, specifiedRangeStep, scaleConfig);

  if (!hasScale(channel)) {
    // There is no scale for these channels
    return null;
  }
  if (specifiedType !== undefined) {
    // for binned fields we don't allow overriding the default scale
    if (fieldDef.bin) {
      // TODO: generalize this as a method in fieldDef that determines scale type support for a fieldDef (looking at functions and type)
      log.warn(log.message.cannotOverrideBinScaleType(channel, defaultScaleType));
      return defaultScaleType;
    }

    // Check if explicitly specified scale type is supported by the channel
    if (supportScaleType(channel, specifiedType)) {
      return specifiedType;
    } else {
      log.warn(log.message.scaleTypeNotWorkWithChannel(channel, specifiedType, defaultScaleType));
      return defaultScaleType;
    }
  }

  return defaultScaleType;
}

/**
 * Determine appropriate default scale type.
 */
function defaultType(channel: Channel, fieldDef: FieldDef, mark: Mark,
  hasTopLevelSize: boolean, specifiedRangeStep: number, scaleConfig: ScaleConfig): ScaleType {

  if (util.contains(['row', 'column'], channel)) {
    return 'band';
  }

  switch (fieldDef.type) {
    case 'nominal':
      if (channel === 'color' || rangeType(channel) === 'discrete') {
        return 'ordinal';
      }
      return discreteToContinuousType(channel, mark, hasTopLevelSize, specifiedRangeStep, scaleConfig);

    case 'ordinal':
      if (channel === 'color') {
        return 'ordinal';
      } else if (rangeType(channel) === 'discrete') {
        log.warn(log.message.discreteChannelCannotEncode(channel, 'ordinal'));
        return 'ordinal';
      }
      return discreteToContinuousType(channel, mark, hasTopLevelSize, specifiedRangeStep, scaleConfig);

    case 'temporal':
      if (channel === 'color') {
        // Always use `sequential` as the default color scale for continuous data
        // since it supports both array range and scheme range.
        return 'sequential';
      } else if (rangeType(channel) === 'discrete') {
        log.warn(log.message.discreteChannelCannotEncode(channel, 'temporal'));
        // TODO: consider using quantize (equivalent to binning) once we have it
        return 'ordinal';
      }
      if (isDiscreteByDefault(fieldDef.timeUnit)) {
        return discreteToContinuousType(channel, mark, hasTopLevelSize, specifiedRangeStep, scaleConfig);
      }
      return 'time';

    case 'quantitative':
      if (channel === 'color') {
        if (fieldDef.bin) {
          return 'bin-ordinal';
        }
        // Use `sequential` as the default color scale for continuous data
        // since it supports both array range and scheme range.
        return 'sequential';
      } else if (rangeType(channel) === 'discrete') {
        log.warn(log.message.discreteChannelCannotEncode(channel, 'quantitative'));
        // TODO: consider using quantize (equivalent to binning) once we have it
        return 'ordinal';
      }

      if (fieldDef.bin) {
        return 'bin-linear';
      }
      return 'linear';
  }

  /* istanbul ignore next: should never reach this */
  throw new Error(log.message.invalidFieldType(fieldDef.type));
}

/**
 * Determines default scale type for nominal/ordinal field.
 * @returns BAND or POINT scale based on channel, mark, and rangeStep
 */
function discreteToContinuousType(
    channel: Channel, mark: Mark, hasTopLevelSize: boolean,
    specifiedRangeStep: number, scaleConfig: ScaleConfig): ScaleType {

  if (util.contains(['x', 'y'], channel)) {
    if (mark === 'rect') {
      // The rect mark should fit into a band.
      return 'band';
    }
    if (mark === 'bar') {
      // For bar, use band only if there is no rangeStep since we need to use band for fit mode.
      // However, for non-fit mode, point scale provides better center position.
      if (haveRangeStep(hasTopLevelSize, specifiedRangeStep, scaleConfig)) {
        return 'point';
      }
      return 'band';
    }
  }
  // Otherwise, use ordinal point scale so we can easily get center positions of the marks.
  return 'point';
}

function haveRangeStep(hasTopLevelSize: boolean, specifiedRangeStep: number, scaleConfig: ScaleConfig) {
  if (hasTopLevelSize) {
    // if topLevelSize is provided, rangeStep will be dropped.
    return false;
  }
  if (specifiedRangeStep !== undefined) {
    return specifiedRangeStep !== null;
  }
  return !!scaleConfig.rangeStep;
}
