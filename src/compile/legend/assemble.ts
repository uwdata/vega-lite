import {Legend as VgLegend, LegendEncode} from 'vega';
import {LEGEND_SCALE_CHANNELS, SIGNAL_LEGEND_PROP_INDEX} from '../../legend';
import {keys, stringify, vals} from '../../util';
import {isSignalRef, VgEncodeChannel, VgValueRef} from '../../vega.schema';
import {Model} from '../model';
import {LegendComponent} from './component';
import {mergeLegendComponent} from './parse';

function setLegendEncode(
  legend: VgLegend,
  part: keyof LegendEncode,
  vgProp: VgEncodeChannel,
  vgRef: VgValueRef | VgValueRef[]
) {
  legend.encode = legend.encode ?? {};
  legend.encode[part] = legend.encode[part] ?? {};
  legend.encode[part].update = legend.encode[part].update ?? {};
  // TODO: remove as any after https://github.com/prisma/nexus-prisma/issues/291
  (legend.encode[part].update[vgProp] as any) = vgRef;
}

export function assembleLegends(model: Model): VgLegend[] {
  const legendComponentIndex = model.component.legends;
  const legendByDomain: Record<string, LegendComponent[]> = {};

  for (const channel of keys(legendComponentIndex)) {
    const scaleComponent = model.getScaleComponent(channel);
    const domainHash = stringify(scaleComponent.get('domains'));
    if (legendByDomain[domainHash]) {
      for (const mergedLegendComponent of legendByDomain[domainHash]) {
        const merged = mergeLegendComponent(mergedLegendComponent, legendComponentIndex[channel]);
        if (!merged) {
          // If cannot merge, need to add this legend separately
          legendByDomain[domainHash].push(legendComponentIndex[channel]);
        }
      }
    } else {
      legendByDomain[domainHash] = [legendComponentIndex[channel].clone()];
    }
  }

  return vals(legendByDomain)
    .flat()
    .map(assembleLegend)
    .filter(l => l !== undefined);
}

export function assembleLegend(legendCmpt: LegendComponent) {
  const {disable, labelExpr, selections, ...legend} = legendCmpt.combine();

  if (disable) {
    return undefined;
  }

  if (legend.encode?.symbols) {
    const out = legend.encode.symbols.update;
    if (out.fill && out.fill['value'] !== 'transparent' && !out.stroke && !legend.stroke) {
      // For non color channel's legend, we need to override symbol stroke config from Vega config if stroke channel is not used.
      out.stroke = {value: 'transparent'};
    }

    // Remove properties that the legend is encoding.
    for (const property of LEGEND_SCALE_CHANNELS) {
      if (legend[property]) {
        delete out[property];
      }
    }
  }

  if (!legend.title) {
    // title schema doesn't include null, ''
    delete legend.title;
  }

  if (labelExpr !== undefined) {
    setLegendEncode(legend, 'labels', 'text', {signal: labelExpr});
  }

  for (const prop in legend) {
    const propValue = legend[prop];
    if (isSignalRef(propValue)) {
      const propIndex = SIGNAL_LEGEND_PROP_INDEX[prop];
      if (propIndex) {
        const {vgProp, part} = propIndex;
        setLegendEncode(legend, part, vgProp, propValue);
        delete legend[prop];
      }
    }
  }

  return legend;
}
