import { Channel } from '../../channel';
import { Config } from '../../config';
import { Mark } from '../../mark';
import { Scale, ScaleType, Scheme, Range } from '../../scale';
import { Type } from '../../type';
import { VgRange } from '../../vega.schema';
export declare type RangeMixins = {
    range: Range;
} | {
    rangeStep: number;
} | {
    scheme: Scheme;
};
export declare function parseRange(scale: Scale): VgRange;
/**
 * Return mixins that includes one of the range properties (range, rangeStep, scheme).
 */
export default function rangeMixins(channel: Channel, scaleType: ScaleType, type: Type, specifiedScale: Scale, config: Config, zero: boolean, mark: Mark, topLevelSize: number | undefined, xyRangeSteps: number[]): RangeMixins;
