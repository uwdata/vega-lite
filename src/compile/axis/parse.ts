import {AxisEncode as VgAxisEncode, AxisOrient, Orient, ScaleType, SignalRef} from 'vega';
import {Axis, AXIS_PARTS, isAxisProperty, isConditionalAxisValue} from '../../axis';
import {isBinned} from '../../bin';
import {PositionScaleChannel, POSITION_SCALE_CHANNELS, X, Y} from '../../channel';
import {
  getFieldOrDatumDef,
  isFieldDef,
  isFieldDefWithCustomTimeFormat as isFieldOrDatumDefWithCustomTimeFormat,
  isFieldOrDatumDefForTimeFormat,
  PositionDatumDef,
  PositionFieldDef,
  toFieldDefBase
} from '../../channeldef';
import {getFirstDefined, keys, normalizeAngle} from '../../util';
import {isSignalRef} from '../../vega.schema';
import {mergeTitle, mergeTitleComponent, mergeTitleFieldDefs} from '../common';
import {numberFormat} from '../format';
import {guideEncodeEntry} from '../guide';
import {LayerModel} from '../layer';
import {parseGuideResolve} from '../resolve';
import {defaultTieBreaker, Explicit, mergeValuesWithExplicit} from '../split';
import {UnitModel} from '../unit';
import {AxisComponent, AxisComponentIndex, AxisComponentProps, AXIS_COMPONENT_PROPERTIES} from './component';
import {getAxisConfig, getAxisConfigs} from './config';
import * as encode from './encode';
import * as properties from './properties';

export function parseUnitAxes(model: UnitModel): AxisComponentIndex {
  return POSITION_SCALE_CHANNELS.reduce((axis, channel) => {
    if (model.component.scales[channel]) {
      axis[channel] = [parseAxis(channel, model)];
    }
    return axis;
  }, {} as AxisComponentIndex);
}

const OPPOSITE_ORIENT: Record<AxisOrient, AxisOrient> = {
  bottom: 'top',
  top: 'bottom',
  left: 'right',
  right: 'left'
};

export function parseLayerAxes(model: LayerModel) {
  const {axes, resolve} = model.component;
  const axisCount: Record<AxisOrient, number> = {top: 0, bottom: 0, right: 0, left: 0};

  for (const child of model.children) {
    child.parseAxesAndHeaders();

    for (const channel of keys(child.component.axes)) {
      resolve.axis[channel] = parseGuideResolve(model.component.resolve, channel);
      if (resolve.axis[channel] === 'shared') {
        // If the resolve says shared (and has not been overridden)
        // We will try to merge and see if there is a conflict

        axes[channel] = mergeAxisComponents(axes[channel], child.component.axes[channel]);

        if (!axes[channel]) {
          // If merge returns nothing, there is a conflict so we cannot make the axis shared.
          // Thus, mark axis as independent and remove the axis component.
          resolve.axis[channel] = 'independent';
          delete axes[channel];
        }
      }
    }
  }

  // Move axes to layer's axis component and merge shared axes
  for (const channel of [X, Y]) {
    for (const child of model.children) {
      if (!child.component.axes[channel]) {
        // skip if the child does not have a particular axis
        continue;
      }

      if (resolve.axis[channel] === 'independent') {
        // If axes are independent, concat the axisComponent array.
        axes[channel] = (axes[channel] ?? []).concat(child.component.axes[channel]);

        // Automatically adjust orient
        for (const axisComponent of child.component.axes[channel]) {
          const {value: orient, explicit} = axisComponent.getWithExplicit('orient');
          if (axisCount[orient] > 0 && !explicit) {
            // Change axis orient if the number do not match
            const oppositeOrient = OPPOSITE_ORIENT[orient];
            if (axisCount[orient] > axisCount[oppositeOrient]) {
              axisComponent.set('orient', oppositeOrient, false);
            }
          }
          axisCount[orient]++;

          // TODO(https://github.com/vega/vega-lite/issues/2634): automatically add extra offset?
        }
      }

      // After merging, make sure to remove axes from child
      delete child.component.axes[channel];
    }

    // Suppress grid lines for dual axis charts (https://github.com/vega/vega-lite/issues/4676)
    if (resolve.axis[channel] === 'independent' && axes[channel] && axes[channel].length > 1) {
      for (const axisCmpt of axes[channel]) {
        if (!!axisCmpt.get('grid') && !axisCmpt.explicit.grid) {
          axisCmpt.implicit.grid = false;
        }
      }
    }
  }
}

