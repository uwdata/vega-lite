import {Legend as VgLegend, LegendEncode, SignalRef} from 'vega';
import {COLOR, FILLOPACITY, NonPositionScaleChannel, SHAPE, STROKEOPACITY} from '../../channel';
import {
  DatumDef,
  FieldDef,
  getFieldOrDatumDef,
  isFieldDef,
  isFieldOrDatumDefForTimeFormat,
  MarkPropDatumDef,
  MarkPropFieldDef,
  title as fieldDefTitle
} from '../../channeldef';
import {Legend, LEGEND_SCALE_CHANNELS} from '../../legend';
import {normalizeTimeUnit} from '../../timeunit';
import {GEOJSON} from '../../type';
import {deleteNestedProperty, getFirstDefined, keys, varName} from '../../util';
import {mergeTitleComponent} from '../common';
import {numberFormat} from '../format';
import {guideEncodeEntry} from '../guide';
import {isUnitModel, Model} from '../model';
import {parseGuideResolve} from '../resolve';
import {parseInteractiveLegend} from '../selection/transforms/legends';
import {defaultTieBreaker, Explicit, makeImplicit, mergeValuesWithExplicit} from '../split';
import {UnitModel} from '../unit';
import {LegendComponent, LegendComponentIndex, LegendComponentProps, LEGEND_COMPONENT_PROPERTIES} from './component';
import * as encode from './encode';
import * as properties from './properties';
import {direction, type} from './properties';

export function parseLegend(model: Model) {
  if (isUnitModel(model)) {
    model.component.legends = parseUnitLegend(model);
  } else {
    model.component.legends = parseNonUnitLegend(model);
  }
}

function parseUnitLegend(model: UnitModel): LegendComponentIndex {
  const {encoding} = model;

  const legendComponent: LegendComponentIndex = {};

  for (const channel of [COLOR, ...LEGEND_SCALE_CHANNELS, FILLOPACITY, STROKEOPACITY]) {
    const def = getFieldOrDatumDef(encoding[channel]) as MarkPropFieldDef<string> | MarkPropDatumDef<string>;

    if (!def || !model.getScaleComponent(channel)) {
      continue;
    }

    if (channel === SHAPE && isFieldDef(def) && def.type === GEOJSON) {
      continue;
    }

    legendComponent[channel] = parseLegendForChannel(model, channel);
  }

  return legendComponent;
}

function getLegendDefWithScale(model: UnitModel, channel: NonPositionScaleChannel): VgLegend {
  const scale = model.scaleName(channel);
  if (model.mark === 'trail') {
    if (channel === 'color') {
      // trail is a filled mark, but its default symbolType ("stroke") should use "stroke"
      return {stroke: scale};
    } else if (channel === 'size') {
      return {strokeWidth: scale};
    }
  }

  if (channel === 'color') {
    return model.markDef.filled ? {fill: scale} : {stroke: scale};
  }
  return {[channel]: scale};
}

function isExplicit<T extends string | number | object | boolean>(
  value: T,
  property: keyof LegendComponentProps,
  legend: Legend,
  fieldDef: FieldDef<string>
) {
  switch (property) {
    case 'disable':
      return legend !== undefined; // if axis is specified or null/false, then it's enable/disable state is explicit

    case 'values':
      // specified legend.values is already respected, but may get transformed.
      return !!legend?.values;
    case 'title':
      // title can be explicit if fieldDef.title is set
      if (property === 'title' && value === fieldDef?.title) {
        return true;
      }
  }
  // Otherwise, things are explicit if the returned value matches the specified property
  return value === (legend || {})[property];
}

export function parseLegendForChannel(model: UnitModel, channel: NonPositionScaleChannel): LegendComponent {
  const legend = model.legend(channel);

  const legendCmpt = new LegendComponent({}, getLegendDefWithScale(model, channel));
  parseInteractiveLegend(model, channel, legendCmpt);

  for (const property of LEGEND_COMPONENT_PROPERTIES) {
    const value = getProperty(property, legend, channel, model);
    if (value !== undefined) {
      const explicit = isExplicit(value, property, legend, model.fieldDef(channel));
      if (explicit || model.config.legend[property] === undefined) {
        legendCmpt.set(property, value, explicit);
      }
    }
  }

  const legendEncoding = legend?.encoding ?? {};
  const selections = legendCmpt.get('selections');
  const legendEncode: LegendEncode = {};

  for (const part of ['labels', 'legend', 'title', 'symbols', 'gradient', 'entries']) {
    const legendEncodingPart = guideEncodeEntry(legendEncoding[part] ?? {}, model);

    const fieldOrDatumDef = getFieldOrDatumDef(model.encoding[channel]);

    const value = encode[part]
      ? encode[part](fieldOrDatumDef, legendEncodingPart, model, channel, legendCmpt) // apply rule
      : legendEncodingPart; // no rule -- just default values

    if (value !== undefined && keys(value).length > 0) {
      legendEncode[part] = {
        ...(selections?.length && isFieldDef(fieldOrDatumDef)
          ? {name: `${varName(fieldOrDatumDef.field)}_legend_${part}`}
          : {}),
        ...(selections?.length ? {interactive: !!selections} : {}),
        update: value
      };
    }
  }

  if (keys(legendEncode).length > 0) {
    legendCmpt.set('encode', legendEncode, !!legend?.encoding);
  }

  return legendCmpt;
}

