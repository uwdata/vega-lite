import {Axis, AXIS_PROPERTIES, AxisEncoding, VG_AXIS_PROPERTIES} from '../../axis';
import {Channel, SPATIAL_SCALE_CHANNELS, SpatialScaleChannel} from '../../channel';
import {ResolveMode} from '../../resolve';
import {Dict, keys, some} from '../../util';
import {AxisOrient} from '../../vega.schema';
import {VgAxis, VgAxisEncode} from '../../vega.schema';
import {LayerModel} from '../layer';
import {defaultTieBreaker, Explicit, mergeValuesWithExplicit, Split} from '../split';
import {UnitModel} from '../unit';
import {AxisComponent, AxisComponentIndex, AxisComponentPart} from './component';
import * as encode from './encode';
import * as rules from './rules';

type AxisPart = keyof AxisEncoding;
const AXIS_PARTS: AxisPart[] = ['domain', 'grid', 'labels', 'ticks', 'title'];

export function parseUnitAxis(model: UnitModel): AxisComponentIndex {
  return SPATIAL_SCALE_CHANNELS.reduce(function(axis, channel) {
    if (model.axis(channel)) {
      const axisComponent: AxisComponent = {};
      // TODO: support multiple axis
      const main = parseMainAxis(channel, model);
      if (main && isVisibleAxis(main)) {
        axisComponent.main = main;
      }

      const grid = parseGridAxis(channel, model);
      if (grid && isVisibleAxis(grid)) {
        axisComponent.grid = grid;
      }

      axis[channel] = [axisComponent];
    }
    return axis;
  }, {} as AxisComponentIndex);
}

const OPPOSITE_ORIENT: {[K in AxisOrient]: AxisOrient} = {
  bottom: 'top',
  top: 'bottom',
  left: 'right',
  right: 'left'
};
export function parseLayerAxis(model: LayerModel) {
  const axisComponents: AxisComponentIndex = model.component.axes = {};

  const axisResolveIndex: {[k in SpatialScaleChannel]?: ResolveMode} = {};
  const axisCount: {[k in AxisOrient]: number} = {top: 0, bottom: 0, right: 0, left: 0};

  for (const child of model.children) {
    child.parseAxisAndHeader();


    keys(child.component.axes).forEach((channel: SpatialScaleChannel) => {
      if (model.resolve[channel].axis === 'shared' &&
          axisResolveIndex[channel] !== 'independent' &&
          model.component.scales[channel]) {
        // If default rule says shared and so far there is no conflict and the scale is merged,
        // We will try to merge and see if there is a conflict

        axisComponents[channel] = mergeAxisComponents(axisComponents[channel], child.component.axes[channel]);

        if (axisComponents[channel]) {
          // If merge return something, then there is no conflict.
          // Thus, we can set / preserve the resolve index to be shared.
          axisResolveIndex[channel] = 'shared';
        } else {
          // If merge returns nothing, there is a conflict and thus we cannot make the axis shared.
          axisResolveIndex[channel] = 'independent';
          delete axisComponents[channel];
        }
      } else {
        axisResolveIndex[channel] = 'independent';
      }
    });
  }

  // Move axes to layer's axis component and merge shared axes
  keys(axisResolveIndex).forEach((channel: SpatialScaleChannel) => {
    for (const child of model.children) {
      if (!child.component.axes[channel]) {
        // skip if the child does not have a particular axis
        return;
      }

      if (axisResolveIndex[channel] === 'independent') {
        // If axes are independent, concat the axisComponent array.
        axisComponents[channel] = (axisComponents[channel] || []).concat(child.component.axes[channel]);

        // Automatically adjust orient
        child.component.axes[channel].forEach(axisComponent => {
          const {value: orient, explicit} = axisComponent.main.getWithExplicit('orient');
          if (axisCount[orient] > 0 && !explicit) {
            // Change axis orient if the number do not match
            const oppositeOrient = OPPOSITE_ORIENT[orient];
            if (axisCount[orient] > axisCount[oppositeOrient]) {
              axisComponent.main.set('orient', oppositeOrient,  false);
            }
          }
          axisCount[orient]++;

          // TODO: automaticaly add extra offset?
        });
      }

      // After merging, make sure to remove axes from child
      delete child.component.axes[channel];
    }
  });
}

function mergeAxisComponents(mergedAxisCmpts: AxisComponent[], childAxisCmpts: AxisComponent[]): AxisComponent[] {
  if (mergedAxisCmpts) {
    if (mergedAxisCmpts.length !== childAxisCmpts.length) {
      return undefined; // Cannot merge axis component with different number of axes.
    }
    const length = mergedAxisCmpts.length;
    for (let i = 0; i < length ; i++) {
      const mergedMain = mergedAxisCmpts[i].main;
      const childMain = childAxisCmpts[i].main;

      if ((!!mergedMain) !== (!!childMain)) {
        return undefined;
      } else if (mergedMain && childMain) {
        const mergedOrient = mergedMain.get('orient');
        const childOrient = childMain.get('orient');

        if (mergedOrient === childOrient) {
          mergedAxisCmpts[i].main = mergeAxisComponentPart(mergedMain, childMain);
        } else {
          // TODO: throw warning if resolve is explicit (We don't have info about explicit/implicit resolve yet.)
          // Cannot merge due to inconsistent orient
          return undefined;
        }
      }

      const mergedGrid = mergedAxisCmpts[i].grid;
      const childGrid = childAxisCmpts[i].grid;
      if ((!!mergedGrid) !== (!!childGrid)) {
        return undefined;
      } else if (mergedGrid && childGrid) {
        mergedAxisCmpts[i].grid = mergeAxisComponentPart(mergedGrid, childGrid);
      }
    }
  } else {
    // For first one, return a copy of the child
    return childAxisCmpts.map(axisComponent => ({
      ...(axisComponent.main ? {main: axisComponent.main.clone()} : {}),
      ...(axisComponent.grid ? {grid: axisComponent.grid.clone()} : {})
    }));
  }
  return mergedAxisCmpts;
}