function mergeAxisComponents(
  mergedAxisCmpts: AxisComponent[],
  childAxisCmpts: readonly AxisComponent[]
): AxisComponent[] {
  if (mergedAxisCmpts) {
    // FIXME: this is a bit wrong once we support multiple axes
    if (mergedAxisCmpts.length !== childAxisCmpts.length) {
      return undefined; // Cannot merge axis component with different number of axes.
    }
    const length = mergedAxisCmpts.length;
    for (let i = 0; i < length; i++) {
      const merged = mergedAxisCmpts[i];
      const child = childAxisCmpts[i];

      if (!!merged !== !!child) {
        return undefined;
      } else if (merged && child) {
        const mergedOrient = merged.getWithExplicit('orient');
        const childOrient = child.getWithExplicit('orient');

        if (mergedOrient.explicit && childOrient.explicit && mergedOrient.value !== childOrient.value) {
          // TODO: throw warning if resolve is explicit (We don't have info about explicit/implicit resolve yet.)

          // Cannot merge due to inconsistent orient
          return undefined;
        } else {
          mergedAxisCmpts[i] = mergeAxisComponent(merged, child);
        }
      }
    }
  } else {
    // For first one, return a copy of the child
    return childAxisCmpts.map(axisComponent => axisComponent.clone());
  }
  return mergedAxisCmpts;
}

function mergeAxisComponent(merged: AxisComponent, child: AxisComponent): AxisComponent {
  for (const prop of AXIS_COMPONENT_PROPERTIES) {
    const mergedValueWithExplicit = mergeValuesWithExplicit<AxisComponentProps, any>(
      merged.getWithExplicit(prop),
      child.getWithExplicit(prop),
      prop,
      'axis',

      // Tie breaker function
      (v1: Explicit<any>, v2: Explicit<any>) => {
        switch (prop) {
          case 'title':
            return mergeTitleComponent(v1, v2);
          case 'gridScale':
            return {
              explicit: v1.explicit, // keep the old explicit
              value: getFirstDefined(v1.value, v2.value)
            };
        }
        return defaultTieBreaker<AxisComponentProps, any>(v1, v2, prop, 'axis');
      }
    );
    merged.setWithExplicit(prop, mergedValueWithExplicit);
  }
  return merged;
}

function getFieldDefTitle(model: UnitModel, channel: 'x' | 'y') {
  const channel2 = channel === 'x' ? 'x2' : 'y2';
  const fieldDef = model.fieldDef(channel);
  const fieldDef2 = model.fieldDef(channel2);

  const title1 = fieldDef ? fieldDef.title : undefined;
  const title2 = fieldDef2 ? fieldDef2.title : undefined;

  if (title1 && title2) {
    return mergeTitle(title1, title2);
  } else if (title1) {
    return title1;
  } else if (title2) {
    return title2;
  } else if (title1 !== undefined) {
    // falsy value to disable config
    return title1;
  } else if (title2 !== undefined) {
    // falsy value to disable config
    return title2;
  }

  return undefined;
}

function isExplicit<T extends string | number | boolean | object>(
  value: T,
  property: keyof AxisComponentProps,
  axis: Axis,
  model: UnitModel,
  channel: PositionScaleChannel
) {
  if (property === 'disable') {
    return axis !== undefined; // if axis is specified or null/false, then it's enable/disable state is explicit
  }

  axis = axis || {};

  switch (property) {
    case 'titleAngle':
    case 'labelAngle':
      return value === normalizeAngle(axis[property]);
    case 'values':
      return !!axis.values;
    // specified axis.values is already respected, but may get transformed.
    case 'encode':
      // both VL axis.encoding and axis.labelAngle affect VG axis.encode
      return !!axis.encoding || !!axis.labelAngle;
    case 'title':
      // title can be explicit if fieldDef.title is set
      if (value === getFieldDefTitle(model, channel)) {
        return true;
      }
  }
  // Otherwise, things are explicit if the returned value matches the specified property
  return value === axis[property];
}

