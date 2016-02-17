import {QUANTITATIVE} from '../type';
import {toMap} from '../util';

/**
 * Binning properties or boolean flag for determining whether to bin data or not.
 */
export interface BinProperties {
  /**
   * The minimum bin value to consider. If unspecified, the minimum value of the specified field is used.
   */
  min?: number;
  /**
   * The maximum bin value to consider. If unspecified, the maximum value of the specified field is used.
   */
  max?: number;
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
   */
  steps?: number[];
  /**
   * A minimum allowable step size (particularly useful for integer values).
   */
  minstep?: number;
  /**
   * Scale factors indicating allowable subdivisions. The default value is [5, 2], which indicates that for base 10 numbers (the default base), the method may consider dividing bin sizes by 5 and/or 2. For example, for an initial step size of 10, the method can check if bin sizes of 2 (= 10/5), 5 (= 10/2), or 1 (= 10/(5*2)) might also satisfy the given constraints.
   */
  div?: number[];
  /**
   * Maximum number of bins.
   * @minimum 2
   */
  maxbins?: number;
}


export var binProperties = {
  default: false, // TODO: remove this once we remove schema.instantiate
  oneOf: [{
    type: 'object',
    properties: {
      min: {
        type: 'number'
      },
      max: {
        type: 'number'
      },
      base: {
        type: 'number'
      },
      step: {
        type: 'number'
      },
      steps: {
        type: 'array'
      },
      minstep: {
        type: 'number'
      },
      div: {
        type: 'array'
      },
      maxbins: {
        type: 'integer'
      }
    },
  }, {
    type: 'boolean'
  }],
  supportedTypes: toMap([QUANTITATIVE]) // TODO: add O after finishing #81
};
