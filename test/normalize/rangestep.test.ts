import {normalize} from '../../src/normalize';
import {RangeStepNormalizer} from '../../src/normalize/rangestep';
import {Scale} from '../../src/scale';
import {TopLevelUnitSpec} from '../../src/spec/unit';
describe('RangeStepNormalizer', () => {
  const rangeStepNormalizer = new RangeStepNormalizer();

  it('converts rangeStep to width/height.step', () => {
    const spec: TopLevelUnitSpec = {
      data: {name: 'test'},
      mark: 'rect',
      encoding: {
        x: {
          field: 'date',
          type: 'nominal',
          scale: {rangeStep: 12} as Scale // Need to cast as rangeStep is no longer an official scale property
        },
        y: {
          field: 'price',
          type: 'nominal',
          scale: {rangeStep: 24} as Scale // Need to cast as rangeStep is no longer an official scale property
        }
      }
    };

    expect(rangeStepNormalizer.hasMatchingType(spec)).toBeTruthy();

    const normalizedSpec = normalize(spec);
    expect(normalizedSpec).toEqual({
      autosize: {type: 'pad'},
      data: {name: 'test'},
      width: {step: 12},
      height: {step: 24},
      mark: 'rect',
      encoding: {
        x: {field: 'date', type: 'nominal'},
        y: {field: 'price', type: 'nominal'}
      }
    });
  });
});