/**
 * Properties to always include values from config:
 * - Grid is an exception because we need to set grid = true to generate another grid axis
 * - Orient, labelExpr, and tickCount are not axis configs in Vega, so we need to set too.
 * - translate has dependent logic for bar's bin position and it's 0.5 by default in Vega. If a config overrides this value, we need to know.
 */
const propsToAlwaysIncludeConfig = new Set(['grid', 'orient', 'tickCount', 'labelExpr', 'translate']);

function parseAxis(channel: PositionScaleChannel, model: UnitModel): AxisComponent {
  const axis = model.axis(channel);

  const axisComponent = new AxisComponent();

  const fieldOrDatumDef = getFieldOrDatumDef(model.encoding[channel]) as
    | PositionFieldDef<string>
    | PositionDatumDef<string>;

  const orient = getFirstDefined(axis?.orient, properties.orient(channel));

  const scaleType = model.getScaleComponent(channel).get('type');

  const axisConfigs = getAxisConfigs(channel, scaleType, orient, model.config);
  const labelAngle = properties.labelAngle(model, axis, channel, fieldOrDatumDef, axisConfigs);

  // 1.2. Add properties
  for (const property of AXIS_COMPONENT_PROPERTIES) {
    const value = getProperty(fieldOrDatumDef, property, axis, channel, model, scaleType, orient, labelAngle);
    const hasValue = value !== undefined;

    const explicit = isExplicit(value, property, axis, model, channel);

    if (hasValue && explicit) {
      axisComponent.set(property, value, explicit);
    } else {
      const {configValue = undefined, configFrom = undefined} = isAxisProperty(property)
        ? getAxisConfig(property, model.config, axis?.style, axisConfigs)
        : {};
      const hasConfigValue = configValue !== undefined;

      if (hasValue && !hasConfigValue) {
        // only set property if it is explicitly set or has no config value (otherwise we will accidentally override config)
        axisComponent.set(property, value, explicit);
      } else if (
        // Cases need implicit values
        // 1. Axis config that aren't available in Vega
        !(configFrom === 'vgAxisConfig') ||
        // 2. Certain properties are always included (see `propsToAlwaysIncludeConfig`'s declaration for more details)
        (propsToAlwaysIncludeConfig.has(property) && hasConfigValue) ||
        // 3. Conditional axis values and signals
        isConditionalAxisValue<any>(configValue) || // need to set "any" as TS isn't smart enough to figure the generic parameter type yet
        isSignalRef(configValue)
      ) {
        // If a config is specified and is conditional, copy conditional value from axis config
        axisComponent.set(property, configValue, false);
      }
    }
  }

  // 2) Add guide encode definition groups
  const axisEncoding = axis?.encoding ?? {};
  const axisEncode = AXIS_PARTS.reduce((e: VgAxisEncode, part) => {
    if (!axisComponent.hasAxisPart(part)) {
      // No need to create encode for a disabled part.
      return e;
    }

    const axisEncodingPart = guideEncodeEntry(axisEncoding[part] ?? {}, model);

    const value = part === 'labels' ? encode.labels(model, channel, axisEncodingPart) : axisEncodingPart;

    if (value !== undefined && keys(value).length > 0) {
      e[part] = {update: value};
    }
    return e;
  }, {} as VgAxisEncode);

  // FIXME: By having encode as one property, we won't have fine grained encode merging.
  if (keys(axisEncode).length > 0) {
    axisComponent.set('encode', axisEncode, !!axis?.encoding || axis?.labelAngle !== undefined);
  }

  return axisComponent;
}

