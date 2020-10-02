import {nonPosition} from '../../../src/compile/mark/encode';
import {expression} from '../../../src/compile/predicate';
import {parseSelectionPredicate as predicate, parseUnitSelection} from '../../../src/compile/selection/parse';
import {parseUnitModel} from '../../util';

describe('Selection Predicate', () => {
  const model = parseUnitModel({
    mark: 'circle',
    encoding: {
      x: {field: 'Horsepower', type: 'quantitative'},
      y: {field: 'Miles_per_Gallon', type: 'quantitative'},
      color: {
        field: 'Cylinders',
        type: 'ordinal',
        condition: {
          selection: 'one',
          value: 'grey'
        }
      },
      opacity: {
        field: 'Acceleration',
        type: 'quantitative',
        condition: {
          selection: {or: ['one', {and: ['two', {not: 'thr-ee'}]}]},
          value: 0.5
        }
      }
    }
  });

  model.parseScale();

  model.component.selection = parseUnitSelection(model, [
    {name: 'one', select: 'single'},
    {name: 'two', select: {type: 'multi', resolve: 'union'}},
    {name: 'thr-ee', select: {type: 'interval', resolve: 'intersect'}},
    {name: 'four', select: {type: 'single', empty: 'none'}}
  ]);

  it('generates the predicate expression', () => {
    expect(predicate(model, 'one')).toBe('!(length(data("one_store"))) || (vlSelectionTest("one_store", datum))');

    expect(predicate(model, 'four')).toBe('(vlSelectionTest("four_store", datum))');

    expect(predicate(model, {not: 'one'})).toEqual(
      '!(length(data("one_store"))) || (!(vlSelectionTest("one_store", datum)))'
    );

    expect(predicate(model, {not: {and: ['one', 'two']}})).toEqual(
      '!(length(data("one_store")) || length(data("two_store"))) || ' +
        '(!((vlSelectionTest("one_store", datum)) && ' +
        '(vlSelectionTest("two_store", datum, "union"))))'
    );

    expect(predicate(model, {not: {and: ['one', 'four']}})).toEqual(
      '!(length(data("one_store"))) || ' +
        '(!((vlSelectionTest("one_store", datum)) && ' +
        '(vlSelectionTest("four_store", datum))))'
    );

    expect(predicate(model, {and: ['one', 'two', {not: 'thr-ee'}]})).toEqual(
      '!(length(data("one_store")) || length(data("two_store")) || length(data("thr_ee_store"))) || ' +
        '((vlSelectionTest("one_store", datum)) && ' +
        '(vlSelectionTest("two_store", datum, "union")) && ' +
        '(!(vlSelectionTest("thr_ee_store", datum, "intersect"))))'
    );

    expect(predicate(model, {or: ['one', {and: ['two', {not: 'thr-ee'}]}]})).toEqual(
      '!(length(data("one_store")) || length(data("two_store")) || length(data("thr_ee_store"))) || ' +
        '((vlSelectionTest("one_store", datum)) || ' +
        '((vlSelectionTest("two_store", datum, "union")) && ' +
        '(!(vlSelectionTest("thr_ee_store", datum, "intersect")))))'
    );
  });

  it('generates Vega production rules', () => {
    expect(nonPosition('color', model, {vgChannel: 'fill'})).toEqual({
      fill: [
        {test: '!(length(data("one_store"))) || (vlSelectionTest("one_store", datum))', value: 'grey'},
        {scale: 'color', field: 'Cylinders'}
      ]
    });

    expect(nonPosition('opacity', model)).toEqual({
      opacity: [
        {
          test:
            '!(length(data("one_store")) || length(data("two_store")) || length(data("thr_ee_store"))) || ' +
            '((vlSelectionTest("one_store", datum)) || ' +
            '((vlSelectionTest("two_store", datum, "union")) && ' +
            '(!(vlSelectionTest("thr_ee_store", datum, "intersect")))))',
          value: 0.5
        },
        {scale: 'opacity', field: 'Acceleration'}
      ]
    });
  });

  it('generates a selection filter', () => {
    expect(expression(model, {selection: 'one'})).toEqual(
      '!(length(data("one_store"))) || (vlSelectionTest("one_store", datum))'
    );

    expect(expression(model, {selection: {not: 'one'}})).toEqual(
      '!(length(data("one_store"))) || (!(vlSelectionTest("one_store", datum)))'
    );

    expect(expression(model, {selection: {not: {and: ['one', 'two']}}})).toEqual(
      '!(length(data("one_store")) || length(data("two_store"))) || ' +
        '(!((vlSelectionTest("one_store", datum)) && ' +
        '(vlSelectionTest("two_store", datum, "union"))))'
    );

    expect(expression(model, {selection: {and: ['one', 'two', {not: 'thr-ee'}]}})).toEqual(
      '!(length(data("one_store")) || length(data("two_store")) || length(data("thr_ee_store"))) || ' +
        '((vlSelectionTest("one_store", datum)) && ' +
        '(vlSelectionTest("two_store", datum, "union")) && ' +
        '(!(vlSelectionTest("thr_ee_store", datum, "intersect"))))'
    );

    expect(expression(model, {selection: {or: ['one', {and: ['two', {not: 'thr-ee'}]}]}})).toEqual(
      '!(length(data("one_store")) || length(data("two_store")) || length(data("thr_ee_store"))) || ' +
        '((vlSelectionTest("one_store", datum)) || ' +
        '((vlSelectionTest("two_store", datum, "union")) && ' +
        '(!(vlSelectionTest("thr_ee_store", datum, "intersect")))))'
    );
  });

  it('throws an error for unknown selections', () => {
    expect(() => predicate(model, 'helloworld')).toThrow();
  });
});
