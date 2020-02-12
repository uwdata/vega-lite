import {isMarkDef, MarkDef} from '../../src/mark';
import {normalize} from '../../src/normalize';
import {isLayerSpec, isUnitSpec, TopLevelSpec} from '../../src/spec';
import {isCalculate} from '../../src/transform';
import {defaultConfig} from '.././../src/config';
import {NormalizedUnitSpec} from './../../src/spec/unit';
import {assertIsUnitSpec} from '../util';

describe('common feature of composite marks', () => {
  it('should clip all the part when clip property in composite mark def is true', () => {
    const outputSpec = normalize(
      {
        data: {url: 'data/barley.json'},
        mark: {type: 'errorbar', ticks: true, clip: true},
        encoding: {x: {field: 'yield', type: 'quantitative'}}
      },
      defaultConfig
    );

    const layer = isLayerSpec(outputSpec) && outputSpec.layer;
    expect(layer).toBeTruthy();
    for (const unitSpec of layer) {
      const markDef: MarkDef = isUnitSpec(unitSpec) && isMarkDef(unitSpec.mark) && unitSpec.mark;
      expect(markDef).toBeTruthy();
      expect(markDef.clip).toBe(true);
    }
  });

  it('should add timeFormat to axis when normalizing encoding with timeUnit', () => {
    const outputSpec = normalize(
      {
        data: {url: 'data/cars.json'},
        mark: 'errorbar',
        encoding: {
          y: {field: 'Miles_per_Gallon', type: 'quantitative'},
          x: {field: 'Year', type: 'ordinal', timeUnit: 'year'}
        }
      },
      defaultConfig
    );

    assertIsUnitSpec(outputSpec);

    const encoding = outputSpec.encoding;
    expect(encoding).toBeTruthy();
    expect(encoding.x).toEqual({
      title: 'Year (year)',
      type: 'ordinal',
      field: 'year_Year',
      axis: {
        formatType: 'time'
      }
    });
  });

  it('should produce correct calculate transform when field name contains space or punctuation', () => {
    const outputSpec = normalize(
      {
        data: {url: 'data/barley.json'},
        mark: 'errorbar',
        encoding: {x: {field: 'yield space,punctuation', type: 'quantitative'}}
      },
      defaultConfig
    );
    const transforms = outputSpec.transform;
    expect(transforms).toBeTruthy();

    const upperCalculate = transforms[1];
    expect(isCalculate(upperCalculate) && upperCalculate.calculate).toEqual(
      'datum["center_yield space,punctuation"] + datum["extent_yield space,punctuation"]'
    );

    const lowerCalculate = transforms[2];
    expect(isCalculate(lowerCalculate) && lowerCalculate.calculate).toEqual(
      'datum["center_yield space,punctuation"] - datum["extent_yield space,punctuation"]'
    );
  });

  it('should override the default tooltip with custom tooltip', () => {
    const spec: TopLevelSpec = {
      data: {url: 'data/cars.json'},
      mark: 'errorbar',
      encoding: {
        y: {field: 'Miles_per_Gallon', type: 'quantitative'},
        x: {field: 'a_field', type: 'ordinal'},
        tooltip: {field: 'a_field', type: 'ordinal'}
      }
    };
    const outputSpec = normalize(spec, defaultConfig);

    const barLayer = outputSpec as NormalizedUnitSpec;
    expect(barLayer.encoding.tooltip).toEqual(spec.encoding.tooltip);
  });

  it('should disable the default tooltip when tooltip is null', () => {
    const spec: TopLevelSpec = {
      data: {url: 'data/cars.json'},
      mark: 'errorbar',
      encoding: {
        y: {field: 'Miles_per_Gallon', type: 'quantitative'},
        tooltip: null
      }
    };
    const outputSpec = normalize(spec, defaultConfig);

    const barLayer = outputSpec as NormalizedUnitSpec;
    expect(barLayer.encoding.tooltip).toEqual(null);
  });
});