function getProperty<K extends keyof AxisComponentProps>(
  fieldOrDatumDef: PositionFieldDef<string> | PositionDatumDef<string>,
  property: K,
  specifiedAxis: Axis,
  channel: PositionScaleChannel,
  model: UnitModel,
  scaleType: ScaleType,
  orient: Orient,
  labelAngle: number
): AxisComponentProps[K] {
  if (property === 'disable') {
    return specifiedAxis !== undefined && (!specifiedAxis as AxisComponentProps[K]);
  }

  specifiedAxis = specifiedAxis || {}; // assign object so the rest doesn't have to check if axis exists

  const {mark, config} = model;

  switch (property) {
    case 'scale':
      return model.scaleName(channel) as AxisComponentProps[K];
    case 'gridScale':
      return properties.gridScale(model, channel) as AxisComponentProps[K];
    case 'format': {
      // We don't include temporal field and custom format as we apply format in encode block
      if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef) || isFieldOrDatumDefWithCustomTimeFormat(fieldOrDatumDef)) {
        return undefined;
      }
      return numberFormat(fieldOrDatumDef.type, specifiedAxis.format, config) as AxisComponentProps[K];
    }
    case 'formatType':
      // As with format, we don't include temporal field and custom format here as we apply format in encode block
      if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef) || isFieldOrDatumDefWithCustomTimeFormat(fieldOrDatumDef)) {
        return undefined;
      }
      return specifiedAxis.formatType as AxisComponentProps[K];

    case 'grid': {
      if (isBinned(model.fieldDef(channel)?.bin)) {
        return false as AxisComponentProps[K];
      } else {
        return getFirstDefined(
          specifiedAxis.grid,
          properties.defaultGrid(scaleType, model.typedFieldDef(channel))
        ) as AxisComponentProps[K];
      }
    }
    case 'labelAlign':
      return (specifiedAxis.labelAlign ?? properties.defaultLabelAlign(labelAngle, orient)) as AxisComponentProps[K];

    case 'labelAngle':
      return labelAngle as AxisComponentProps[K];

    case 'labelBaseline':
      return (specifiedAxis.labelBaseline ??
        properties.defaultLabelBaseline(labelAngle, orient)) as AxisComponentProps[K];

    case 'labelFlush':
      return getFirstDefined(
        specifiedAxis.labelFlush,
        properties.defaultLabelFlush(fieldOrDatumDef.type, channel)
      ) as AxisComponentProps[K];
    case 'labelOverlap': {
      return getFirstDefined(
        specifiedAxis.labelOverlap,
        properties.defaultLabelOverlap(fieldOrDatumDef.type, scaleType)
      ) as AxisComponentProps[K];
    }
    case 'orient':
      return orient as AxisComponentProps[K];

    case 'tickCount': {
      const sizeType = channel === 'x' ? 'width' : channel === 'y' ? 'height' : undefined;
      const size = sizeType ? model.getSizeSignalRef(sizeType) : undefined;
      return getFirstDefined<number | SignalRef>(
        specifiedAxis.tickCount,
        properties.defaultTickCount({fieldOrDatumDef, scaleType, size, values: specifiedAxis.values})
      ) as AxisComponentProps[K];
    }
    case 'title': {
      if (specifiedAxis.title !== undefined) {
        return specifiedAxis.title as AxisComponentProps[K];
      }
      const fieldDefTitle = getFieldDefTitle(model, channel);
      if (fieldDefTitle !== undefined) {
        return fieldDefTitle as AxisComponentProps[K];
      }
      const fieldDef = model.typedFieldDef(channel);
      const channel2 = channel === 'x' ? 'x2' : 'y2';
      const fieldDef2 = model.fieldDef(channel2);

      // If title not specified, store base parts of fieldDef (and fieldDef2 if exists)
      return mergeTitleFieldDefs(
        fieldDef ? [toFieldDefBase(fieldDef)] : [],
        isFieldDef(fieldDef2) ? [toFieldDefBase(fieldDef2)] : []
      ) as AxisComponentProps[K];
    }
    case 'values':
      return properties.values(specifiedAxis, fieldOrDatumDef) as AxisComponentProps[K];
    case 'zindex':
      return getFirstDefined(
        specifiedAxis.zindex,
        properties.defaultZindex(mark, fieldOrDatumDef)
      ) as AxisComponentProps[K];
  }
  // Otherwise, return specified property.
  return isAxisProperty(property) ? (specifiedAxis[property] as AxisComponentProps[K]) : undefined;
}