function mergeAxisComponentPart(merged: AxisComponentPart, child: AxisComponentPart): AxisComponentPart {
  for (const prop of VG_AXIS_PROPERTIES) {
    const mergedValueWithExplicit = mergeValuesWithExplicit<VgAxis, any>(
      merged.getWithExplicit(prop),
      child.getWithExplicit(prop),
      prop, 'axis',

      // Tie breaker function
      (v1: Explicit<any>, v2: Explicit<any>) => {
        switch (prop) {
          case 'title':
            // merge title
            return {
              explicit: v1.explicit, // keep the old explicit
              value: v1.value === v2.value ?
                v1.value : // if title is the same just use one of them
                v1.value + ', ' + v2.value // join title with comma if different
            };
          case 'gridScale':
            return {
              explicit: v1.explicit, // keep the old explicit
              value: v1.value || v2.value
            };
        }
        return defaultTieBreaker<VgAxis, any>(v1, v2, prop, 'axis');
      }
    );
    merged.setWithExplicit(prop, mergedValueWithExplicit);
  }
  return merged;
}

function isFalseOrNull(v: boolean | null) {
  return v === false || v === null;
}

/**
 * Return if an axis is visible (shows at least one part of the axis).
 */
function isVisibleAxis(axis: AxisComponentPart) {
  return some(AXIS_PARTS, (part) => hasAxisPart(axis, part));
}

function hasAxisPart(axis: AxisComponentPart, part: AxisPart) {
  // FIXME(https://github.com/vega/vega-lite/issues/2552) this method can be wrong if users use a Vega theme.

  if (part === 'axis') {
    return true;
  }

  if (part === 'grid' || part === 'title') {
    return !!axis.get(part);
  }
  // Other parts are enabled by default, so they should not be false or null.
  return !isFalseOrNull(axis.get(part));
}

/**
 * Make an inner axis for showing grid for shared axis.
 */
export function parseGridAxis(channel: SpatialScaleChannel, model: UnitModel): AxisComponentPart {
  // FIXME: support adding ticks for grid axis that are inner axes of faceted plots.
  return parseAxis(channel, model, true);
}

export function parseMainAxis(channel: SpatialScaleChannel, model: UnitModel): AxisComponentPart {
  return parseAxis(channel, model, false);
}

function parseAxis(channel: SpatialScaleChannel, model: UnitModel, isGridAxis: boolean): AxisComponentPart {
  const axis = model.axis(channel);

  const axisComponent = new AxisComponentPart(
    {},
    {scale: model.scaleName(channel)} // implicit
  );

  // 1.2. Add properties
  AXIS_PROPERTIES.forEach(function(property) {
    const value = getSpecifiedOrDefaultValue(property, axis, channel, model, isGridAxis);
    if (value !== undefined) {
      const explicit = property === 'values' ?
        !!axis.values :  // specified axis.values is already respected, but may get transformed.
        value === axis[property];

      axisComponent.set(property, value, explicit);
    }
  });

  // Special case for gridScale since gridScale is not a Vega-Lite Axis property.
  const gridScale = rules.gridScale(model, channel, isGridAxis);
  if (gridScale !== undefined) {
    axisComponent.set('gridScale', gridScale, false);
  }

  // 2) Add guide encode definition groups

  const axisEncoding = axis.encoding || {};
  const axisEncode = AXIS_PARTS.reduce((e: VgAxisEncode, part) => {
    if (!hasAxisPart(axisComponent, part)) {
      // No need to create encode for a disabled part.
      return e;
    }

    const value = part === 'labels' ?
      encode.labels(model, channel, axisEncoding.labels || {}, axisComponent) :
      axisEncoding[part] || {};

    if (value !== undefined && keys(value).length > 0) {
      e[part] = {update: value};
    }
    return e;
  }, {} as VgAxisEncode);

  // FIXME: By having encode as one property, we won't have fine grained encode merging.
  if (keys(axisEncode).length > 0) {
    axisComponent.set('encode', axisEncode, !!axis.encoding || !!axis.labelAngle);
  }

  return axisComponent;
}

function getSpecifiedOrDefaultValue<K extends keyof (Axis|VgAxis)>(property: K, specifiedAxis: Axis, channel: SpatialScaleChannel, model: UnitModel, isGridAxis: boolean): VgAxis[K] {
  const fieldDef = model.fieldDef(channel);

  switch (property) {
    case 'labels':
      return isGridAxis ? false : specifiedAxis.labels;
    case 'labelOverlap':
      return rules.labelOverlap(fieldDef, specifiedAxis, channel, isGridAxis);  // TODO: scaleType
    case 'domain':
      return rules.domain(property, specifiedAxis, isGridAxis, channel);
    case 'ticks':
      return rules.ticks(property, specifiedAxis, isGridAxis, channel);
    case 'format':
      return rules.format(specifiedAxis, fieldDef, model.config);
    case 'grid':
      return rules.grid(model, channel, isGridAxis); // FIXME: refactor this
    case 'orient':
      return rules.orient(specifiedAxis, channel);
    case 'tickCount':
      return rules.tickCount(specifiedAxis, channel, fieldDef); // TODO: scaleType
    case 'title':
      return rules.title(specifiedAxis, fieldDef, model.config, isGridAxis);
    case 'values':
      return rules.values(specifiedAxis, model, fieldDef);
    case 'zindex':
      return rules.zindex(specifiedAxis, isGridAxis);
  }
  // Otherwise, return specified property.
  return specifiedAxis[property];
}
