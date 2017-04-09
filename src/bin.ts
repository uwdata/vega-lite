import {isBoolean} from './util';

export interface BinBase {
  /**
   * The number base to use for automatic bin determination (default is base 10).
   */
  base?: number;
  /**
   * An exact step size to use between bins. If provided, options such as maxbins will be ignored.
   */
  step?: number;
  /**
   * An array of allowable step sizes to choose from.
   * @minItems 1
   */
  steps?: number[];
  /**
   * A minimum allowable step size (particularly useful for integer values).
   */
  minstep?: number;
  /**
   * Scale factors indicating allowable subdivisions. The default value is [5, 2], which indicates that for base 10 numbers (the default base), the method may consider dividing bin sizes by 5 and/or 2. For example, for an initial step size of 10, the method can check if bin sizes of 2 (= 10/5), 5 (= 10/2), or 1 (= 10/(5*2)) might also satisfy the given constraints.
   * @minItems 1
   */
  divide?: number[];
  /**
   * Maximum number of bins.
   * @minimum 2
   */
  maxbins?: number;
  /**
   * If true (the default), attempts to make the bin boundaries use human-friendly boundaries, such as multiples of ten.
   */
  nice?: boolean;
}

/**
 * Binning properties or boolean flag for determining whether to bin data or not.
 */
export interface Bin extends BinBase {
  /**
   * A two-element (`[min, max]`) array indicating the range of desired bin values.
   * @minItems 2
   * @maxItems 2
   */
  extent?: number[];  // VgBinTransform uses a different extent so we need to pull this out.
}

export function binToString(bin: Bin | boolean) {
  if (isBoolean(bin)) {
    return 'bin';
  }
  return 'bin' + Object.keys(bin).map(p => `_${p}_${bin[p]}`).join('');
}
