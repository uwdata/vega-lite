/* tslint:disable:quotemark */

import {assert} from 'chai';

import {AggregateNode} from '../../../src/compile/data/aggregate';
import {Condition} from '../../../src/fielddef';
import {SummarizeTransform} from '../../../src/transform';
import {StringSet} from '../../../src/util';
import {VgAggregateTransform} from '../../../src/vega.schema';
import {parseUnitModel} from '../../util';

describe('compile/data/summary', function () {
  describe('clone', function() {
    it('should have correct type', function() {
      const agg = new AggregateNode({}, {});
      assert(agg instanceof AggregateNode);
      const clone = agg.clone();
      assert(clone instanceof AggregateNode);
    });

    it('should have make a deep copy', function() {
      const agg = new AggregateNode({foo: true}, {});
      const clone = agg.clone();
      clone.addDimensions(['bar']);
      assert.deepEqual<StringSet>(clone.dependentFields(), {'foo': true, 'bar': true});
      assert.deepEqual<StringSet>(agg.dependentFields(), {'foo': true});
    });
  });

  describe('parseUnit', function() {
    it('should produce the correct summary component for sum(Acceleration) and count(*)' , () => {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          'y': {
            'aggregate': 'sum',
            'field': 'Acceleration',
            'type': "quantitative"
          },
          'x': {
            'field': 'Origin',
            'type': "ordinal"
          },
          color: {field: '*', type: "quantitative", aggregate: 'count'}
        }
      });

      const agg = AggregateNode.makeFromEncoding(model);
      assert.deepEqual<VgAggregateTransform>(agg.assemble(), {
        type: 'aggregate',
        groupby: ['Origin'],
        ops: ['sum', 'count'],
        fields: ['Acceleration', '*'],
        as: [
          "sum_Acceleration",
          "count_*"
        ]
      });
    });

    it('should produce the correct summary component for aggregated plot with detail arrays', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          'x': {'aggregate': 'mean', 'field': 'Displacement', 'type': "quantitative"},
          'detail': [
            {'field': 'Origin', 'type': "ordinal"},
            {'field': 'Cylinders', 'type': "quantitative"}
          ]
        }
      });

      const agg = AggregateNode.makeFromEncoding(model);
      assert.deepEqual<VgAggregateTransform>(agg.assemble(), {
        type: 'aggregate',
        groupby: ['Origin', 'Cylinders'],
        ops: ['mean'],
        fields: ['Displacement'],
        as: ['mean_Displacement']
      });
    });

    it('should include conditional field in the summary component', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          'x': {'aggregate': 'mean', 'field': 'Displacement', 'type': "quantitative"},
          color: {
            condition: {selection: 'a', field: 'Origin', 'type': "ordinal"},
            value: 'red'
          }
        }
      });

      const agg = AggregateNode.makeFromEncoding(model);
      assert.deepEqual<VgAggregateTransform>(agg.assemble(), {
        type: 'aggregate',
        groupby: ['Origin'],
        ops: ['mean'],
        fields: ['Displacement'],
        as: ['mean_Displacement']
      });
    });

    it('should add min and max if needed for unaggregated scale domain', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          'x': {'aggregate': 'mean', 'field': 'Displacement', 'type': "quantitative", scale: {domain: 'unaggregated'}},
        }
      });

      const agg = AggregateNode.makeFromEncoding(model);
      assert.deepEqual<VgAggregateTransform>(agg.assemble(), {
        type: 'aggregate',
        groupby: [],
        ops: ['mean', 'min', 'max'],
        fields: ['Displacement', 'Displacement', 'Displacement'],
        as: [
          "mean_Displacement",
          "min_Displacement",
          "max_Displacement"
        ]
      });
    });

    it('should add correct dimensions when binning', function() {
      const model = parseUnitModel({
        mark: "point",
        encoding: {
          'x': {'bin': true, 'field': 'Displacement', 'type': "quantitative"},
          'y': {'bin': true, 'field': 'Acceleration', 'type': "ordinal"},
          'color': {'aggregate': 'count', 'type': "quantitative"}
        }
      });

      const agg = AggregateNode.makeFromEncoding(model);
      assert.deepEqual<VgAggregateTransform>(agg.assemble(), {
        type: 'aggregate',
        groupby: [
          'bin_maxbins_10_Displacement',
          'bin_maxbins_10_Displacement_end',
          'bin_maxbins_10_Acceleration',
          'bin_maxbins_10_Acceleration_end',
          'bin_maxbins_10_Acceleration_range'
        ],
        ops: ['count'],
        fields: ['*'],
        as: ['count_*']
      });
    });

    it('should produce the correct summary component from transform array', function() {
      const t: SummarizeTransform = {
        summarize: [
          {aggregate: 'mean', field: 'Displacement', as: 'Displacement_mean'},
          {aggregate: 'sum', field: 'Acceleration', as: 'Acceleration_sum'}
        ],
        groupby: ['Displacement_mean', 'Acceleration_sum']};

      const model = parseUnitModel({
        mark: "point",
        transform: [t],
        encoding: {
          'x': {'field': 'Displacement', 'type': "quantitative"}
        }
      });

      const agg = AggregateNode.makeFromTransform(model, t);
      assert.deepEqual<VgAggregateTransform>(agg.assemble(), {
        type: 'aggregate',
        groupby: ['Displacement_mean', 'Acceleration_sum'],
        ops: ['mean', 'sum'],
        fields: ['Displacement', 'Acceleration'],
        as: ['Displacement_mean', 'Acceleration_sum']
      });
    });

    it('should produce the correct summary component from transform array with different aggregrations for the same field', function() {
      const t: SummarizeTransform = {summarize: [
        {aggregate: 'mean', field: 'Displacement', as: 'Displacement_mean'},
        {aggregate: 'max', field: 'Displacement', as: 'Displacement_max'},
        {aggregate: 'sum', field: 'Acceleration', as: 'Acceleration_sum'}],
        groupby: ['Displacement_mean', 'Acceleration_sum']};

      const model = parseUnitModel({
        mark: "point",
        transform: [t],
        encoding: {
          'x': {'field': 'Displacement', 'type': "quantitative"}
        }
      });

      const agg = AggregateNode.makeFromTransform(model, t);
      assert.deepEqual<VgAggregateTransform>(agg.assemble(), {
        type: 'aggregate',
        groupby: ['Displacement_mean', 'Acceleration_sum'],
        ops: ['mean', 'max', 'sum'],
        fields: ['Displacement', 'Displacement', 'Acceleration'],
        as: ['Displacement_mean', 'Displacement_max', 'Acceleration_sum']
      });
    });
  });
});
