// @ts-expect-error - vega does not yet export resetSVGDefIds
import {parse, View, resetSVGDefIds} from 'vega';
import {stringValue} from 'vega-util';
import {compile} from '../src/index.js';
import {IntervalSelectionConfigWithoutType, SelectionResolution, SelectionType} from '../src/selection.js';
import {NormalizedLayerSpec, NormalizedUnitSpec, TopLevelSpec} from '../src/spec/index.js';

export type ComposeType = 'unit' | 'repeat' | 'facet';
export const selectionTypes: SelectionType[] = ['point', 'interval', 'region'];
export const compositeTypes: ComposeType[] = ['repeat', 'facet'];
export const resolutions: SelectionResolution[] = ['union', 'intersect'];

export const bound = 'bound';
export const unbound = 'unbound';

export const tuples = [
  {a: 0, b: 28, c: 0},
  {a: 0, b: 55, c: 1},
  {a: 0, b: 23, c: 2},
  {a: 1, b: 43, c: 0},
  {a: 1, b: 91, c: 1},
  {a: 1, b: 54, c: 2},
  {a: 2, b: 81, c: 0},
  {a: 2, b: 53, c: 1},
  {a: 2, b: 76, c: 2},
  {a: 3, b: 19, c: 0},
  {a: 3, b: 87, c: 1},
  {a: 3, b: 12, c: 2},
  {a: 4, b: 52, c: 0},
  {a: 4, b: 48, c: 1},
  {a: 4, b: 35, c: 2},
  {a: 5, b: 24, c: 0},
  {a: 5, b: 49, c: 1},
  {a: 5, b: 48, c: 2},
  {a: 6, b: 87, c: 0},
  {a: 6, b: 66, c: 1},
  {a: 6, b: 23, c: 2},
  {a: 7, b: 17, c: 0},
  {a: 7, b: 27, c: 1},
  {a: 7, b: 39, c: 2},
  {a: 8, b: 68, c: 0},
  {a: 8, b: 16, c: 1},
  {a: 8, b: 67, c: 2},
  {a: 9, b: 49, c: 0},
  {a: 9, b: 15, c: 1},
  {a: 9, b: 48, c: 2},
];

const UNIT_NAMES = {
  repeat: ['child__row_d', 'child__row_e', 'child__row_f'],
  facet: ['child__facet_row_0', 'child__facet_row_1', 'child__facet_row_2'],
};

export const hits = {
  point: {
    qq: [8, 19],
    qq_clear: [5, 16],

    bins: [4, 29],
    bins_clear: [18, 7],

    repeat: [5, 10, 17],
    repeat_clear: [13, 14, 2],

    facet: [2, 6, 9],
    facet_clear: [3, 4, 8],
  },

  interval: {
    drag: [
      [5, 14],
      [18, 26],
    ],
    drag_clear: [[5], [16]],
    translate: [
      [6, 16],
      [24, 8],
    ],

    bins: [
      [4, 8],
      [2, 7],
    ],
    bins_clear: [[5], [9]],
    bins_translate: [
      [5, 7],
      [1, 8],
    ],

    repeat: [
      [8, 29],
      [11, 26],
      [7, 21],
    ],
    repeat_clear: [[8], [11], [17]],

    facet: [
      [1, 9],
      [2, 8],
      [4, 10],
    ],
    facet_clear: [[3], [5], [7]],
  } as const,
  region: {
    circle: [
      {id: 14, count: 5},
      {id: 3, count: 2},
      {id: 6, count: 4},
    ],
    circle_clear: [{id: 14}],

    polygon: [
      {
        id: 6,
        coords: [
          [-30, -30],
          [-30, 30],
          [30, 30],
          [30, -30],
        ],
        count: 4,
      },
      {
        id: 14,
        coords: [
          [-30, -30],
          [-30, 30],
          [-15, 15],
          [-15, -15],
          [15, -15],
          [15, 30],
          [30, 30],
          [30, -30],
        ],
        count: 2,
      },
    ],

    facet: [2, 4, 7],
    facet_clear: [3, 5, 8],

    repeat: [5, 10, 16],
    repeat_clear: [13, 14, 2],
  },
};

