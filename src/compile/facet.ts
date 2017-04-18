import {Channel, COLUMN, ROW, X, Y} from '../channel';
import {Config} from '../config';
import {MAIN} from '../data';
import {reduce} from '../encoding';
import {Facet} from '../facet';
import {FieldDef, normalize, title as fieldDefTitle} from '../fielddef';
import * as log from '../log';
import {FacetSpec} from '../spec';
import {StackProperties} from '../stack';
import {contains, Dict, extend, flatten, keys, vals} from '../util';
import {FontWeight, VgSignal} from '../vega.schema';
import {
  isDataRefDomain,
  isDataRefUnionedDomain,
  isFieldRefUnionDomain,
  VgData,
  VgDataRef,
  VgEncodeEntry,
  VgLayout
} from '../vega.schema';
import {parseGridAxis, parseMainAxis} from './axis/parse';
import {gridShow} from './axis/rules';
import {buildModel} from './common';
import {assembleData, assembleFacetData, FACET_SCALE_PREFIX} from './data/assemble';
import {parseData} from './data/parse';
import {getTextHeader} from './layout/header';
import {Model, ModelWithField} from './model';
import {RepeaterValue, replaceRepeaterInFacet} from './repeat';
import parseScaleComponent from './scale/parse';
import {UnitModel} from './unit';

export class FacetModel extends ModelWithField {
  public readonly facet: Facet<string>;

  public readonly child: Model;

  public readonly children: Model[];

  constructor(spec: FacetSpec, parent: Model, parentGivenName: string, repeater: RepeaterValue, config: Config) {
    super(spec, parent, parentGivenName, config);

    this.child = buildModel(spec.spec, this, this.getName('child'), repeater, config);
    this.children = [this.child];

    const facet: Facet<string> = replaceRepeaterInFacet(spec.facet, repeater);

    this.facet = this.initFacet(facet);
  }

  private initFacet(facet: Facet<string>): Facet<string> {
    // clone to prevent side effect to the original spec
    return reduce(facet, function(normalizedFacet, fieldDef: FieldDef<string>, channel: Channel) {
      if (!contains([ROW, COLUMN], channel)) {
        // Drop unsupported channel
        log.warn(log.message.incompatibleChannel(channel, 'facet'));
        return normalizedFacet;
      }

      if (fieldDef.field === undefined) {
        log.warn(log.message.emptyFieldDef(fieldDef, channel));
        return normalizedFacet;
      }

      // Convert type to full, lowercase type, or augment the fieldDef with a default type if missing.
      normalizedFacet[channel] = normalize(fieldDef, channel);
      return normalizedFacet;
    }, {});
  }

  public channelHasField(channel: Channel): boolean {
    return !!this.facet[channel];
  }

  public hasDiscreteDomain(channel: Channel) {
    return true;
  }

  public fieldDef(channel: Channel): FieldDef<string> {
    return this.facet[channel];
  }

  public parseData() {
    this.component.data = parseData(this);
    this.child.parseData();
  }

  public parseSelection() {
    // As a facet has a single child, the selection components are the same.
    // The child maintains its selections to assemble signals, which remain
    // within its unit.
    this.child.parseSelection();
    this.component.selection = this.child.component.selection;
  }

  public parseScale() {
    const child = this.child;
    const model = this;

    child.parseScale();

    const scaleComponent = this.component.scales = {};

    // Then, move shared/union from its child spec.
    keys(child.component.scales).forEach(channel => {
      // TODO: correctly implement independent scale
      if (true) { // if shared/union scale
        const scale = scaleComponent[channel] = child.component.scales[channel];

        const scaleNameWithoutPrefix = scale.name.substr(child.getName('').length);
        const newName = model.scaleName(scaleNameWithoutPrefix, true);
        child.renameScale(scale.name, newName);
        scale.name = newName;

        // Replace the scale domain with data output from a cloned subtree after the facet.
        const domain = scale.domain;

        if (isDataRefDomain(domain) || isFieldRefUnionDomain(domain)) {
          domain.data = FACET_SCALE_PREFIX + this.getName(domain.data);
        } else if (isDataRefUnionedDomain(domain)) {
          domain.fields = domain.fields.map((f: VgDataRef) => {
            return {
              ...f,
              data: FACET_SCALE_PREFIX + this.getName(f.data)
            };
          });
        }

        // Once put in parent, just remove the child's scale.
        delete child.component.scales[channel];
      }
    });
  }

