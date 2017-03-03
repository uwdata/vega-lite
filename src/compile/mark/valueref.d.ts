/**
 * Utility files for producing Vega ValueRef for marks
 */
import { Channel } from '../../channel';
import { Config } from '../../config';
import { ChannelDef, FieldDef, FieldRefOption } from '../../fielddef';
import { Scale } from '../../scale';
import { StackProperties } from '../../stack';
import { VgValueRef } from '../../vega.schema';
/**
 * @return Vega ValueRef for stackable x or y
 */
export declare function stackable(channel: Channel, channelDef: ChannelDef, scaleName: string, scale: Scale, stack: StackProperties, defaultRef: VgValueRef): VgValueRef;
/**
 * @return Vega ValueRef for stackable x2 or y2
 */
export declare function stackable2(channel: Channel, aFieldDef: FieldDef, a2fieldDef: FieldDef, scaleName: string, scale: Scale, stack: StackProperties, defaultRef: VgValueRef): VgValueRef;
/**
 * Value Ref for binned fields
 */
export declare function bin(fieldDef: FieldDef, scaleName: string, side: 'start' | 'end', offset?: number): VgValueRef;
export declare function fieldRef(fieldDef: FieldDef, scaleName: string, opt: FieldRefOption, offset?: number | VgValueRef): VgValueRef;
export declare function band(scaleName: string, band?: number | boolean): VgValueRef;
export declare function binMidSignal(fieldDef: FieldDef, scaleName: string): {
    scale: string;
    signal: string;
};
/**
 * @returns {VgValueRef} Value Ref for xc / yc or mid point for other channels.
 */
export declare function midPoint(channel: Channel, channelDef: ChannelDef, scaleName: string, scale: Scale, defaultRef: VgValueRef | 'base' | 'baseOrMax'): VgValueRef;
export declare function midX(config: Config): VgValueRef;
export declare function midY(config: Config): VgValueRef;
