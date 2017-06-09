import {SingleDefChannel} from './channel';
import {VgBinding} from './vega.schema';

export type SelectionTypes = 'single' | 'multi' | 'interval';
export type SelectionResolutions = 'global' | 'independent' | 'union' |
  'union_others' | 'intersect' | 'intersect_others';

export interface BaseSelectionDef {
  // domain?: SelectionDomain;
  resolve?: SelectionResolutions;
  on?: any;
  // predicate?: string;
  bind?: 'scales' | VgBinding | {[key: string]: VgBinding};

  // Transforms
  fields?: string[];
  encodings?: SingleDefChannel[];
  toggle?: string | boolean;
  translate?: string | boolean;
  zoom?: string | boolean;
  nearest?: boolean;
}

export interface SelectionDef extends BaseSelectionDef {
  type: SelectionTypes;
}

export interface SelectionConfig {
  single: BaseSelectionDef;
  multi: BaseSelectionDef;
  interval: BaseSelectionDef;
}

export const defaultConfig:SelectionConfig = {
  single: {on: 'click', fields: ['_id'], resolve: 'global'},
  multi: {on: 'click', fields: ['_id'], toggle: 'event.shiftKey', resolve: 'global'},
  interval: {
    on: '[mousedown, window:mouseup] > window:mousemove!',
    encodings: ['x', 'y'],
    translate: '[mousedown, window:mouseup] > window:mousemove!',
    zoom: 'wheel',
    resolve: 'global'
  }
};
