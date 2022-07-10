import type {Binding, Color, Cursor, Stream, Vector2} from 'vega';
import {isObject} from 'vega-util';
import {SingleDefUnitChannel} from './channel.js';
import {FieldName, PrimitiveValue} from './channeldef.js';
import {DateTime} from './datetime.js';
import {ParameterName} from './parameter.js';
import {Dict} from './util.js';

export const SELECTION_ID = '_vgsid_';
export type SelectionType = 'point' | 'interval' | 'region';
export type SelectionResolution = 'global' | 'union' | 'intersect';

export type SelectionInit = PrimitiveValue | DateTime;
export type SelectionInitInterval = Vector2<boolean> | Vector2<number> | Vector2<string> | Vector2<DateTime>;
export type SelectionInitMapping = Dict<SelectionInit>;
export type SelectionInitIntervalMapping = Dict<SelectionInitInterval>;
export type LegendStreamBinding = {legend: string | Stream};
export type LegendBinding = 'legend' | LegendStreamBinding;

export interface BaseSelectionConfig<T extends SelectionType = SelectionType> {
  /**
   * Determines the default event processing and data query for the selection. Vega-Lite currently supports two selection types:
   *
   * - `"point"` -- to select multiple discrete data values; the first value is selected on `click` and additional values toggled on shift-click.
   * - `"interval"` -- to select a continuous range of data values on `drag`.
   */
  type: T;

  /**
   * Clears the selection, emptying it of all values. This property can be a
   * [Event Stream](https://vega.github.io/vega/docs/event-streams/) or `false` to disable clear.
   *
   * __Default value:__ `dblclick`.
   *
   * __See also:__ [`clear` examples ](https://vega.github.io/vega-lite/docs/selection.html#clear) in the documentation.
   */
  clear?: Stream | string | boolean;

  /**
   * A [Vega event stream](https://vega.github.io/vega/docs/event-streams/) (object or selector) that triggers the selection.
   * For interval selections, the event stream must specify a [start and end](https://vega.github.io/vega/docs/event-streams/#between-filters).
   *
   * __See also:__ [`on` examples](https://vega.github.io/vega-lite/docs/selection.html#on) in the documentation.
   */
  on?: Stream | string;

  /**
   * With layered and multi-view displays, a strategy that determines how
   * selections' data queries are resolved when applied in a filter transform,
   * conditional encoding rule, or scale domain.
   *
   * One of:
   * - `"global"` -- only one brush exists for the entire SPLOM. When the user begins to drag, any previous brushes are cleared, and a new one is constructed.
   * - `"union"` -- each cell contains its own brush, and points are highlighted if they lie within _any_ of these individual brushes.
   * - `"intersect"` -- each cell contains its own brush, and points are highlighted only if they fall within _all_ of these individual brushes.
   *
   * __Default value:__ `global`.
   *
   * __See also:__ [`resolve` examples](https://vega.github.io/vega-lite/docs/selection.html#resolve) in the documentation.
   */
  resolve?: SelectionResolution;

  // TODO(https://github.com/vega/vega-lite/issues/2596).
  // predicate?: string;
  // domain?: SelectionDomain;

  /**
   * An array of encoding channels. The corresponding data field values
   * must match for a data tuple to fall within the selection.
   *
   * __See also:__ The [projection with `encodings` and `fields` section](https://vega.github.io/vega-lite/docs/selection.html#project) in the documentation.
   */
  encodings?: SingleDefUnitChannel[];

  /**
   * An array of field names whose values must match for a data tuple to
   * fall within the selection.
   *
   * __See also:__ The [projection with `encodings` and `fields` section](https://vega.github.io/vega-lite/docs/selection.html#project) in the documentation.
   */
  fields?: FieldName[];
}

export interface PointSelectionConfig extends BaseSelectionConfig<'point'> {
  /**
   * Controls whether data values should be toggled (inserted or removed from a point selection)
   * or only ever inserted into point selections.
   *
   * One of:
   * - `true` -- the default behavior, which corresponds to `"event.shiftKey"`.  As a result, data values are toggled when the user interacts with the shift-key pressed.
   * - `false` -- disables toggling behaviour; the selection will only ever contain a single data value corresponding to the most recent interaction.
   * - A [Vega expression](https://vega.github.io/vega/docs/expressions/) which is re-evaluated as the user interacts. If the expression evaluates to `true`, the data value is toggled into or out of the point selection. If the expression evaluates to `false`, the point selection is first cleared, and the data value is then inserted. For example, setting the value to the Vega expression `"true"` will toggle data values
   * without the user pressing the shift-key.
   *
   * __Default value:__ `true`
   *
   * __See also:__ [`toggle` examples](https://vega.github.io/vega-lite/docs/selection.html#toggle) in the documentation.
   */
  toggle?: string | boolean;

