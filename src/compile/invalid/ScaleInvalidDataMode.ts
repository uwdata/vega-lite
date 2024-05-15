import {SignalRef} from 'vega';
import {ScaleChannel} from '../../channel';
import {Config} from '../../config';
import {MarkInvalidDataMode} from '../../invalid';
import {MarkDef, isPathMark} from '../../mark';
import {ScaleType, hasContinuousDomain} from '../../scale';
import {getMarkPropOrConfig} from '../common';
import {normalizeInvalidDataMode} from './normalizeInvalidDataMode';

export type ScaleInvalidDataMode =
  // remove 'break-paths-and-keep-path-domains' from MarkInvalidDataMode
  // because it is a macro for '"filter"' or `"break-path-keep-domains`
  | Omit<MarkInvalidDataMode, 'break-paths-and-keep-path-domains'>

  // Add always-valid because at scale level, categorical scales can handle any values and thus is always valid.
  | 'always-valid';

export function getScaleInvalidDataMode<C extends ScaleChannel>({
  markDef,
  config,
  scaleChannel,
  scaleType,
  isCountAggregate
}: {
  markDef: MarkDef;
  config: Config<SignalRef>;
  scaleChannel: C;
  scaleType: ScaleType;
  isCountAggregate: boolean;
}): ScaleInvalidDataMode {
  if (!scaleType || !hasContinuousDomain(scaleType) || isCountAggregate) {
    // - Discrete scales can always display null as another category
    // - Count cannot output null values
    return 'always-valid';
  }

  const invalidMode = normalizeInvalidDataMode(getMarkPropOrConfig('invalid', markDef, config), {
    isPath: isPathMark(markDef.type)
  });

  const scaleOutputForInvalid = config.scale?.invalid?.[scaleChannel];
  if (scaleOutputForInvalid !== undefined) {
    // Regardless of the current invalid mode, if the channel has a default value, we consider the field valid.
    return 'include';
  }

  return invalidMode;
}
export function shouldBreakPath(mode: ScaleInvalidDataMode): boolean {
  return mode === 'break-paths-filter-domains' || mode === 'break-paths-keep-domains';
}
