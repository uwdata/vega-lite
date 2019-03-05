import {AxisOrient} from 'vega';
import {FACET_CHANNELS, FacetChannel} from '../../channel';
import {title as fieldDefTitle} from '../../fielddef';
import {assembleAxis} from '../axis/assemble';
import {FacetModel} from '../facet';
import {parseGuideResolve} from '../resolve';
import {HeaderChannel, HeaderComponent} from './component';

export function getHeaderType(orient: AxisOrient) {
  if (orient === 'top' || orient === 'left') {
    return 'header';
  }
  return 'footer';
}

export function parseFacetHeaders(model: FacetModel) {
  for (const channel of FACET_CHANNELS) {
    parseFacetHeader(model, channel);
  }

  mergeChildAxis(model, 'x');
  mergeChildAxis(model, 'y');
}

function parseFacetHeader(model: FacetModel, channel: FacetChannel) {
  if (model.channelHasField(channel)) {
    const fieldDef = model.facet[channel];
    let title = fieldDefTitle(fieldDef, model.config, {allowDisabling: true});

    if (model.child.component.layoutHeaders[channel].title) {
      // merge title with child to produce "Title / Subtitle / Sub-subtitle"
      title += ' / ' + model.child.component.layoutHeaders[channel].title;
      model.child.component.layoutHeaders[channel].title = null;
    }

    model.component.layoutHeaders[channel] = {
      title,
      facetFieldDef: fieldDef,
      // TODO: support adding label to footer as well
      header: channel === 'facet' ? [] : [makeHeaderComponent(model, channel, true)]
    };
  }
}

function makeHeaderComponent(model: FacetModel, channel: HeaderChannel, labels: boolean): HeaderComponent {
  const sizeType = channel === 'row' ? 'height' : 'width';

  return {
    labels,
    sizeSignal: model.child.component.layoutSize.get(sizeType) ? model.child.getSizeSignalRef(sizeType) : undefined,
    axes: []
  };
}

function mergeChildAxis(model: FacetModel, channel: 'x' | 'y') {
  const {child} = model;
  if (child.component.axes[channel]) {
    const {layoutHeaders, resolve} = model.component;
    resolve.axis[channel] = parseGuideResolve(resolve, channel);

    if (resolve.axis[channel] === 'shared') {
      // For shared axis, move the axes to facet's header or footer
      const headerChannel = channel === 'x' ? 'column' : 'row';

      const layoutHeader = layoutHeaders[headerChannel];
      for (const axisComponent of child.component.axes[channel]) {
        const headerType = getHeaderType(axisComponent.get('orient'));
        layoutHeader[headerType] = layoutHeader[headerType] || [makeHeaderComponent(model, headerChannel, false)];

        // FIXME: assemble shouldn't be called here, but we do it this way so we only extract the main part of the axes
        const mainAxis = assembleAxis(axisComponent, 'main', model.config, {header: true});
        // LayoutHeader no longer keep track of property precedence, thus let's combine.
        layoutHeader[headerType][0].axes.push(mainAxis);
        axisComponent.mainExtracted = true;
      }
    } else {
      // Otherwise do nothing for independent axes
    }
  }
}
