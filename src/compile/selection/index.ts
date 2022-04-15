import {Binding, isString, Signal, Stream} from 'vega';
import {stringValue} from 'vega-util';
import {FACET_CHANNELS} from '../../channel.js';
import {
  BrushConfig,
  LegendBinding,
  SelectionInit,
  SelectionInitInterval,
  SelectionResolution,
  SelectionType,
  SelectionParameter,
} from '../../selection.js';
import {Dict, vals} from '../../util.js';
import {OutputNode} from '../data/dataflow.js';
import {FacetModel} from '../facet.js';
import {isFacetModel, Model} from '../model.js';
import {UnitModel} from '../unit.js';
import interval from './interval.js';
import point from './point.js';
import {SelectionProjection, SelectionProjectionComponent} from './project.js';
import clear from './clear.js';
import inputs from './inputs.js';
import nearest from './nearest.js';
import project from './project.js';
import scales from './scales.js';
import legends from './legends.js';
import toggle from './toggle.js';
import translate from './translate.js';
import zoom from './zoom.js';
import {ParameterName} from '../../parameter.js';
import lasso from './lasso.js';


export const STORE = '_store';
export const TUPLE = '_tuple';
export const MODIFY = '_modify';
export const SELECTION_DOMAIN = '_selection_domain_';
export const VL_SELECTION_RESOLVE = 'vlSelectionResolve';

export interface SelectionComponent<T extends SelectionType = SelectionType> {
  name: ParameterName;
  type: T;
  // Use conditional types for stricter type of init (as the type of init depends on selection type).
  init?: (T extends 'interval' ? SelectionInitInterval : T extends 'point' ? SelectionInit : never)[][];
  events: Stream[];
  materialized: OutputNode;
  bind?: 'scales' | Binding | Dict<Binding> | LegendBinding;
  resolve: SelectionResolution;
  mark?: BrushConfig;
  project: SelectionProjectionComponent;
  scales?: SelectionProjection[];
  toggle?: string;
  translate?: any;
  zoom?: any;
  nearest?: any;
  clear?: any;
}

export interface SelectionCompiler<T extends SelectionType = SelectionType> {
  defined: (selCmpt: SelectionComponent) => boolean;
  parse?: (model: UnitModel, selCmpt: SelectionComponent<T>, def: SelectionParameter<T>) => void;
  signals?: (model: UnitModel, selCmpt: SelectionComponent<T>, signals: Signal[]) => Signal[];
  topLevelSignals?: (model: Model, selCmpt: SelectionComponent<T>, signals: Signal[]) => Signal[];
  modifyExpr?: (model: UnitModel, selCmpt: SelectionComponent<T>, expr: string) => string;
  marks?: (model: UnitModel, selCmpt: SelectionComponent<T>, marks: any[]) => any[];
}

// Order matters for parsing and assembly.
export const selectionCompilers: SelectionCompiler[] = [
  point,
  interval,
  lasso,
  project,
  toggle,

  // Bindings may disable direct manipulation.
  inputs,
  scales,
  legends,

  clear,
  translate,
  zoom,
  nearest,
];

function getFacetModel(model: Model): FacetModel {
  let parent = model.parent;
  while (parent) {
    if (isFacetModel(parent)) break;
    parent = parent.parent;
  }

  return parent as FacetModel;
}

export function unitName(model: Model, {escape} = {escape: true}) {
  let name = escape ? stringValue(model.name) : model.name;
  const facetModel = getFacetModel(model);
  if (facetModel) {
    const {facet} = facetModel;
    for (const channel of FACET_CHANNELS) {
      if (facet[channel]) {
        name += ` + '__facet_${channel}_' + (facet[${stringValue(facetModel.vgField(channel))}])`;
      }
    }
  }
  return name;
}

export function requiresSelectionId(model: Model) {
  return vals(model.component.selection ?? {}).reduce((identifier, selCmpt) => {
    return identifier || selCmpt.project.hasSelectionId;
  }, false);
}

// Binding a point selection to query widgets or legends disables default direct manipulation interaction.
// A user can choose to re-enable it by explicitly specifying triggering input events.
export function disableDirectManipulation(selCmpt: SelectionComponent, selDef: SelectionParameter<'point'>) {
  if (isString(selDef.select) || !selDef.select.on) delete selCmpt.events;
  if (isString(selDef.select) || !selDef.select.clear) delete selCmpt.clear;
  if (isString(selDef.select) || !selDef.select.toggle) delete selCmpt.toggle;
}

export function isTimerSelection<T extends SelectionType>(selCmpt: SelectionComponent<T>) {
  return selCmpt.events?.find((e) => 'type' in e && e.type === 'timer');
}
