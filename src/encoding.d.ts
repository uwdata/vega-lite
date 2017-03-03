import { FieldDef, PositionFieldDef, LegendFieldDef, OrderFieldDef, ValueDef } from './fielddef';
import { Channel } from './channel';
import { Facet } from './facet';
export interface Encoding {
    /**
     * X coordinates for `point`, `circle`, `square`,
     * `line`, `rule`, `text`, and `tick`
     * (or to width and height for `bar` and `area` marks).
     */
    x?: PositionFieldDef | ValueDef<number>;
    /**
     * Y coordinates for `point`, `circle`, `square`,
     * `line`, `rule`, `text`, and `tick`
     * (or to width and height for `bar` and `area` marks).
     */
    y?: PositionFieldDef | ValueDef<number>;
    /**
     * X2 coordinates for ranged `bar`, `rule`, `area`
     */
    x2?: FieldDef | ValueDef<number>;
    /**
     * Y2 coordinates for ranged `bar`, `rule`, `area`
     */
    y2?: FieldDef | ValueDef<number>;
    /**
     * Color of the marks – either fill or stroke color based on mark type.
     * (By default, fill color for `area`, `bar`, `tick`, `text`, `circle`, and `square` /
     * stroke color for `line` and `point`.)
     */
    color?: LegendFieldDef | ValueDef<string>;
    /**
     * Opacity of the marks – either can be a value or in a range.
     */
    opacity?: LegendFieldDef | ValueDef<number>;
    /**
     * Size of the mark.
     * - For `point`, `square` and `circle`
     * – the symbol size, or pixel area of the mark.
     * - For `bar` and `tick` – the bar and tick's size.
     * - For `text` – the text's font size.
     * - Size is currently unsupported for `line` and `area`.
     */
    size?: LegendFieldDef | ValueDef<number>;
    /**
     * The symbol's shape (only for `point` marks). The supported values are
     * `"circle"` (default), `"square"`, `"cross"`, `"diamond"`, `"triangle-up"`,
     * or `"triangle-down"`, or else a custom SVG path string.
     */
    shape?: LegendFieldDef | ValueDef<string>;
    /**
     * Additional levels of detail for grouping data in aggregate views and
     * in line and area marks without mapping data to a specific visual channel.
     */
    detail?: FieldDef | FieldDef[];
    /**
     * Text of the `text` mark.
     */
    text?: FieldDef | ValueDef<string | number>;
    /**
     * Anchor position of the `label` mark.
     */
    anchor?: FieldDef | ValueDef<string>;
    /**
     * Offset of the `label` mark from the mark its labeling.
     */
    offset?: FieldDef | ValueDef<number>;
    /**
     * stack order for stacked marks or order of data points in line marks.
     */
    order?: OrderFieldDef | OrderFieldDef[];
}
export interface EncodingWithFacet extends Encoding, Facet {
}
export declare function channelHasField(encoding: EncodingWithFacet, channel: Channel): boolean;
export declare function isAggregate(encoding: EncodingWithFacet): boolean;
export declare function isRanged(encoding: EncodingWithFacet): boolean;
export declare function fieldDefs(encoding: EncodingWithFacet): FieldDef[];
export declare function forEach(mapping: any, f: (fd: FieldDef, c: Channel) => void, thisArg?: any): void;
export declare function reduce<T>(mapping: any, f: (acc: any, fd: FieldDef, c: Channel) => any, init: T, thisArg?: any): any;