const config = {
  // reduce changes in generated SVGs
  aria: false,

  // A lot of magic numbers in this file use the old step = 21
  view: {discreteWidth: {step: 21}, discreteHeight: {step: 21}},
};

function base(iter: number, selDef: any, opts: any = {}): NormalizedUnitSpec | NormalizedLayerSpec {
  const data = {values: opts.values ?? tuples};
  const x = {field: 'a', type: 'quantitative', ...opts.x};
  const y = {field: 'b', type: 'quantitative', ...opts.y};
  const color = {field: 'c', type: 'nominal', ...opts.color};
  const size = {value: 100, ...opts.size};
  const {bind, ...select} = selDef;
  const params = [{name: 'sel', select, bind}];
  const mark = 'circle';

  if (iter % 2 === 0) {
    return {
      data,
      params,
      mark,
      encoding: {
        x,
        y,
        size,
        color: {
          condition: {param: 'sel', ...color},
          value: 'grey',
        },
      },
    };
  } else {
    return {
      data,
      layer: [
        {
          params,
          mark,
          encoding: {
            x,
            y,
            size,
            color,
            opacity: {value: 0.25},
          },
        },
        {
          transform: [{filter: {param: 'sel'}}],
          mark,
          encoding: {x, y, size, color},
        },
      ],
    };
  }
}

export function getSpec(compose: ComposeType, iter: number, sel: any, opts: any = {}): TopLevelSpec {
  const {data, ...specification} = base(iter, sel, opts);
  const resolve = opts.resolve;
  switch (compose) {
    case 'unit':
      return {data, ...specification, config} as TopLevelSpec;
    case 'facet':
      return {
        data,
        facet: {row: {field: 'c', type: 'nominal'}},
        spec: specification,
        resolve,
        config,
      } as TopLevelSpec;
    case 'repeat':
      return {
        data,
        repeat: {row: ['d', 'e', 'f']},
        spec: specification,
        resolve,
        config,
      } as TopLevelSpec;
  }
}

export function getGeoSpec(selDef?: IntervalSelectionConfigWithoutType): TopLevelSpec {
  return {
    width: 500,
    height: 300,
    projection: {type: 'albersUsa'},
    config,
    data: {
      values: [
        {latitude: 31.95376472, longitude: -89.23450472},
        {latitude: 30.68586111, longitude: -95.01792778},
        {latitude: 38.94574889, longitude: -104.5698933},
        {latitude: 42.74134667, longitude: -78.05208056},
        {latitude: 30.6880125, longitude: -81.90594389},
        {latitude: 34.49166667, longitude: -88.20111111},
        {latitude: 32.85048667, longitude: -86.61145333},
        {latitude: 43.08751, longitude: -88.17786917},
        {latitude: 40.67331278, longitude: -80.64140639},
        {latitude: 40.44725889, longitude: -92.22696056},
        {latitude: 33.93011222, longitude: -89.34285194},
        {latitude: 46.88384889, longitude: -96.35089861},
        {latitude: 41.51961917, longitude: -87.40109333},
        {latitude: 31.42127556, longitude: -97.79696778},
        {latitude: 39.60416667, longitude: -116.0050597},
        {latitude: 32.46047167, longitude: -85.68003611},
        {latitude: 41.98934083, longitude: -88.10124278},
        {latitude: 48.88434111, longitude: -99.62087694},
        {latitude: 33.53456583, longitude: -89.31256917},
        {latitude: 41.43156583, longitude: -74.39191722},
        {latitude: 41.97602222, longitude: -114.6580911},
        {latitude: 41.30716667, longitude: -85.06433333},
        {latitude: 32.52883861, longitude: -94.97174556},
        {latitude: 42.57450861, longitude: -84.81143139},
        {latitude: 41.11668056, longitude: -98.05033639},
        {latitude: 32.52943944, longitude: -86.32822139},
        {latitude: 48.30079861, longitude: -102.4063514},
        {latitude: 40.65138528, longitude: -98.07978667},
        {latitude: 32.76124611, longitude: -89.53007139},
        {latitude: 32.11931306, longitude: -88.1274625},
      ],
    },
    mark: 'circle',
    params: [
      {
        name: 'sel',
        select: {type: 'interval', ...selDef},
      },
    ],
    encoding: {
      longitude: {field: 'longitude', type: 'quantitative'},
      latitude: {field: 'latitude', type: 'quantitative'},
      color: {
        condition: {param: 'sel', empty: false, value: 'goldenrod'},
        value: 'steelblue',
      },
      size: {value: 10},
    },
  };
}

