import {isNumber, isObject} from 'vega-util';
import {Config} from '../config';
import {PositionFieldDef} from '../fielddef';
import {isMarkDef, MarkDef} from '../mark';
import {AggregatedFieldDef, CalculateTransform} from '../transform';
import {Flag, keys} from '../util';
import {Encoding, extractTransformsFromEncoding} from './../encoding';
import * as log from './../log';
import {GenericUnitSpec, NormalizedLayerSpec, NormalizedUnitSpec} from './../spec';
import {Orient} from './../vega.schema';
import {compositeMarkContinuousAxis, compositeMarkOrient, filterUnsupportedChannels, GenericCompositeMarkDef, makeCompositeAggregatePartFactory, partLayerMixins, PartsMixins} from './common';

export const BOXPLOT: 'boxplot' = 'boxplot';
export type BoxPlot = typeof BOXPLOT;

export type BoxPlotPart = 'box' | 'median' | 'outliers' | 'rule' | 'ticks';

const BOXPLOT_PART_INDEX: Flag<BoxPlotPart> = {
  box: 1,
  median: 1,
  outliers: 1,
  rule: 1,
  ticks: 1
};

export const BOXPLOT_PARTS = keys(BOXPLOT_PART_INDEX);

export type BoxPlotPartsMixins = PartsMixins<BoxPlotPart>;

export interface BoxPlotConfig extends BoxPlotPartsMixins {
  /** Size of the box and median tick of a box plot */
  size?: number;

  /**
   * The extent of the whiskers. Available options include:
   * - `"min-max"`: min and max are the lower and upper whiskers respectively.
   * - A number representing multiple of the interquartile range (Q3-Q1).  This number will be multiplied by the IQR. the product will be added to the third quartile to get the upper whisker and subtracted from the first quartile to get the lower whisker.
   *
   * __Default value:__ `1.5`.
   */
  extent?: 'min-max' | number;
}

export type BoxPlotDef = GenericCompositeMarkDef<BoxPlot> & BoxPlotConfig & {
  /**
   * Orientation of the box plot.  This is normally automatically determined based on types of fields on x and y channels. However, an explicit `orient` be specified when the orientation is ambiguous.
   *
   * __Default value:__ `"vertical"`.
   */
  orient?: Orient;
};

export interface BoxPlotConfigMixins {
  /**
   * Box Config
   */
  boxplot?: BoxPlotConfig;
}

export function normalizeBoxPlot(spec: GenericUnitSpec<Encoding<string>, BoxPlot | BoxPlotDef>, config: Config): NormalizedLayerSpec {
  spec = filterUnsupportedChannels(spec, BOXPLOT);

  // TODO: use selection
  const {mark, encoding, selection, projection: _p, ...outerSpec} = spec;
  const markDef: BoxPlotDef = isMarkDef(mark) ? mark : {type: mark};

  // TODO(https://github.com/vega/vega-lite/issues/3702): add selection support
  if (selection) {
    log.warn(log.message.selectionNotSupported('boxplot'));
  }

  const extent = markDef.extent || config.boxplot.extent;
  const sizeValue = markDef.size || config.boxplot.size;
  const isMinMax = !isNumber(extent);


  const {transform, continuousAxisChannelDef, continuousAxis, groupby, encodingWithoutContinuousAxis, tickOrient} = boxParams(spec, extent);

  const {color, size, ...encodingWithoutSizeColorAndContinuousAxis} = encodingWithoutContinuousAxis;

  const makeBoxPlotPart = (sharedEncoding: Encoding<string>) => {
    return makeCompositeAggregatePartFactory<BoxPlotPartsMixins>(
      markDef,
      continuousAxis,
      continuousAxisChannelDef,
      sharedEncoding,
      config.boxplot
    );
  };

  const makeBoxPlotExent = makeBoxPlotPart(encodingWithoutSizeColorAndContinuousAxis);

  const endTick: MarkDef = {type: 'tick', color: 'black', opacity: 1, orient: tickOrient};

  const bar: MarkDef = {type: 'bar', ...(sizeValue ? {size: sizeValue} : {})};

  const midTick: MarkDef = {
    type: 'tick',
    ...(isObject(config.boxplot.median) && config.boxplot.median.color ? {color: config.boxplot.median.color} : {}),
    ...(sizeValue ? {size: sizeValue} : {}),
    orient: tickOrient
  };

  const boxLayer: NormalizedUnitSpec[] = [
    ...makeBoxPlotExent('rule', 'rule', 'lower_whisker', 'lower_box'),
    ...makeBoxPlotExent('rule', 'rule', 'upper_box', 'upper_whisker'),
    ...makeBoxPlotExent('ticks', endTick, 'lower_whisker'),
    ...makeBoxPlotExent('ticks', endTick, 'upper_whisker'),
    ...makeBoxPlotPart(encodingWithoutContinuousAxis)('box', bar, 'lower_box', 'upper_box'),
    ...makeBoxPlotPart({...encodingWithoutSizeColorAndContinuousAxis, size})('median', midTick, 'mid_box'),
  ];

  let outliersLayerMixins: NormalizedUnitSpec[] = [];
  
  if (!isMinMax) {
    const lowerBoxExpr: string = 'datum.lower_box_' + continuousAxisChannelDef.field;
    const upperBoxExpr: string = 'datum.upper_box_' + continuousAxisChannelDef.field;
    const iqrExpr = `(${upperBoxExpr} - ${lowerBoxExpr})`;
    const lowerWhiskerExpr = `${lowerBoxExpr} - ${extent} * ${iqrExpr}`;
    const upperWhiskerExpr = `${upperBoxExpr} + ${extent} * ${iqrExpr}`;
    const fieldExpr = `datum.${continuousAxisChannelDef.field}`;

    outliersLayerMixins = partLayerMixins<BoxPlotPartsMixins>(
      markDef, 'outliers', config.boxplot,
      {
        transform: [
          {
            window: boxParamsQuartiles(continuousAxisChannelDef.field),
            frame: [null, null],
            groupby
          }, {
            filter: `(${fieldExpr} < ${lowerWhiskerExpr}) || (${fieldExpr} > ${upperWhiskerExpr})`
          }
        ],
        mark: 'point',
        encoding: {
          [continuousAxis]: {
            field: continuousAxisChannelDef.field,
            type: continuousAxisChannelDef.type
          },
          ...encodingWithoutSizeColorAndContinuousAxis
        }
      }
    );
  }

  if (outliersLayerMixins.length > 0) {
    // tukey box plot with outliers included
    return {
      ...outerSpec,
      layer: [
        { // boxplot
          transform,
          layer: boxLayer
        },
        ...outliersLayerMixins
      ]
    };
  }
  return {
    ...outerSpec,
    transform,
    layer: boxLayer
  };
}