  /**
   * When true, an invisible voronoi diagram is computed to accelerate discrete
   * selection. The data value _nearest_ the mouse cursor is added to the selection.
   *
   * __Default value:__ `false`, which means that data values must be interacted with directly (e.g., clicked on) to be added to the selection.
   *
   * __See also:__ [`nearest` examples](https://vega.github.io/vega-lite/docs/selection.html#nearest) documentation.
   */
  nearest?: boolean;
}

// Similar to BaseMarkConfig but the field documentations are specificly for an interval mark.
export interface BrushConfig {
  /**
   * The fill color of the interval mark.
   *
   * __Default value:__ `"#333333"`
   *
   */
  fill?: Color;

  /**
   * The fill opacity of the interval mark (a value between `0` and `1`).
   *
   * __Default value:__ `0.125`
   */
  fillOpacity?: number;

  /**
   * The stroke color of the interval mark.
   *
   * __Default value:__ `"#ffffff"`
   */
  stroke?: Color;

  /**
   * The stroke opacity of the interval mark (a value between `0` and `1`).
   */
  strokeOpacity?: number;

  /**
   * The stroke width of the interval mark.
   */
  strokeWidth?: number;

  /**
   * An array of alternating stroke and space lengths, for creating dashed or dotted lines.
   */
  strokeDash?: number[];

  /**
   * The offset (in pixels) with which to begin drawing the stroke dash array.
   */
  strokeDashOffset?: number;

  /**
   * The mouse cursor used over the interval mark. Any valid [CSS cursor type](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor#Values) can be used.
   */
  cursor?: Cursor;
}

export interface IntervalSelectionConfig extends BaseSelectionConfig<'interval'> {
  /**
   * When truthy, allows a user to interactively move an interval selection
   * back-and-forth. Can be `true`, `false` (to disable panning), or a
   * [Vega event stream definition](https://vega.github.io/vega/docs/event-streams/)
   * which must include a start and end event to trigger continuous panning.
   * Discrete panning (e.g., pressing the left/right arrow keys) will be supported in future versions.
   *
   * __Default value:__ `true`, which corresponds to `[pointerdown, window:pointerup] > window:pointermove!`.
   * This default allows users to clicks and drags within an interval selection to reposition it.
   *
   * __See also:__ [`translate` examples](https://vega.github.io/vega-lite/docs/selection.html#translate) in the documentation.
   */
  translate?: string | boolean;

  /**
   * When truthy, allows a user to interactively resize an interval selection.
   * Can be `true`, `false` (to disable zooming), or a [Vega event stream
   * definition](https://vega.github.io/vega/docs/event-streams/). Currently,
   * only `wheel` events are supported,
   * but custom event streams can still be used to specify filters, debouncing, and throttling.
   * Future versions will expand the set of events that can trigger this transformation.
   *
   * __Default value:__ `true`, which corresponds to `wheel!`. This default allows users to use the mouse wheel to resize an interval selection.
   *
   * __See also:__ [`zoom` examples](https://vega.github.io/vega-lite/docs/selection.html#zoom) in the documentation.
   */
  zoom?: string | boolean;

  /**
   * An interval selection also adds a rectangle mark to depict the
   * extents of the interval. The `mark` property can be used to customize the
   * appearance of the mark.
   *
   * __See also:__ [`mark` examples](https://vega.github.io/vega-lite/docs/selection.html#mark) in the documentation.
   */
  mark?: BrushConfig;
}

export interface RegionSelectionConfig extends BaseSelectionConfig<'region'> {
  /**
   * A region selection also adds a path mark to depict the
   * shape of the region. The `mark` property can be used to customize the
   * appearance of the mark.
   *
   * __See also:__ [`mark` examples](https://vega.github.io/vega-lite/docs/selection.html#mark) in the documentation.
   */
  mark?: BrushConfig;

  /**
   * An array of field names whose values must match for a data tuple to
   * fall within the selection.
   *
   * __See also:__ The [projection with `encodings` and `fields` section](https://vega.github.io/vega-lite/docs/selection.html#project) in the documentation.
   */
  fields?: FieldName[];
}

export interface SelectionParameter<T extends SelectionType = SelectionType> {
  /**
   * Required. A unique name for the selection parameter. Selection names should be valid JavaScript identifiers: they should contain only alphanumeric characters (or "$", or "_") and may not start with a digit. Reserved keywords that may not be used as parameter names are "datum", "event", "item", and "parent".
   */
  name: ParameterName;

  /**
   * Determines the default event processing and data query for the selection. Vega-Lite currently supports two selection types:
   *
   * - `"point"` -- to select multiple discrete data values; the first value is selected on `click` and additional values toggled on shift-click.
   * - `"interval"` -- to select a continuous range of data values on `drag`.
   */
  select:
  | T
  | (T extends 'point'
    ? PointSelectionConfig
    : T extends 'interval'
    ? IntervalSelectionConfig
    : T extends 'region'
    ? RegionSelectionConfig
    : never);

