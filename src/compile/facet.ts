import {AggregateOp, LayoutAlign, NewSignal, SignalRef} from 'vega';
import {isArray} from 'vega-util';
import {isBinning} from '../bin';
import {COLUMN, ExtendedChannel, FacetChannel, FACET_CHANNELS, POSITION_SCALE_CHANNELS, ROW} from '../channel';
import {FieldName, FieldRefOption, initFieldDef, TypedFieldDef, vgField} from '../channeldef';
import {Config} from '../config';
import {ExprRef, replaceExprRef} from '../expr';
import * as log from '../log';
import {hasDiscreteDomain} from '../scale';
import {EncodingSortField, isSortField, SortOrder} from '../sort';
import {NormalizedFacetSpec} from '../spec';
import {EncodingFacetMapping, FacetFieldDef, FacetMapping, isFacetMapping} from '../spec/facet';
import {hasProperty, keys} from '../util';
import {isVgRangeStep, VgData, VgLayout, VgMarkGroup} from '../vega.schema';
import {buildModel} from './buildmodel';
import {assembleFacetData} from './data/assemble';
import {sortArrayIndexField} from './data/calculate';
import {parseData} from './data/parse';
import {assembleLabelTitle} from './header/assemble';
import {getHeaderChannel, getHeaderProperty} from './header/common';
import {HEADER_CHANNELS, HEADER_TYPES} from './header/component';
import {parseFacetHeaders} from './header/parse';
import {parseChildrenLayoutSize} from './layoutsize/parse';
import {Model, ModelWithField} from './model';
import {assembleDomain, getFieldFromDomain} from './scale/domain';
import {assembleFacetSignals} from './selection/assemble';
import {isTimerSelection} from './selection';
import {MULTI_VIEW_ANIMATION_UNSUPPORTED} from '../log/message';

export function facetSortFieldName(
  fieldDef: FacetFieldDef<string>,
  sort: EncodingSortField<string>,
  opt?: FieldRefOption
) {
  return vgField(sort, {suffix: `by_${vgField(fieldDef)}`, ...opt});
}

export class FacetModel extends ModelWithField {
  public readonly facet: EncodingFacetMapping<string, SignalRef>;

  public readonly child: Model;

  public readonly children: Model[];

  constructor(spec: NormalizedFacetSpec, parent: Model, parentGivenName: string, config: Config<SignalRef>) {
    super(spec, 'facet', parent, parentGivenName, config, spec.resolve);

    this.child = buildModel(spec.spec, this, this.getName('child'), undefined, config);
    this.children = [this.child];

    this.facet = this.initFacet(spec.facet);
  }

  private initFacet(
    facet: FacetFieldDef<FieldName> | FacetMapping<FieldName>
  ): EncodingFacetMapping<FieldName, SignalRef> {
    // clone to prevent side effect to the original spec
    if (!isFacetMapping(facet)) {
      return {facet: this.initFacetFieldDef(facet, 'facet')};
    }

    const channels = keys(facet);
    const normalizedFacet: EncodingFacetMapping<FieldName, SignalRef> = {};
    for (const channel of channels) {
      if (![ROW, COLUMN].includes(channel)) {
        // Drop unsupported channel
        log.warn(log.message.incompatibleChannel(channel, 'facet'));
        break;
      }

      const fieldDef = facet[channel];
      if (fieldDef.field === undefined) {
        log.warn(log.message.emptyFieldDef(fieldDef, channel));
        break;
      }

      normalizedFacet[channel] = this.initFacetFieldDef(fieldDef, channel);
    }

    return normalizedFacet;
  }

  private initFacetFieldDef(fieldDef: FacetFieldDef<FieldName, ExprRef | SignalRef>, channel: FacetChannel) {
    // Cast because we call initFieldDef, which assumes general FieldDef.
    // However, FacetFieldDef is a bit more constrained than the general FieldDef
    const facetFieldDef = initFieldDef(fieldDef, channel) as FacetFieldDef<FieldName, SignalRef>;
    if (facetFieldDef.header) {
      facetFieldDef.header = replaceExprRef(facetFieldDef.header);
    } else if (facetFieldDef.header === null) {
      facetFieldDef.header = null;
    }
    return facetFieldDef;
  }

  public channelHasField(channel: ExtendedChannel): boolean {
    return hasProperty(this.facet, channel);
  }

  public fieldDef(channel: ExtendedChannel): TypedFieldDef<string> {
    return (this.facet as any)[channel];
  }

  public parseData() {
    this.component.data = parseData(this);
    this.child.parseData();
  }

  public parseLayoutSize() {
    parseChildrenLayoutSize(this);
  }

