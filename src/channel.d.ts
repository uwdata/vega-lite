import { Encoding } from './encoding';
import { Facet } from './facet';
import { Mark } from './mark';
import { RangeType } from './compile/scale/type';
import { ScaleType } from './scale';
export declare namespace Channel {
    const ROW: 'row';
    const COLUMN: 'column';
    const X: 'x';
    const Y: 'y';
    const X2: 'x2';
    const Y2: 'y2';
    const COLOR: 'color';
    const SHAPE: 'shape';
    const SIZE: 'size';
    const OPACITY: 'opacity';
    const TEXT: 'text';
    const ORDER: 'order';
    const DETAIL: 'detail';
    const OFFSET: 'offset';
    const ANCHOR: 'anchor';
}
export declare type Channel = keyof Encoding | keyof Facet;
export declare const X: "x";
export declare const Y: "y";
export declare const X2: "x2";
export declare const Y2: "y2";
export declare const ROW: "row";
export declare const COLUMN: "column";
export declare const SHAPE: "shape";
export declare const SIZE: "size";
export declare const COLOR: "color";
export declare const TEXT: "text";
export declare const DETAIL: "detail";
export declare const ANCHOR: "anchor";
export declare const OFFSET: "offset";
export declare const ORDER: "order";
export declare const OPACITY: "opacity";
export declare const CHANNELS: Channel[];
export declare const UNIT_CHANNELS: ("text" | "x" | "y" | "x2" | "y2" | "color" | "opacity" | "size" | "shape" | "detail" | "anchor" | "offset" | "order")[];
export declare const UNIT_SCALE_CHANNELS: ("x" | "y" | "color" | "opacity" | "size" | "shape")[];
export declare const SCALE_CHANNELS: ("x" | "y" | "color" | "opacity" | "size" | "shape" | "row" | "column")[];
export declare const NONSPATIAL_CHANNELS: ("text" | "color" | "opacity" | "size" | "shape" | "detail" | "order")[];
export declare const NONSPATIAL_SCALE_CHANNELS: ("color" | "opacity" | "size" | "shape")[];
/** Channels that can serve as groupings for stacked charts. */
export declare const STACK_GROUP_CHANNELS: ("color" | "opacity" | "size" | "detail" | "order")[];
export interface SupportedMark {
    point?: boolean;
    tick?: boolean;
    rule?: boolean;
    circle?: boolean;
    square?: boolean;
    bar?: boolean;
    rect?: boolean;
    line?: boolean;
    area?: boolean;
    text?: boolean;
    label?: boolean;
}
/**
 * Return whether a channel supports a particular mark type.
 * @param channel  channel name
 * @param mark the mark type
 * @return whether the mark supports the channel
 */
export declare function supportMark(channel: Channel, mark: Mark): boolean;
/**
 * Return a dictionary showing whether a channel supports mark type.
 * @param channel
 * @return A dictionary mapping mark types to boolean values.
 */
export declare function getSupportedMark(channel: Channel): SupportedMark;
export interface SupportedRole {
    measure: boolean;
    dimension: boolean;
}
/**
 * Return whether a channel supports dimension / measure role
 * @param  channel
 * @return A dictionary mapping role to boolean values.
 */
export declare function getSupportedRole(channel: Channel): SupportedRole;
export declare function hasScale(channel: Channel): boolean;
export declare function supportScaleType(channel: Channel, scaleType: ScaleType): boolean;
export declare function getRangeType(channel: Channel): RangeType;