  public parseMark() {
    this.child.parseMark();

    this.component.mark = [{
      name: this.getName('cell'),
      type: 'group',
      from: {
        facet: {
          name: this.component.data.facetRoot.name,
          data: this.component.data.facetRoot.data,
          groupby: [].concat(
            this.channelHasField(ROW) ? [this.field(ROW)] : [],
            this.channelHasField(COLUMN) ? [this.field(COLUMN)] : []
          )
        }
      },
      encode: {
        update: getFacetGroupProperties(this)
      }
    }];
  }

  public parseAxis() {
    this.child.parseAxis();
    // FIXME: Correct write parseAxis logic
    this.component.axes = {};
  }

  public parseAxisGroup() {
    // TODO: with nesting, we might need to consider calling child
    // this.child.parseAxisGroup();

    const xAxisGroup = parseAxisGroups(this, X);
    const yAxisGroup = parseAxisGroups(this, Y);

    this.component.axisGroups = extend(
      xAxisGroup ? {x: xAxisGroup} : {},
      yAxisGroup ? {y: yAxisGroup} : {}
    );
  }

  public parseLegend() {
    this.child.parseLegend();

    // TODO: support legend for independent non-position scale across facets
    // TODO: support legend for field reference of parent data (e.g., for SPLOM)

    // For now, assuming that non-positional scales are always shared across facets
    // Thus, just move all legends from its child
    this.component.legends = this.child.component.legends;
    this.child.component.legends = {};
  }

  public assembleData(): VgData[] {
    if (!this.parent) {
      // only assemble data in the root
      return assembleData(vals(this.component.data.sources));
    }

    return [];
  }

  public assembleParentGroupProperties(): any {
    return null;
  }

  public assembleSignals(): VgSignal[] {
    // FIXME(https://github.com/vega/vega-lite/issues/1193): this can be incorrect if we have independent scales.
    return this.child.assembleLayoutSignals();
  }

  public assembleSelectionData(data: VgData[]): VgData[] {
    return this.child.assembleSelectionData(data);
  }

  public assembleLayout(): VgLayout {
    return {
      padding: {row: 10, column: 10, header: 10},
      columns: 1,
      bounds: 'full'
    };
  }

  public assembleLayoutSignals(): VgSignal[] {
    // FIXME correct this for column
    return [];
  }

  private assembleLabelGroups() {
    return [].concat(
      (this.channelHasField('column') ? [getLabelGroup(this, 'column')] : []),
      (this.channelHasField('row') ? [getLabelGroup(this, 'row')] : [])
    );
  }

  private columnDistinctSignal() {
    // In facetNode.assemble(), the name is always this.getName('column') + '_layout'.
    const facetLayoutDataName = this.getName('column') + '_layout';
    const columnDistinct = this.field('column',  {prefix: 'distinct'});
    return `data('${facetLayoutDataName}')[0].${columnDistinct}`;
  }

  public assembleMarks(): VgEncodeEntry[] {
    const data = assembleFacetData(this.component.data.facetRoot);

    const mark = this.component.mark[0];

    // correct the name of the faceted data source
    mark.from.facet.name = this.component.data.facetRoot.name;
    mark.from.facet.data = this.component.data.facetRoot.data;

    const marks = [].concat(
      // axisGroup is a mapping to VgMarkGroup
      vals(this.component.axisGroups),
      this.assembleLabelGroups(),
      extend(mark, data.length > 0 ? {data: data} : {}, this.child.assembleGroup())
    ).map(this.correctDataNames);

    const columns = this.channelHasField('column') ? {
      signal: this.columnDistinctSignal()
    } : 1;

    return [].concat(
        [{
        type: 'group',
        layout: {
          padding: {
            // TODO: allow customizing padding
            row: 10,
            column: 10,
            header: 10
          },
          columns,
          bounds: 'full' // TODO:
        },
        marks
      }],
      this.channelHasField('column') ? [getTitleGroup(this, 'column')] : [],
      this.channelHasField('row') ? [getTitleGroup(this, 'row')] : [],
    );
  }

  public channels() {
    return [ROW, COLUMN];
  }

  protected getMapping() {
    return this.facet;
  }
}

