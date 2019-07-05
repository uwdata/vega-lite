import {
  defaultContinuousToDiscreteCount,
  interpolateRange,
  MAX_SIZE_RANGE_STEP_RATIO,
  parseRangeForChannel
} from '../../../src/compile/scale/range';
import {makeExplicit, makeImplicit} from '../../../src/compile/split';
import {Config, defaultConfig, DEFAULT_STEP} from '../../../src/config';
import * as log from '../../../src/log';
import {Mark} from '../../../src/mark';
import {CONTINUOUS_TO_CONTINUOUS_SCALES, DISCRETE_DOMAIN_SCALES, ScaleType} from '../../../src/scale';
import {NOMINAL, ORDINAL, QUANTITATIVE} from '../../../src/type';

const identity = (x: string) => x;

describe('compile/scale', () => {
  describe('parseRange()', () => {
    describe('position', () => {
      it('should return [0, plot_width] for x-continuous scales by default.', () => {
        for (const scaleType of CONTINUOUS_TO_CONTINUOUS_SCALES) {
          expect(
            parseRangeForChannel(
              'x',
              identity,
              scaleType,
              QUANTITATIVE,
              {},
              defaultConfig,
              true,
              'point',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit([0, {signal: 'plot_width'}]));
        }
      });

      it('should return [plot_height,0] for y-continuous scales by default.', () => {
        for (const scaleType of CONTINUOUS_TO_CONTINUOUS_SCALES) {
          expect(
            parseRangeForChannel(
              'y',
              identity,
              scaleType,
              QUANTITATIVE,
              {},
              defaultConfig,
              true,
              'point',
              'plot_height',
              {}
            )
          ).toEqual(makeImplicit([{signal: 'plot_height'}, 0]));
        }
      });

      it('should return [0, plot_height] for y-discrete scales with height by default.', () => {
        for (const scaleType of DISCRETE_DOMAIN_SCALES) {
          expect(
            parseRangeForChannel(
              'y',
              identity,
              scaleType,
              QUANTITATIVE,
              {},
              defaultConfig,
              true,
              'point',
              'plot_height',
              {height: 200}
            )
          ).toEqual(makeImplicit([0, {signal: 'plot_height'}]));
        }
      });

      it(
        'should support custom range.',
        log.wrap(localLogger => {
          expect(
            parseRangeForChannel(
              'x',
              identity,
              'linear',
              QUANTITATIVE,
              {range: [0, 100]},
              defaultConfig,
              true,
              'point',
              'plot_width',
              {}
            )
          ).toEqual(makeExplicit([0, 100]));
          expect(localLogger.warns.length).toEqual(0);
        })
      );

      it('should return config.view.discreteWidth for x- band/point scales by default.', () => {
        for (const scaleType of ['point', 'band'] as ScaleType[]) {
          expect(
            parseRangeForChannel(
              'x',
              identity,
              scaleType,
              NOMINAL,
              {},
              defaultConfig,
              undefined,
              'point',
              'plot_width',
              {}
            )
          ).toEqual(expect.objectContaining(makeImplicit({step: 20})));
        }
      });

      it('should return config.view.discreteWidth for y- band/point scales by default.', () => {
        for (const scaleType of ['point', 'band'] as ScaleType[]) {
          expect(
            parseRangeForChannel(
              'y',
              identity,
              scaleType,
              NOMINAL,
              {},
              defaultConfig,
              undefined,
              'point',
              'plot_height',
              {}
            )
          ).toEqual(expect.objectContaining(makeImplicit({step: 20})));
        }
      });

      it(
        'should drop rangeStep if model is fit',
        log.wrap(localLogger => {
          for (const scaleType of ['point', 'band'] as ScaleType[]) {
            expect(
              parseRangeForChannel(
                'x',
                identity,
                scaleType,
                NOMINAL,
                {},
                defaultConfig,
                undefined,
                'text',
                'plot_width',
                {width: {step: 23}},
                true
              )
            ).toEqual(makeImplicit([0, {signal: 'plot_width'}]));
          }
          expect(localLogger.warns[0]).toEqual(log.message.stepDropped('width', 'fit'));
        })
      );
      it('should return specified step if topLevelSize is undefined for band/point scales', () => {
        for (const scaleType of ['point', 'band'] as ScaleType[]) {
          expect(
            parseRangeForChannel(
              'x',
              identity,
              scaleType,
              NOMINAL,
              {},
              defaultConfig,
              undefined,
              'text',
              'plot_width',
              {width: {step: 23}}
            )
          ).toEqual(makeExplicit({step: 23}));
        }
      });

      it('should return default topLevelSize if config.view.discreteWidth is a number', () => {
        for (const scaleType of ['point', 'band'] as ScaleType[]) {
          expect(
            parseRangeForChannel(
              'x',
              identity,
              scaleType,
              NOMINAL,
              {},
              {view: {discreteWidth: 200}},
              undefined,
              'point',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit([0, {signal: 'plot_width'}]));
        }
      });

      it('should drop rangeStep for continuous scales', () => {
        for (const scaleType of CONTINUOUS_TO_CONTINUOUS_SCALES) {
          log.wrap(localLogger => {
            expect(
              parseRangeForChannel(
                'x',
                identity,
                scaleType,
                QUANTITATIVE,
                {},
                defaultConfig,
                undefined,
                'text',
                'plot_width',
                {width: {step: 23}}
              )
            ).toEqual(makeImplicit([0, {signal: 'plot_width'}]));
            expect(localLogger.warns[0]).toEqual(log.message.stepDropped('width', 'continuous'));
          })();
        }
      });
    });

    describe('color', () => {
      it('should use the specified scheme for a nominal color field.', () => {
        expect(
          parseRangeForChannel(
            'color',
            identity,
            'ordinal',
            NOMINAL,
            {scheme: 'warm'},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeExplicit({scheme: 'warm'}));
      });

      it('should use the specified scheme with extent for a nominal color field.', () => {
        expect(
          parseRangeForChannel(
            'color',
            identity,
            'ordinal',
            NOMINAL,
            {scheme: {name: 'warm', extent: [0.2, 1]}},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeExplicit({scheme: 'warm', extent: [0.2, 1]}));
      });

      it('should use the specified range for a nominal color field.', () => {
        expect(
          parseRangeForChannel(
            'color',
            identity,
            'ordinal',
            NOMINAL,
            {range: ['red', 'green', 'blue']},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeExplicit(['red', 'green', 'blue']));
      });

      it('should use default category range in Vega for a nominal color field.', () => {
        expect(
          parseRangeForChannel(
            'color',
            identity,
            'ordinal',
            NOMINAL,
            {},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeImplicit('category'));
      });

      it('should use default ordinal range in Vega for an ordinal color field.', () => {
        expect(
          parseRangeForChannel(
            'color',
            identity,
            'ordinal',
            ORDINAL,
            {},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeImplicit('ordinal'));
      });

      it('should use default ramp range in Vega for a temporal/quantitative color field.', () => {
        expect(
          parseRangeForChannel(
            'color',
            identity,
            'linear',
            QUANTITATIVE,
            {},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeImplicit('ramp'));
      });

      it('should use the specified scheme with count for a quantitative color field.', () => {
        expect(
          parseRangeForChannel(
            'color',
            identity,
            'ordinal',
            QUANTITATIVE,
            {scheme: {name: 'viridis', count: 3}},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeExplicit({scheme: 'viridis', count: 3}));
      });

      it('should use default ramp range for quantile/quantize scales', () => {
        const scales: ScaleType[] = ['quantile', 'quantize'];
        scales.forEach(discretizingScale => {
          expect(
            parseRangeForChannel(
              'color',
              identity,
              discretizingScale,
              QUANTITATIVE,
              {},
              defaultConfig,
              undefined,
              'point',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit('ramp'));
        });
      });

      it('should use default ramp range for threshold scale', () => {
        expect(
          parseRangeForChannel(
            'color',
            identity,
            'threshold',
            QUANTITATIVE,
            {},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeImplicit('ramp'));
      });

      it('should use default color range for log scale', () => {
        expect(
          parseRangeForChannel(
            'color',
            identity,
            'log',
            QUANTITATIVE,
            {},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeImplicit('ramp'));
      });
    });

    describe('opacity', () => {
      it("should use default opacityRange as opacity's scale range.", () => {
        expect(
          parseRangeForChannel(
            'opacity',
            identity,
            'linear',
            QUANTITATIVE,
            {},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeImplicit([defaultConfig.scale.minOpacity, defaultConfig.scale.maxOpacity]));
      });
    });

    describe('size', () => {
      describe('bar', () => {
        it('should return [minBandSize, maxBandSize] if both are specified', () => {
          const config = {
            scale: {minBandSize: 2, maxBandSize: 9}
          };
          expect(
            parseRangeForChannel(
              'size',
              identity,
              'linear',
              QUANTITATIVE,
              {},
              config,
              undefined,
              'bar',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit([2, 9]));
        });

        it('should return [continuousBandSize, xRangeStep-1] by default since min/maxSize config are not specified', () => {
          expect(
            parseRangeForChannel(
              'size',
              identity,
              'linear',
              QUANTITATIVE,
              {},
              defaultConfig,
              undefined,
              'bar',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit([2, DEFAULT_STEP - 1]));
        });
      });

      describe('tick', () => {
        it('should return [minBandSize, maxBandSize] if both are specified', () => {
          const config = {
            scale: {minBandSize: 4, maxBandSize: 9}
          };
          expect(
            parseRangeForChannel(
              'size',
              identity,
              'linear',
              QUANTITATIVE,
              {},
              config,
              undefined,
              'tick',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit([4, 9]));
        });

        it('should return [(default)minBandSize, step-1] by default since maxSize config is not specified', () => {
          expect(
            parseRangeForChannel(
              'size',
              identity,
              'linear',
              QUANTITATIVE,
              {},
              defaultConfig,
              undefined,
              'tick',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit([defaultConfig.scale.minBandSize, DEFAULT_STEP - 1]));
        });
      });

      describe('text', () => {
        it('should return [minFontSize, maxFontSize]', () => {
          expect(
            parseRangeForChannel(
              'size',
              identity,
              'linear',
              QUANTITATIVE,
              {},
              defaultConfig,
              undefined,
              'text',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit([defaultConfig.scale.minFontSize, defaultConfig.scale.maxFontSize]));
        });
      });

      describe('rule', () => {
        it('should return [minStrokeWidth, maxStrokeWidth]', () => {
          expect(
            parseRangeForChannel(
              'size',
              identity,
              'linear',
              QUANTITATIVE,
              {},
              defaultConfig,
              undefined,
              'rule',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit([defaultConfig.scale.minStrokeWidth, defaultConfig.scale.maxStrokeWidth]));
        });
      });

      describe('point, square, circle', () => {
        it('should return [minSize, maxSize]', () => {
          for (const m of ['point', 'square', 'circle'] as Mark[]) {
            const config = {
              scale: {
                minSize: 5,
                maxSize: 25
              }
            };

            expect(
              parseRangeForChannel('size', identity, 'linear', QUANTITATIVE, {}, config, undefined, m, 'plot_width', {})
            ).toEqual(makeImplicit([5, 25]));
          }
        });

        it('should return [0, (minBandSize-2)^2] if both x and y are discrete and size is quantitative (thus use zero=true, by default)', () => {
          for (const m of ['point', 'square', 'circle'] as Mark[]) {
            expect(
              parseRangeForChannel('size', identity, 'linear', QUANTITATIVE, {}, defaultConfig, true, m, 'plot_width', {
                width: {step: 11},
                height: {step: 13}
              })
            ).toEqual(makeImplicit([0, MAX_SIZE_RANGE_STEP_RATIO * 11 * MAX_SIZE_RANGE_STEP_RATIO * 11]));
          }
        });

        it('should return [9, (minBandSize-2)^2] if both x and y are discrete and size is not quantitative (thus use zero=false, by default)', () => {
          for (const m of ['point', 'square', 'circle'] as Mark[]) {
            expect(
              parseRangeForChannel(
                'size',
                identity,
                'linear',
                QUANTITATIVE,
                {},
                defaultConfig,
                false,
                m,
                'plot_width',
                {
                  width: {step: 11},
                  height: {step: 13}
                }
              )
            ).toEqual(makeImplicit([9, MAX_SIZE_RANGE_STEP_RATIO * 11 * MAX_SIZE_RANGE_STEP_RATIO * 11]));
          }
        });

        it('should return [9, (minBandSize-2)^2] if both x and y are discrete and size is quantitative but use zero=false', () => {
          for (const m of ['point', 'square', 'circle'] as Mark[]) {
            expect(
              parseRangeForChannel(
                'size',
                identity,
                'linear',
                QUANTITATIVE,
                {},
                defaultConfig,
                false,
                m,
                'plot_width',
                {
                  width: {step: 11},
                  height: {step: 13}
                }
              )
            ).toEqual(makeImplicit([9, MAX_SIZE_RANGE_STEP_RATIO * 11 * MAX_SIZE_RANGE_STEP_RATIO * 11]));
          }
        });

        it('should return [0, (xRangeStep-2)^2] if x is discrete and y is continuous and size is quantitative (thus use zero=true, by default)', () => {
          for (const m of ['point', 'square', 'circle'] as Mark[]) {
            expect(
              parseRangeForChannel('size', identity, 'linear', QUANTITATIVE, {}, defaultConfig, true, m, 'plot_width', {
                width: {step: 11},
                height: {step: 13}
              })
            ).toEqual(makeImplicit([0, MAX_SIZE_RANGE_STEP_RATIO * 11 * MAX_SIZE_RANGE_STEP_RATIO * 11]));
          }
        });

        it('should return range interpolation of length 4 for quantile/quantize scales', () => {
          const scales: ScaleType[] = ['quantile', 'quantize'];
          scales.forEach(discretizingScale => {
            expect(
              parseRangeForChannel(
                'size',
                identity,
                discretizingScale,
                QUANTITATIVE,
                {},
                defaultConfig,
                undefined,
                'point',
                'plot_width',
                {}
              )
            ).toEqual(makeImplicit({signal: 'sequence(9, 361 + (361 - 9) / (4 - 1), (361 - 9) / (4 - 1))'}));
          });
        });

        it('should return range interpolation of length 4 for threshold scale', () => {
          expect(
            parseRangeForChannel(
              'size',
              identity,
              'threshold',
              QUANTITATIVE,
              {},
              defaultConfig,
              undefined,
              'point',
              'plot_width',
              {}
            )
          ).toEqual(makeImplicit({signal: 'sequence(9, 361 + (361 - 9) / (3 - 1), (361 - 9) / (3 - 1))'}));
        });
      });
    });

    describe('shape', () => {
      it("should use default symbol range in Vega as shape's scale range.", () => {
        expect(
          parseRangeForChannel(
            'shape',
            identity,
            'ordinal',
            QUANTITATIVE,
            {},
            defaultConfig,
            undefined,
            'point',
            'plot_width',
            {}
          )
        ).toEqual(makeImplicit('symbol'));
      });
    });
  });

  describe('defaultContinuousToDiscreteCount', () => {
    it('should use config.scale.quantileCount for quantile scale', () => {
      const config: Config = {
        scale: {
          quantileCount: 4
        }
      };
      expect(defaultContinuousToDiscreteCount('quantile', config, undefined, 'x')).toEqual(4);
    });

    it('should use config.scale.quantizeCount for quantize scale', () => {
      const config: Config = {
        scale: {
          quantizeCount: 4
        }
      };
      expect(defaultContinuousToDiscreteCount('quantize', config, undefined, 'x')).toEqual(4);
    });

    it('should use domain size for threshold scale', () => {
      expect(defaultContinuousToDiscreteCount('threshold', {}, [1, 10], 'x')).toEqual(3);
    });

    it('should throw warning and default to 4 for scale without domain', () => {
      log.wrap(localLogger => {
        expect(defaultContinuousToDiscreteCount('quantize', {}, undefined, 'x')).toEqual(4);
        expect(localLogger.warns[0]).toEqual(log.message.domainRequiredForThresholdScale('x'));
      });
    });
  });

  describe('interpolateRange', () => {
    it('should return the correct interpolation of 1 - 100 with cardinality of 5', () => {
      expect(interpolateRange(0, 100, 5).signal).toBe('sequence(0, 100 + (100 - 0) / (5 - 1), (100 - 0) / (5 - 1))');
    });
  });
});