  public parseSelections() {
    // As a facet has a single child, the selection components are the same.
    // The child maintains its selections to assemble signals, which remain
    // within its unit.
    this.child.parseSelections();
    this.component.selection = this.child.component.selection;

    if (Object.values(this.component.selection).some(selCmpt => isTimerSelection(selCmpt))) {
      log.error(MULTI_VIEW_ANIMATION_UNSUPPORTED);
    }
  }

  public parseMarkGroup() {
    this.child.parseMarkGroup();
  }

  public parseAxesAndHeaders() {
    this.child.parseAxesAndHeaders();

    parseFacetHeaders(this);
  }

  public assembleSelectionTopLevelSignals(signals: NewSignal[]): NewSignal[] {
    return this.child.assembleSelectionTopLevelSignals(signals);
  }

  public assembleSignals(): NewSignal[] {
    this.child.assembleSignals();
    return [];
  }

  public assembleSelectionData(data: readonly VgData[]): readonly VgData[] {
    return this.child.assembleSelectionData(data);
  }

  private getHeaderLayoutMixins(): VgLayout {
    const layoutMixins: VgLayout = {};

    for (const channel of FACET_CHANNELS) {
      for (const headerType of HEADER_TYPES) {
        const layoutHeaderComponent = this.component.layoutHeaders[channel];
        const headerComponent = layoutHeaderComponent[headerType];

        const {facetFieldDef} = layoutHeaderComponent;
        if (facetFieldDef) {
          const titleOrient = getHeaderProperty('titleOrient', facetFieldDef.header, this.config, channel);

          if (['right', 'bottom'].includes(titleOrient)) {
            const headerChannel = getHeaderChannel(channel, titleOrient);
            layoutMixins.titleAnchor ??= {};
            (layoutMixins.titleAnchor as any)[headerChannel] = 'end';
          }
        }

        if (headerComponent?.[0]) {
          // set header/footerBand
          const sizeType = channel === 'row' ? 'height' : 'width';
          const bandType = headerType === 'header' ? 'headerBand' : 'footerBand';
          if (channel !== 'facet' && !this.child.component.layoutSize.get(sizeType)) {
            // If facet child does not have size signal, then apply headerBand
            layoutMixins[bandType] ??= {};
            (layoutMixins[bandType] as any)[channel] = 0.5;
          }

          if (layoutHeaderComponent.title) {
            layoutMixins.offset ??= {};
            (layoutMixins.offset as any)[channel === 'row' ? 'rowTitle' : 'columnTitle'] = 10;
          }
        }
      }
    }
    return layoutMixins;
  }

  protected assembleDefaultLayout(): VgLayout {
    const {column, row} = this.facet;

    const columns = column ? this.columnDistinctSignal() : row ? 1 : undefined;

    let align: LayoutAlign = 'all';

    // Do not align the cells if the scale corresponding to the direction is indepent.
    // We always align when we facet into both row and column.
    if (!row && this.component.resolve.scale.x === 'independent') {
      align = 'none';
    } else if (!column && this.component.resolve.scale.y === 'independent') {
      align = 'none';
    }

    return {
      ...this.getHeaderLayoutMixins(),

      ...(columns ? {columns} : {}),
      bounds: 'full',
      align
    };
  }

  public assembleLayoutSignals(): NewSignal[] {
    // FIXME(https://github.com/vega/vega-lite/issues/1193): this can be incorrect if we have independent scales.
    return this.child.assembleLayoutSignals();
  }

  private columnDistinctSignal() {
    if (this.parent && this.parent instanceof FacetModel) {
      // For nested facet, we will add columns to group mark instead
      // See discussion in https://github.com/vega/vega/issues/952
      // and https://github.com/vega/vega-view/releases/tag/v1.2.6
      return undefined;
    } else {
      // In facetNode.assemble(), the name is always this.getName('column') + '_layout'.
      const facetLayoutDataName = this.getName('column_domain');
      return {signal: `length(data('${facetLayoutDataName}'))`};
    }
  }

  public assembleGroupStyle(): string | string[] {
    return undefined;
  }

  public assembleGroup(signals: NewSignal[]) {
    if (this.parent && this.parent instanceof FacetModel) {
      // Provide number of columns for layout.
      // See discussion in https://github.com/vega/vega/issues/952
      // and https://github.com/vega/vega-view/releases/tag/v1.2.6
      return {
        ...(this.channelHasField('column')
          ? {
              encode: {
                update: {
                  // TODO(https://github.com/vega/vega-lite/issues/2759):
                  // Correct the signal for facet of concat of facet_column
                  columns: {field: vgField(this.facet.column, {prefix: 'distinct'})}
                }
              }
            }
          : {}),
        ...super.assembleGroup(signals)
      };
    }
    return super.assembleGroup(signals);
  }

