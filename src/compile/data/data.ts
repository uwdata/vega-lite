
import {FieldDef} from '../../fielddef';
import {Transform} from '../../transform';
import {Dict, StringSet} from '../../util';
import {VgData, VgFormulaTransform, VgSort, VgTransform} from '../../vega.schema';

import {FacetModel} from './../facet';
import {LayerModel} from './../layer';
import {Model} from './../model';
import {UnitModel} from './../unit';

import {SUMMARY} from '../../data';
import {summary} from './aggregate';
import {bin} from './bin';
import {formatParse} from './formatparse';
import {nonPositiveFilter} from './nonpositivefilter';
import {nullFilter} from './nullfilter';
import {pathOrder} from './pathorder';
import {source} from './source';
import {stack, StackComponent} from './stack';
import {timeUnit} from './timeunit';
import {transforms} from './transforms';

/**
 * Composable component instance of a model's data.
 */
export interface DataComponent {
  source: VgData;

  /** Mapping from field name to primitive data type.  */
  formatParse: Dict<string>;

  /** String set of fields for null filtering */
  nullFilter: Dict<FieldDef>;

  /** Transforms */
  transforms: Transform[];

  /** Dictionary mapping a bin parameter hash to transforms of the binned field */
  bin: Dict<VgTransform[]>;

  /** Dictionary mapping an output field name (hash) to the time unit transform  */
  timeUnit: Dict<VgFormulaTransform>;

  /** String set of fields to be filtered */
  nonPositiveFilter: Dict<boolean>;

  /** Sort order to apply at the end */
  pathOrder: VgSort;

  /**
   * Stack transforms to be applied.
   */
  stack: StackComponent;

  /** Array of summary component object for producing summary (aggregate) data source */
  summary: SummaryComponent[];
}

/**
 * Composable component for a model's summary data
 */
export interface SummaryComponent {
  /** Name of the summary data source */
  name: string;

  /** String set for all dimension fields  */
  dimensions: StringSet;

  /** dictionary mapping field name to string set of aggregate ops */
  measures: Dict<StringSet>;
}

// TODO: split this file into multiple files and remove this linter flag
/* tslint:disable:no-use-before-declare */

export function parseUnitData(model: UnitModel): DataComponent {
  return {
    formatParse: formatParse.parseUnit(model),
    transforms: transforms.parseUnit(model),
    nullFilter: nullFilter.parseUnit(model),
    nonPositiveFilter: nonPositiveFilter.parseUnit(model),
    pathOrder: pathOrder.parseUnit(model),

    source: source.parseUnit(model),
    bin: bin.parseUnit(model),
    timeUnit: timeUnit.parseUnit(model),
    summary: summary.parseUnit(model),
    stack: stack.parseUnit(model)
  };
}

export function parseFacetData(model: FacetModel): DataComponent {
  return {
    formatParse: formatParse.parseFacet(model),
    transforms: transforms.parseFacet(model),
    nullFilter: nullFilter.parseFacet(model),
    nonPositiveFilter: nonPositiveFilter.parseFacet(model),
    pathOrder: pathOrder.parseFacet(model),

    source: source.parseFacet(model),
    bin: bin.parseFacet(model),
    timeUnit: timeUnit.parseFacet(model),
    summary: summary.parseFacet(model),
    stack: stack.parseFacet(model)
  };
}

export function parseLayerData(model: LayerModel): DataComponent {
  return {
    // filter and formatParse could cause us to not be able to merge into parent
    // so let's parse them first
    transforms: transforms.parseLayer(model),
    formatParse: formatParse.parseLayer(model),
    nullFilter: nullFilter.parseLayer(model),
    nonPositiveFilter: nonPositiveFilter.parseLayer(model),
    pathOrder: pathOrder.parseLayer(model),

    // everything after here does not affect whether we can merge child data into parent or not
    source: source.parseLayer(model),
    bin: bin.parseLayer(model),
    timeUnit: timeUnit.parseLayer(model),
    summary: summary.parseLayer(model),
    stack: stack.parseLayer(model)
  };
}

/* tslint:enable:no-use-before-declare */

/**
 * Creates Vega Data array from a given compiled model and append all of them to the given array
 *
 * @param  model
 * @param  data array
 * @return modified data array
 */
export function assembleData(model: Model, data: VgData[]) {
  const dataComponent = model.component.data;

  const sourceData = source.assemble(dataComponent);
  if (sourceData) {
    data.push(sourceData);
  }

  // aggregate
  summary.assemble(dataComponent.summary || []).forEach(aggregate => {
    data.push({
      source: sourceData.name,
      name: model.dataName(SUMMARY),
      transform: [aggregate]
    });
  });

  // nonPositiveFilter
  const nonPositiveFilterTransform = nonPositiveFilter.assemble(dataComponent.nonPositiveFilter);
  if (nonPositiveFilterTransform.length > 0) {
    if (data.length > 0) {
      const dataTable = data[data.length - 1];
      dataTable.transform = (dataTable.transform || []).concat(nonPositiveFilterTransform);
    } else { /* istanbul ignore else: should never reach here */
      throw new Error('Invalid nonPositiveFilter not merged');
    }
  }

  // stack
  const stackData = stack.assemble(dataComponent.stack);
  if (stackData) {
    data.push(stackData);
  }

  // Path Order
  const pathOrderCollectTransform = pathOrder.assemble(dataComponent.pathOrder);
  if (pathOrderCollectTransform) {
    const dataTable = data[data.length - 1];
    if (data.length > 0) {
      dataTable.transform = (dataTable.transform || []).concat([pathOrderCollectTransform]);
    } else { /* istanbul ignore else: should never reach here */
      throw new Error('Invalid path order collect transform not added');
    }
  }

  return data;
}