function getProperty<K extends keyof LegendComponentProps>(
  property: K,
  legend: Legend,
  channel: NonPositionScaleChannel,
  model: UnitModel
): LegendComponentProps[K] {
  if (property === 'disable') {
    return legend !== undefined && (!legend as LegendComponentProps[K]);
  }
  legend = legend || {}; // assign object so the rest doesn't have to check if legend exists

  const {encoding, mark} = model;
  const fieldOrDatumDef = getFieldOrDatumDef(encoding[channel]) as MarkPropFieldDef<string> | DatumDef;
  const legendConfig = model.config.legend;
  const timeUnit = isFieldDef(fieldOrDatumDef) ? normalizeTimeUnit(fieldOrDatumDef.timeUnit)?.unit : undefined;

  const scaleType = model.getScaleComponent(channel).get('type');

  switch (property) {
    // TODO: enable when https://github.com/vega/vega/issues/1351 is fixed
    // case 'clipHeight':
    //   return getFirstDefined(specifiedLegend.clipHeight, properties.clipHeight(properties.type(...)));

    case 'direction':
      return direction({
        legend,
        legendConfig,
        timeUnit,
        channel,
        scaleType
      }) as LegendComponentProps[K];

    case 'format':
      // We don't include temporal field here as we apply format in encode block
      if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef)) {
        return undefined;
      }
      return numberFormat(fieldOrDatumDef.type, legend.format, model.config) as LegendComponentProps[K];

    case 'formatType':
      // As with format, we don't include temporal field here as we apply format in encode block
      if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef)) {
        return undefined;
      }
      return legend.formatType as LegendComponentProps[K];

    case 'gradientLength':
      return getFirstDefined<number | SignalRef>(
        // do specified gradientLength first
        legend.gradientLength,
        legendConfig.gradientLength,
        // Otherwise, use smart default based on plot height
        properties.defaultGradientLength({
          model,
          legend,
          legendConfig,
          channel,
          scaleType
        })
      ) as LegendComponentProps[K];

    case 'labelOverlap':
      return getFirstDefined(legend.labelOverlap, properties.defaultLabelOverlap(scaleType)) as LegendComponentProps[K];

    case 'symbolType':
      return getFirstDefined(
        legend.symbolType,
        properties.defaultSymbolType(mark, channel, encoding.shape, model.markDef.shape)
      ) as LegendComponentProps[K];

    case 'title':
      return fieldDefTitle(fieldOrDatumDef, model.config, {allowDisabling: true}) as LegendComponentProps[K];

    case 'type':
      return type({legend, channel, timeUnit, scaleType, alwaysReturn: false}) as LegendComponentProps[K];

    case 'values':
      return properties.values(legend, fieldOrDatumDef) as LegendComponentProps[K];
  }

  // Otherwise, return specified property.
  return (legend as LegendComponentProps)[property];
}

function parseNonUnitLegend(model: Model) {
  const {legends, resolve} = model.component;

  for (const child of model.children) {
    parseLegend(child);

    for (const channel of keys(child.component.legends)) {
      resolve.legend[channel] = parseGuideResolve(model.component.resolve, channel);

      if (resolve.legend[channel] === 'shared') {
        // If the resolve says shared (and has not been overridden)
        // We will try to merge and see if there is a conflict

        legends[channel] = mergeLegendComponent(legends[channel], child.component.legends[channel]);

        if (!legends[channel]) {
          // If merge returns nothing, there is a conflict so we cannot make the legend shared.
          // Thus, mark legend as independent and remove the legend component.
          resolve.legend[channel] = 'independent';
          delete legends[channel];
        }
      }
    }
  }

  for (const channel of keys(legends)) {
    for (const child of model.children) {
      if (!child.component.legends[channel]) {
        // skip if the child does not have a particular legend
        continue;
      }

      if (resolve.legend[channel] === 'shared') {
        // After merging shared legend, make sure to remove legend from child
        delete child.component.legends[channel];
      }
    }
  }

  return legends;
}

export function mergeLegendComponent(mergedLegend: LegendComponent, childLegend: LegendComponent): LegendComponent {
  if (!mergedLegend) {
    return childLegend.clone();
  }
  const mergedOrient = mergedLegend.getWithExplicit('orient');
  const childOrient = childLegend.getWithExplicit('orient');

  if (mergedOrient.explicit && childOrient.explicit && mergedOrient.value !== childOrient.value) {
    // TODO: throw warning if resolve is explicit (We don't have info about explicit/implicit resolve yet.)
    // Cannot merge due to inconsistent orient
    return undefined;
  }

  let typeMerged = false;
  // Otherwise, let's merge
  for (const prop of LEGEND_COMPONENT_PROPERTIES) {
    const mergedValueWithExplicit = mergeValuesWithExplicit<LegendComponentProps, any>(
      mergedLegend.getWithExplicit(prop),
      childLegend.getWithExplicit(prop),
      prop,
      'legend',

      // Tie breaker function
      (v1: Explicit<any>, v2: Explicit<any>): any => {
        switch (prop) {
          case 'symbolType':
            return mergeSymbolType(v1, v2);
          case 'title':
            return mergeTitleComponent(v1, v2);
          case 'type':
            // There are only two types. If we have different types, then prefer symbol over gradient.
            typeMerged = true;
            return makeImplicit('symbol');
        }
        return defaultTieBreaker<LegendComponentProps, any>(v1, v2, prop, 'legend');
      }
    );
    mergedLegend.setWithExplicit(prop, mergedValueWithExplicit);
  }
  if (typeMerged) {
    if (mergedLegend.implicit?.encode?.gradient ?? {}) {
      deleteNestedProperty(mergedLegend.implicit, ['encode', 'gradient']);
    }
    if (mergedLegend.explicit?.encode?.gradient ?? {}) {
      deleteNestedProperty(mergedLegend.explicit, ['encode', 'gradient']);
    }
  }

  return mergedLegend;
}

function mergeSymbolType(st1: Explicit<string>, st2: Explicit<string>) {
  if (st2.value === 'circle') {
    // prefer "circle" over "stroke"
    return st2;
  }
  return st1;
}