export function hasSubPlotWithXy(model: FacetModel) {
  return model.hasDescendantWithFieldOnChannel('x') ||
    model.hasDescendantWithFieldOnChannel('y');
}

function childSizeEncodeEntryMixins(model: FacetModel, sizeType: 'width' | 'height') {
  return {[sizeType]: model.child.getSizeSignalRef(sizeType)};
}

function getFacetGroupProperties(model: FacetModel) {
  const child = model.child;
  const mergedCellConfig = extend({}, child.config.cell, child.config.facet.cell);

  return {
    ...childSizeEncodeEntryMixins(model, 'width'),
    ...childSizeEncodeEntryMixins(model, 'height'),
    ...(hasSubPlotWithXy(model) ? child.assembleParentGroupProperties(mergedCellConfig) : {})
  };
}

// TODO: move the rest of the file src/compile/facet/*.ts

function parseAxisGroups(model: FacetModel, channel: 'x' | 'y') {
  // TODO: add a case where inner spec is not a unit (facet/layer/concat)
  let axisGroup: any = null;

  const child = model.child;
  // FIXME support non unit child
  if (child instanceof UnitModel && child.channelHasField(channel)) {
    if (child.component.axes[channel]) {
      if (true) { // the channel has shared axes

        // add a group for the shared axes
        axisGroup = getSharedAxisGroup(model, channel);

        if (child.component.axes[channel] && gridShow(child, channel)) { // show inner grid
          // add inner axis (aka axis that shows only grid to )
          child.component.axes[channel] = [parseGridAxis(channel, child)];
        } else {
          // Delete existing child axes
          delete child.component.axes[channel];
        }
      } else {
        // TODO: implement independent axes support
      }
    }
  }
  return axisGroup;
}


export function getSharedAxisGroup(model: FacetModel, channel: 'x' | 'y'): VgEncodeEntry {
  const isX = channel === 'x' ;
  const facetChannel = isX ? 'column' : 'row';
  const hasFacet = !!model.facet[facetChannel];

  // FIXME: we cannot cast like this
  const axis = parseMainAxis(channel, model.child as UnitModel);

  const role = facetChannel + '-' + (contains(['left', 'top'], axis.orient) ? 'header': 'footer');

  const axesGroup: VgEncodeEntry = {
    name: model.getName(channel + '-axes'),
    type: 'group',
    role
  };

  if (hasFacet) {
    // Need to drive this with special data source that has one item for each column/row value.

    // TODO: We might only need to drive this with special data source if there are both row and column
    // However, it might be slightly difficult as we have to merge this with the main group.
    axesGroup.from = {data: channel === 'x' ? model.getName('column') : model.getName('row')};
  }

  // TODO: see if we need to setup axesGroup.encode at all

  axesGroup.axes = [axis];
  return axesGroup;
}

export function getLabelGroup(model: FacetModel, channel: 'row' | 'column') {
  const sizeChannel = channel === 'row' ? 'height' : 'width';
  return getTextHeader({
    channel,
    name: model.getName(`${channel}-labels`),
    from: {data: model.getName(channel)},
    groupEncode: childSizeEncodeEntryMixins(model, sizeChannel),
    // TODO: support customizing + remove if Vega will provide padding for this one.
    offset: -10,
    // TODO: support customizing row title orientation (horizontal / vertical (using textOrient)
    textRole: `${channel}-labels`,

    // TODO: customize axis values
    textRef: {field: {parent: model.field(channel)}},

    // TODO: customize alignment
    positionRef: {field: {group: sizeChannel}, mult: 0.5}
  });
}

export function getTitleGroup(model: FacetModel, channel: 'row' | 'column') {
  const sizeChannel = channel === 'row' ? 'height' : 'width';
  const fieldDef = model.facet[channel];
  return getTextHeader({
    channel,
    name: model.getName(`${channel}-title`),

    // TODO: support customization
    textEncodeMixins: {
      fontWeight: {value: 'bold'}
    },

    // TODO: support customizing row title orientation (horizontal / vertical)
    textOrient: (channel === 'row' ? 'vertical' : undefined),
    textRole: `${channel}-title`,

    // TODO: customize title
    textRef: {value: fieldDefTitle(fieldDef, model.config)},

    // TODO: customize alignment
    // FIXME: this is not working.  Need to wait for Jeff's layout update that include title role
    positionRef: {signal: `0.5 * ${sizeChannel}`}
  });
}