  /**
   * Aggregate cardinality for calculating size
   */
  private getCardinalityAggregateForChild() {
    const fields: string[] = [];
    const ops: AggregateOp[] = [];
    const as: string[] = [];

    if (this.child instanceof FacetModel) {
      if (this.child.channelHasField('column')) {
        const field = vgField(this.child.facet.column);
        fields.push(field);
        ops.push('distinct');
        as.push(`distinct_${field}`);
      }
    } else {
      for (const channel of POSITION_SCALE_CHANNELS) {
        const childScaleComponent = this.child.component.scales[channel];
        if (childScaleComponent && !childScaleComponent.merged) {
          const type = childScaleComponent.get('type');
          const range = childScaleComponent.get('range');

          if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
            const domain = assembleDomain(this.child, channel);
            const field = getFieldFromDomain(domain);
            if (field) {
              fields.push(field);
              ops.push('distinct');
              as.push(`distinct_${field}`);
            } else {
              log.warn(log.message.unknownField(channel));
            }
          }
        }
      }
    }
    return {fields, ops, as};
  }

  private assembleFacet() {
    const {name, data} = this.component.data.facetRoot;
    const {row, column} = this.facet;
    const {fields, ops, as} = this.getCardinalityAggregateForChild();
    const groupby: string[] = [];

    for (const channel of FACET_CHANNELS) {
      const fieldDef = this.facet[channel];
      if (fieldDef) {
        const {bin, sort} = fieldDef;

        if (isSortField(sort)) {
          const outputName = facetSortFieldName(fieldDef, sort);
          groupby.push(outputName);
        } else if (isArray(sort)) {
          const outputName = sortArrayIndexField(fieldDef, channel);
          groupby.push(outputName);
        } else {
          groupby.push(vgField(fieldDef));
        }

        if (isBinning(bin)) {
          groupby.push(vgField(fieldDef, {binSuffix: 'end'}));
        }
      }
    }

    const cross = !!row && !!column;

    return {
      name,
      data,
      groupby,
      ...(cross || fields.length > 0
        ? {
            aggregate: {
              ...(cross ? {cross} : {}),
              ...(fields.length ? {fields, ops, as} : {})
            }
          }
        : {})
    };
  }

  private facetSortFields(channel: FacetChannel): string[] {
    const {facet} = this;
    const fieldDef = facet[channel];

    if (fieldDef) {
      if (isSortField(fieldDef.sort)) {
        return [facetSortFieldName(fieldDef, fieldDef.sort, {expr: 'datum'})];
      } else if (isArray(fieldDef.sort)) {
        return [sortArrayIndexField(fieldDef, channel, {expr: 'datum'})];
      }
      return [vgField(fieldDef, {expr: 'datum'})];
    }
    return [];
  }

  private facetSortOrder(channel: FacetChannel): SortOrder[] {
    const {facet} = this;
    const fieldDef = facet[channel];
    if (fieldDef) {
      const {sort} = fieldDef;
      const order = (isSortField(sort) ? sort.order : !isArray(sort) && sort) || 'ascending';
      return [order];
    }
    return [];
  }

  private assembleLabelTitle() {
    const {facet, config} = this;
    if (facet.facet) {
      // Facet always uses title to display labels
      return assembleLabelTitle(facet.facet, 'facet', config);
    }

    const ORTHOGONAL_ORIENT = {
      row: ['top', 'bottom'],
      column: ['left', 'right']
    };

    for (const channel of HEADER_CHANNELS) {
      if (facet[channel]) {
        const labelOrient = getHeaderProperty('labelOrient', facet[channel]?.header, config, channel);
        if (ORTHOGONAL_ORIENT[channel].includes(labelOrient)) {
          // Row/Column with orthogonal labelOrient must use title to display labels
          return assembleLabelTitle(facet[channel], channel, config);
        }
      }
    }
    return undefined;
  }

  public assembleMarks(): VgMarkGroup[] {
    const {child} = this;

    // If we facet by two dimensions, we need to add a cross operator to the aggregation
    // so that we create all groups
    const facetRoot = this.component.data.facetRoot;
    const data = assembleFacetData(facetRoot);

    const encodeEntry = child.assembleGroupEncodeEntry(false);

    const title = this.assembleLabelTitle() || child.assembleTitle();
    const style = child.assembleGroupStyle();

    const markGroup = {
      name: this.getName('cell'),
      type: 'group',
      ...(title ? {title} : {}),
      ...(style ? {style} : {}),
      from: {
        facet: this.assembleFacet()
      },
      // TODO: move this to after data
      sort: {
        field: FACET_CHANNELS.map(c => this.facetSortFields(c)).flat(),
        order: FACET_CHANNELS.map(c => this.facetSortOrder(c)).flat()
      },
      ...(data.length > 0 ? {data} : {}),
      ...(encodeEntry ? {encode: {update: encodeEntry}} : {}),
      ...child.assembleGroup(assembleFacetSignals(this, []))
    };

    return [markGroup];
  }

  protected getMapping() {
    return this.facet;
  }
}