function boxParamsQuartiles(continousAxisField: string): AggregatedFieldDef[] {
  return [
    {
      op: 'q1',
      field: continousAxisField,
      as: 'lower_box_' + continousAxisField
    },
    {
      op: 'q3',
      field: continousAxisField,
      as: 'upper_box_' + continousAxisField
    }
  ];
}

function boxParams(spec: GenericUnitSpec<Encoding<string>, BoxPlot | BoxPlotDef>, extent: 'min-max' | number) {
  const orient: Orient = compositeMarkOrient(spec, BOXPLOT);
  const {continuousAxisChannelDef, continuousAxis} = compositeMarkContinuousAxis(spec, orient, BOXPLOT);
  const continuousFieldName: string = continuousAxisChannelDef.field;

  const isMinMax = !isNumber(extent);
  const boxplotSpecificAggregate: AggregatedFieldDef[] = [
    ...boxParamsQuartiles(continuousFieldName),
    {
      op: 'median',
      field: continuousFieldName,
      as: 'mid_box_' + continuousFieldName
    },
    {
      op: 'min',
      field: continuousFieldName,
      as: (isMinMax ? 'lower_whisker_' : 'min_') + continuousFieldName
    },
    {
      op: 'max',
      field: continuousFieldName,
      as: (isMinMax ? 'upper_whisker_' : 'max_') + continuousFieldName
    }
  ];

  const postAggregateCalculates: CalculateTransform[] = isMinMax ? [] : [{
    calculate: `datum.upper_box_${continuousFieldName} - datum.lower_box_${continuousFieldName}`,
    as: 'iqr_' + continuousFieldName
  },
  {
    calculate: `min(datum.upper_box_${continuousFieldName} + datum.iqr_${continuousFieldName} * ${extent}, datum.max_${continuousFieldName})`,
    as: 'upper_whisker_' + continuousFieldName
  },
  {
    calculate: `max(datum.lower_box_${continuousFieldName} - datum.iqr_${continuousFieldName} * ${extent}, datum.min_${continuousFieldName})`,
    as: 'lower_whisker_' + continuousFieldName
  }];

  const {[continuousAxis]: oldContinuousAxisChannelDef, ...oldEncodingWithoutContinuousAxis} = spec.encoding;

  const {bins, timeUnits, aggregate, groupby, encoding: encodingWithoutContinuousAxis} = extractTransformsFromEncoding(oldEncodingWithoutContinuousAxis);

  const tickOrient: Orient = orient === 'vertical' ? 'horizontal' : 'vertical';

  return {
    transform: [
      ...bins,
      ...timeUnits,
      {
        aggregate: [...aggregate, ...boxplotSpecificAggregate],
        groupby
      },
      ...postAggregateCalculates
    ],
    groupby,
    continuousAxisChannelDef,
    continuousAxis,
    encodingWithoutContinuousAxis,
    tickOrient
  };
}