  /**
   * Initialize the selection with a mapping between [projected channels or field names](https://vega.github.io/vega-lite/docs/selection.html#project) and initial values.
   *
   * __See also:__ [`init`](https://vega.github.io/vega-lite/docs/value.html) documentation.
   */
  value?: T extends 'point'
  ? SelectionInit | SelectionInitMapping[]
  : T extends 'interval'
  ? SelectionInitIntervalMapping
  : never;

  /**
   * When set, a selection is populated by input elements (also known as dynamic query widgets)
   * or by interacting with the corresponding legend. Direct manipulation interaction is disabled by default;
   * to re-enable it, set the selection's [`on`](https://vega.github.io/vega-lite/docs/selection.html#common-selection-properties) property.
   *
   * Legend bindings are restricted to selections that only specify a single field or encoding.
   *
   * Query widget binding takes the form of Vega's [input element binding definition](https://vega.github.io/vega/docs/signals/#bind)
   * or can be a mapping between projected field/encodings and binding definitions.
   *
   * __See also:__ [`bind`](https://vega.github.io/vega-lite/docs/bind.html) documentation.
   */
  bind?: T extends 'point'
  ? Binding | Record<string, Binding> | LegendBinding
  : T extends 'interval'
  ? 'scales'
  : never;
}

export type TopLevelSelectionParameter = SelectionParameter & {
  /**
   * By default, top-level selections are applied to every view in the visualization.
   * If this property is specified, selections will only be applied to views with the given names.
   */
  views?: string[];
};

export type ParameterExtent =
  | {
    /**
     * The name of a parameter.
     */
    param: ParameterName;

    /**
     * If a selection parameter is specified, the field name to extract selected values for
     * when the selection is [projected](https://vega.github.io/vega-lite/docs/selection.html#project) over multiple fields or encodings.
     */
    field?: FieldName;
  }
  | {
    /**
     * The name of a parameter.
     */
    param: ParameterName;

    /**
     * If a selection parameter is specified, the encoding channel to extract selected values for
     * when a selection is [projected](https://vega.github.io/vega-lite/docs/selection.html#project) over multiple fields or encodings.
     */
    encoding?: SingleDefUnitChannel;
  };

export type PointSelectionConfigWithoutType = Omit<PointSelectionConfig, 'type'>;

export type IntervalSelectionConfigWithoutType = Omit<IntervalSelectionConfig, 'type'>;

export type RegionSelectionConfigWithoutType = Omit<RegionSelectionConfig, 'type'>;

export interface SelectionConfig {
  /**
   * The default definition for a [`point`](https://vega.github.io/vega-lite/docs/parameter.html#select) selection. All properties and transformations
   *  for a point selection definition (except `type`) may be specified here.
   *
   * For instance, setting `point` to `{"on": "dblclick"}` populates point selections on double-click by default.
   */
  point?: PointSelectionConfigWithoutType;

  /**
   * The default definition for an [`interval`](https://vega.github.io/vega-lite/docs/parameter.html#select) selection. All properties and transformations
   * for an interval selection definition (except `type`) may be specified here.
   *
   * For instance, setting `interval` to `{"translate": false}` disables the ability to move
   * interval selections by default.
   */
  interval?: IntervalSelectionConfigWithoutType;

  /**
   * The default definition for an [`region`](https://vega.github.io/vega-lite/docs/parameter.html#select) selection. All properties and transformations
   * for an region selection definition (except `type`) may be specified here.
   */
  region?: RegionSelectionConfigWithoutType;
}

export const defaultConfig: SelectionConfig = {
  point: {
    on: 'click',
    fields: [SELECTION_ID],
    toggle: 'event.shiftKey',
    resolve: 'global',
    clear: 'dblclick',
  },
  interval: {
    on: '[pointerdown, window:pointerup] > window:pointermove!',
    encodings: ['x', 'y'],
    translate: '[pointerdown, window:pointerup] > window:pointermove!',
    zoom: 'wheel!',
    mark: {fill: '#333', fillOpacity: 0.125, stroke: 'white'},
    resolve: 'global',
    clear: 'dblclick',
  },
  region: {
    on: '[mousedown, window:mouseup] > window:mousemove!',
    resolve: 'global',
    fields: [SELECTION_ID],
    mark: {fill: '#333', fillOpacity: 0.125, stroke: 'gray', strokeWidth: 2, strokeDash: [8, 5]},
    clear: 'dblclick',
  }
};

export function isLegendBinding(bind: any): bind is LegendBinding {
  return bind === 'legend' || !!bind?.legend;
}

export function isLegendStreamBinding(bind: any): bind is LegendStreamBinding {
  return isLegendBinding(bind) && isObject(bind);
}

export function isSelectionParameter(param: any): param is SelectionParameter {
  return !!param?.['select'];
}
