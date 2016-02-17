import {duplicate} from '../util';
import {mergeDeep} from './schemautil';

export interface AxisConfig {
  // General
  /**
   * Width of the axis line
   */
  axisWidth?: number;
  /**
   * A string indicating if the axis (and any gridlines) should be placed above or below the data marks.
   */
  layer?: string;
  /**
   * The offset, in pixels, by which to displace the axis from the edge of the enclosing group or data rectangle.
   */
  offset?: number;
  /**
   * The orientation of the axis. One of top, bottom, left or right. The orientation can be used to further specialize the axis type (e.g., a y axis oriented for the right edge of the chart).
   * @enum ["top", "right", "left", "bottom"]
   */
  orient?: string;

  // Grid
  /**
   * A flag indicate if gridlines should be created in addition to ticks. If `grid` is unspecified, the default value is `true` for ROW and COL. For X and Y, the default value is `true` for quantitative and time fields and `false` otherwise.
   */
  grid?: boolean;

  // Labels
  /**
   * Enable or disable labels.
   */
  labels?: boolean;
  /**
   * The rotation angle of the axis labels.
   */
  labelAngle?: number;
  /**
   * Truncate labels that are too long.
   * @minimum 1
   */
  labelMaxLength?: number;
  /**
   * Whether month and day names should be abbreviated.
   */
  shortTimeLabels?: boolean;

  // Ticks
  /**
   * If provided, sets the number of minor ticks between major ticks (the value 9 results in decimal subdivision). Only applicable for axes visualizing quantitative scales.
   */
  subdivide?: number;
  /**
   * A desired number of ticks, for axes visualizing quantitative scales. The resulting number may be different so that values are "nice" (multiples of 2, 5, 10) and lie within the underlying scale's range.
   * @minimum 0
   */
  ticks?: number;
  /**
   * The padding, in pixels, between ticks and text labels.
   */
  tickPadding?: number;
  /**
   * The size, in pixels, of major, minor and end ticks.
   * @minimum 0
   */
  tickSize?: number;
  /**
   * The size, in pixels, of major ticks.
   * @minimum 0
   */
  tickSizeMajor?: number;
  /**
   * The size, in pixels, of minor ticks.
   * @minimum 0
   */
  tickSizeMinor?: number;
  /**
   * The size, in pixels, of end ticks.
   * @minimum 0
   */
  tickSizeEnd?: number;

  // Title
  /**
   * A title offset value for the axis.
   */
  titleOffset?: number;
  /**
   * Max length for axis title if the title is automatically generated from the field's description. By default, this is automatically based on cell size and characterWidth property.
   * @minimum 0
   */
  titleMaxLength?: number;
  /**
   * Character width for automatically determining title max length.
   */
  characterWidth?: number;

  /**
   * Optional mark property definitions for custom axis styling.
   */
  properties?: any; // TODO: replace
}

export const defaultAxisConfig: AxisConfig = {
  labels: true,
  labelMaxLength: 25,
  characterWidth: 6
};

export const defaultFacetAxisConfig: AxisConfig = {
  axisWidth: 0,
  labels: true,
  grid: false,
  tickSize: 0
};

export interface AxisProperties extends AxisConfig {
  /**
   * The formatting pattern for axis labels. If undefined, a good format is automatically determined. Vega-Lite uses D3's format pattern and automatically switches to datetime formatters.
   */
  format?: string; // default value determined by config.format anyway
  /**
   * A title for the axis. Shows field name and its function by default.
   */
  title?: string;
  values?: number[];
}

export const axisConfig = {
  type: 'object',
  properties: {
    // General
    axisWidth: {
      type: 'integer'
    },
    layer: {
      type: 'string'
    },
    offset: {
      type: 'number'
    },
    orient: {
      type: 'string'
    },

    // grid
    grid: {
      type: 'boolean'
    },
    // Labels
    labels: {
      type: 'boolean'
    },
    labelAngle: {
      type: 'number'
    },
    labelMaxLength: {
      type: 'integer'
    },
    shortTimeLabels: {
      type: 'boolean'
    },

    // Ticks
    subdivide: {
      type: 'number'
    },
    ticks: {
      type: 'integer'
    },
    tickPadding: {
      type: 'integer'
    },
    tickSize: {
      type: 'integer'
    },
    tickSizeMajor: {
      type: 'integer'
    },
    tickSizeMinor: {
      type: 'integer'
    },
    tickSizeEnd: {
      type: 'integer'
    },

    // Title
    titleOffset: {
      type: 'integer'
    },
    titleMaxLength: {
      type: 'integer'
    },
    characterWidth: {
      type: 'integer'
    },

    // TODO: replace
    properties: {
      type: 'object'
    }
  }
};

const axisProperties = mergeDeep(duplicate(axisConfig), {
  properties: {
    // Labels
    format: {
      type: 'string'
    },
    title: {
      type: 'string'
    },
    values: {
      type: 'array',
    }
  }
});

export var axis = {
  oneOf: [
    axisProperties,
    {type: 'boolean'}]
};