export function unitNameRegex(specType: 'repeat' | 'facet', idx: number) {
  const name = UNIT_NAMES[specType][idx].replace('child_', '');
  return new RegExp(`child(.*?)_${name}`);
}

export function parentSelector(compositeType: ComposeType, index: number) {
  return compositeType === 'facet' ? `cell > g:nth-child(${index + 1})` : `${UNIT_NAMES.repeat[index]}_group`;
}

export function region(id: number, parent?: string, targetBrush?: boolean) {
  return `circleRegion(${stringValue(parent)}, ${!!targetBrush}, ${id})`;
}

export function circleRegion(
  idx:
    | number
    | {
        id: number;
        count?: number;
      }
    | {
        id: number;
        coords: number[][];
        count: number;
      },
  parent?: string,
  targetBrush?: boolean,
  radius = 40,
  segments = 20,
) {
  return `circleRegion(${idx}, ${radius}, ${segments}, ${stringValue(parent)}, ${!!targetBrush})`;
}

export function polygonRegion(idx: number, polygon: number[][], parent?: string, targetBrush?: boolean) {
  return `polygonRegion(${idx}, ${JSON.stringify(polygon)}, ${stringValue(parent)}, ${!!targetBrush})`;
}

export function clearRegion(
  idx:
    | number
    | {
        id: number;
        count?: number;
      }
    | {
        id: number;
        coords: number[][];
        count: number;
      },
  parent?: string,
  targetBrush?: boolean,
) {
  return `clear(${idx}, ${stringValue(parent)}, ${!!targetBrush})`;
}

export function multiviewRegion(key: keyof typeof hits.region, idx: number, parent?: string, targetBrush?: boolean) {
  return key.match('_clear')
    ? clearRegion(hits.region[key][idx], parent, targetBrush)
    : circleRegion(hits.region[key][idx], parent, targetBrush, 10);
}

export type BrushKeys = keyof typeof hits.interval;
export async function brush(view: View, key: BrushKeys, idx: number, parent?: string, targetBrush?: boolean) {
  const h = hits.interval[key][idx];
  if (key.match('_clear')) {
    return await clear(view, h[0], parent, !!targetBrush);
  } else {
    return await _brush(view, h[0], h[1], parent, !!targetBrush);
  }
}

export async function pt(view: View, key: keyof typeof hits.point, idx: number, parent?: string) {
  const h = hits.point[key][idx] as number;
  if (key.match('_clear')) {
    return await clear(view, h, parent);
  } else {
    return await _pt(view, h, parent);
  }
}

export function fill<T>(val: T, len: number) {
  const arr = new Array<T>(len);
  for (let i = 0; i < len; ++i) {
    arr[i] = val;
  }
  return arr;
}

export async function embed(spec: TopLevelSpec, run = true) {
  // reset DOM and Vega counters
  document.body.innerHTML = '';
  resetSVGDefIds();

  const body = document.body;
  const div = document.createElement('div');
  body.appendChild(div);

  const vgSpec = compile(spec).spec;
  const view = new View(parse(vgSpec), {container: div, renderer: 'svg'});
  return run ? await view.runAsync() : view;
}

