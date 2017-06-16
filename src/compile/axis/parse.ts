import {Axis, AXIS_PROPERTIES, AxisEncoding} from '../../axis';
import {Channel, SpatialScaleChannel} from '../../channel';
import {VgAxis} from '../../vega.schema';

import * as encode from './encode';
import * as rules from './rules';

import {Dict, keys, some} from '../../util';
import {UnitModel} from '../unit';
import {AxisComponent, AxisComponentIndex} from './component';

type AxisPart = keyof AxisEncoding;
const AXIS_PARTS: AxisPart[] = ['domain', 'grid', 'labels', 'ticks', 'title'];

export function parseAxisComponent(model: UnitModel, axisChannels: SpatialScaleChannel[]): AxisComponentIndex {
  return axisChannels.reduce(function(axis, channel) {
    const axisComponent: AxisComponent = {axes:[], gridAxes: []};
    if (model.axis(channel)) {
      // TODO: support multiple axis
      const main = parseMainAxis(channel, model);
      if (main && isVisibleAxis(main)) {
        axisComponent.axes.push(main);
      }

      const grid = parseGridAxis(channel, model);
      if (grid && isVisibleAxis(grid)) {
        axisComponent.gridAxes.push(grid);
      }

      axis[channel] = axisComponent;
    }
    return axis;
  }, {});
}

function isFalseOrNull(v: boolean | null) {
  return v === false || v === null;
}

/**
 * Return if an axis is visible (shows at least one part of the axis).
 */
function isVisibleAxis(axis: VgAxis) {
  return some(AXIS_PARTS, (part) => hasAxisPart(axis, part));
}

function hasAxisPart(axis: VgAxis, part: AxisPart) {
  // FIXME this method can be wrong if users use a Vega theme.
  // (Not sure how to correctly handle that yet.).

  if (part === 'grid' || part === 'title') {
    return !!axis[part];
  }
  // Other parts are enabled by default, so they should not be false or null.
  return !isFalseOrNull(axis[part]);
}

/**
 * Make an inner axis for showing grid for shared axis.
 */
export function parseGridAxis(channel: SpatialScaleChannel, model: UnitModel): VgAxis {
  // FIXME: support adding ticks for grid axis that are inner axes of faceted plots.
  return parseAxis(channel, model, true);
}

export function parseMainAxis(channel: SpatialScaleChannel, model: UnitModel) {
  return parseAxis(channel, model, false);
}

function parseAxis(channel: SpatialScaleChannel, model: UnitModel, isGridAxis: boolean): VgAxis {
  const axis = model.axis(channel);

  const vgAxis: VgAxis = {
    scale: model.scaleName(channel)
  };

  // 1.2. Add properties
  AXIS_PROPERTIES.forEach(function(property) {
    const value = getSpecifiedOrDefaultValue(property, axis, channel, model, isGridAxis);
    if (value !== undefined) {
      vgAxis[property] = value;
    }
  });

  // Special case for gridScale since gridScale is not a Vega-Lite Axis property.
  const gridScale = getSpecifiedOrDefaultValue('gridScale', axis, channel, model, isGridAxis);
  if (gridScale !== undefined) {
      vgAxis.gridScale = gridScale;
  }

  // 2) Add guide encode definition groups

  const axisEncoding = axis.encoding || {};
  AXIS_PARTS.forEach(function(part) {
    if (!hasAxisPart(vgAxis, part)) {
      // No need to create encode for a disabled part.
      return;
    }
    // TODO(@yuhanlu): instead of calling encode[part], break this line based on part type
    // as different require different parameters.
    let value;
    if (part === 'labels') {
      value = encode.labels(model, channel, axisEncoding.labels || {}, vgAxis);
    } else {
      value = axisEncoding[part] || {};
    }

    if (value !== undefined && keys(value).length > 0) {
      vgAxis.encode = vgAxis.encode || {};
      vgAxis.encode[part] = {update: value};
    }
  });

  return vgAxis;
}

function getSpecifiedOrDefaultValue(property: keyof VgAxis, specifiedAxis: Axis, channel: SpatialScaleChannel, model: UnitModel, isGridAxis: boolean) {
  const fieldDef = model.fieldDef(channel);

  switch (property) {
    case 'labels':
      return isGridAxis ? false : specifiedAxis[property];
    case 'domain':
      return rules.domain(property, specifiedAxis, isGridAxis, channel);
    case 'ticks':
      return rules.ticks(property, specifiedAxis, isGridAxis, channel);
    case 'format':
      return rules.format(specifiedAxis, channel, fieldDef, model.config);
    case 'grid':
      return rules.grid(model, channel, isGridAxis); // FIXME: refactor this
    case 'gridScale':
      return rules.gridScale(model, channel, isGridAxis);
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
