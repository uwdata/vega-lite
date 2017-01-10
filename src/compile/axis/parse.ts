import {Axis} from '../../axis';
import {Channel} from '../../channel';
import {VgAxis} from '../../vega.schema';

import * as encode from './encode';
import * as rules from './rules';

import {Model} from '../model';
import {Dict, contains, keys} from '../../util';

export function parseAxisComponent(model: Model, axisChannels: Channel[]): Dict<VgAxis> {
  return axisChannels.reduce(function(axis, channel) {
    if (model.axis(channel)) {
      axis[channel] = parseAxis(channel, model);
    }
    return axis;
  }, {} as Dict<VgAxis>);
}

/**
 * Make an inner axis for showing grid for shared axis.
 */
export function parseInnerAxis(channel: Channel, model: Model): VgAxis {
  // TODO: support adding ticks as well

  let def: VgAxis = {
    orient: channel === 'x' ? 'bottom' : 'left',
    scale: model.scaleName(channel),
    grid: true,
    domain: false,
    tick: false,
    label: false
  };

  const axis = model.axis(channel);

  // FIXME: audit if we have checked all relevant properties here.
  ['gridScale', 'tickCount', 'values', 'subdivide', 'zindex'].forEach(function(property) {
    let method: (model: Model, channel: Channel, def:any)=>any;

    const value = (method = rules[property]) ?
                  // calling axis.format, axis.grid, ...
                  method(model, channel, def) :
                  axis[property];
    if (value !== undefined) {
      def[property] = value;
    }
  });

  const props = model.axis(channel).encode || {};

  // For now, only need to add grid properties here because innerAxis is only for rendering grid.
  // TODO: support add other properties for innerAxis
  ['grid'].forEach(function(group) {
    const value = encode[group] ?
      encode[group](model, channel, props[group] || {}, def) :
      props[group];
    if (value !== undefined && keys(value).length > 0) {
      def.encode = def.encode || {};
      def.encode[group] = {update: value};
    }
  });

  return def;
}

const axisPartFlag = {
  domain: 'domain',
  grid: 'grid',
  labels: 'label',
  ticks: 'tick',
  title: 'title'
};

export function parseAxis(channel: Channel, model: Model) {
  return _parseAxis(channel, model, false);
}

function _parseAxis(channel: Channel, model: Model, isGridAxis: boolean): VgAxis {
  const axis = model.axis(channel);

  let def: VgAxis = {
    scale: model.scaleName(channel)
  };

  // 1.2. Add properties
  [
    // a) properties with special rules (so it has axis[property] methods) -- call rule functions
    'format', 'grid', 'gridScale', 'orient', 'tickSize', 'tickCount',  'title', 'values', 'zindex',
    // b) properties without rules, only produce default values in the schema, or explicit value if specified
    'domain', 'offset', 'subdivide', 'tick', 'tickPadding', 'tickSize', 'tickSizeEnd', 'tickSizeMajor', 'tickSizeMinor', 'titleOffset'
  ].forEach(function(property) {
    const value = getSpecifiedOrDefaultValue(property, axis, channel, model, def);
    if (value !== undefined) {
      def[property] = value;
    }
  });

  // 2) Add guide encode definition groups
  const encodeSpec = model.axis(channel).encode || {};
  [
    'domain', 'grid', 'labels', 'ticks', 'title'
  ].forEach(function(part) {
    if (contains([false, null], def[axisPartFlag[part]])) {
      // No need to create encode for a disabled part.
      return;
    }
    const value = encode[part](model, channel, encodeSpec[part] || {}, def);
    if (value !== undefined && keys(value).length > 0) {
      def.encode = def.encode || {};
      def.encode[part] = {update: value};
    }
  });

  return def;
}

function getSpecifiedOrDefaultValue(property: string, specifiedAxis: Axis, channel: Channel, model: Model, axisDef: VgAxis) {
  const fieldDef = model.fieldDef(channel);
  const config = model.config();

  switch (property) {
    case 'format':
      return rules.format(specifiedAxis, channel, fieldDef, config);
    case 'grid':
      return rules.grid(model, channel); // FIXME: refactor this
    case 'gridScale':
      return rules.gridScale(model, channel);
    case 'orient':
      return rules.orient(specifiedAxis, channel);
    case 'tickCount':
      return rules.tickCount(specifiedAxis, channel, fieldDef); // TODO: scaleType
    case 'title':
      return rules.title(specifiedAxis, fieldDef, config);
    case 'values':
      return rules.values(specifiedAxis);
    case 'zindex':
      return rules.zindex(specifiedAxis, axisDef.grid); // FIXME axis.grid might be undefined
  }
  // Otherwise, return specified property.
  return specifiedAxis[property];
}