export function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

const winSrc = ['pointermove', 'pointerup'];
export function pointerEvt(
  type: string,
  target: Element | Window,
  opts?: {clientX?: number; clientY?: number; deltaX?: number; deltaY?: number; deltaZ?: number; bubbles?: boolean},
) {
  opts.bubbles = true;
  target = winSrc.indexOf(type) < 0 ? target : window;

  target.dispatchEvent(
    new PointerEvent('pointermove', {...opts, clientX: opts.clientX - 5, clientY: opts.clientY - 5}),
  );

  target.dispatchEvent(new PointerEvent('pointermove', opts));

  target.dispatchEvent(type === 'wheel' ? new WheelEvent('wheel', opts) : new PointerEvent(type, opts));

  target.dispatchEvent(
    new PointerEvent('pointermove', {...opts, clientX: opts.clientX + 5, clientY: opts.clientY + 5}),
  );
}

export function getMark(id: number, parent?: string): HTMLElement {
  return document.querySelector(`${parent ? `g.${parent} ` : ''}g.mark-symbol.role-mark path:nth-child(${id})`);
}

export function coords(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return [Math.ceil(rect.left + rect.width / 2), Math.ceil(rect.top + rect.height / 2)];
}

function brushOrEl(el: Element, parent: string, targetBrush: boolean) {
  return !targetBrush ? el : document.querySelector(`${parent ? `g.${parent} ` : ''}g.sel_brush > path`);
}

function click(el: Element, evt: Partial<MouseEvent>) {
  pointerEvt('pointerdown', el, evt);
  pointerEvt('pointerup', window, evt);
  pointerEvt('click', el, evt);
}

async function _brush(view: View, id0: number, id1: number, parent: string, targetBrush: boolean) {
  const el0 = getMark(id0, parent);
  const el1 = getMark(id1, parent);
  const [mdX, mdY] = coords(el0);
  const [muX, muY] = coords(el1);
  pointerEvt('pointerdown', brushOrEl(el0, parent, targetBrush), {clientX: mdX, clientY: mdY});
  pointerEvt('pointerup', window, {clientX: muX, clientY: muY});
  return (await view.runAsync()).data('sel_store');
}

export async function _pt(view: View, id: number, parent: string, shiftKey?: boolean) {
  const el = getMark(id, parent);
  const [clientX, clientY] = coords(el);
  click(el, {clientX, clientY, shiftKey});
  return (await view.runAsync()).data('sel_store');
}

export async function clear(view: View, id: number, parent: string, shiftKey?: boolean) {
  const bg = document.querySelector(`${parent ? `g.${parent} ` : ''}path.background`);
  const el = getMark(id, parent);
  let [clientX, clientY] = coords(el);
  clientX += 10;
  clientY -= 10;
  click(bg, {clientX, clientY, shiftKey});
  return (await view.runAsync()).data('sel_store');
}

export async function zoom(view: View, id: number, delta: number, parent: string, targetBrush: boolean) {
  const el = getMark(id, parent);
  const [clientX, clientY] = coords(el);
  pointerEvt('wheel', brushOrEl(el, parent, targetBrush), {
    clientX,
    clientY,
    deltaX: delta,
    deltaY: delta,
    deltaZ: delta,
  });
  pointerEvt('wheel', brushOrEl(el, parent, targetBrush), {
    clientX,
    clientY,
    deltaX: Math.sign(delta),
    deltaY: Math.sign(delta),
    deltaZ: Math.sign(delta),
  });
  return (await view.runAsync()).data('sel_store');
}

export function getState(signals: string[], data: string[]) {
  return `getState(${JSON.stringify(signals)}, ${JSON.stringify(data)})`;
}
export function getSignal(name: string) {
  return `getSignal('${name}')`;
}

export function setSignal(name: string, value: any) {
  return `setSignal(${stringValue(name)}, ${value})`;
}
