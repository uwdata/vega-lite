import {TimeUnitNode} from '../../../src/compile/data/timeunit';
import {ModelWithField} from '../../../src/compile/model';
import {TimeUnitTransform} from '../../../src/transform';
import {parseUnitModel} from '../../util';
import {PlaceholderDataFlowNode} from './util';

function assembleFromEncoding(model: ModelWithField) {
  return TimeUnitNode.makeFromEncoding(null, model).assemble();
}

function assembleFromTransform(t: TimeUnitTransform) {
  return TimeUnitNode.makeFromTransform(null, t).assemble();
}

describe('compile/data/timeunit', () => {
  describe('parseUnit', () => {
    it('should return a timeunit transform for point', () => {
      const model = parseUnitModel({
        data: {values: []},
        mark: 'point',
        encoding: {
          x: {field: 'a', type: 'temporal', timeUnit: 'month'}
        }
      });

      expect(assembleFromEncoding(model)).toEqual([
        {
          type: 'timeunit',
          field: 'a',
          as: ['month_a', 'month_a_end'],
          units: ['month']
        }
      ]);
    });

    it('should return a unit transforms for bar', () => {
      const model = parseUnitModel({
        data: {values: []},
        mark: 'bar',
        encoding: {
          x: {field: 'a', type: 'temporal', timeUnit: 'month'}
        }
      });

      expect(assembleFromEncoding(model)).toEqual([
        {
          type: 'timeunit',
          field: 'a',
          as: ['month_a', 'month_a_end'],
          units: ['month']
        }
      ]);
    });

    it('should return a timeunit transform from transform array', () => {
      const t: TimeUnitTransform = {field: 'date', as: 'month_date', timeUnit: 'month'};

      expect(assembleFromTransform(t)).toEqual([
        {
          type: 'timeunit',
          field: 'date',
          as: ['month_date', 'month_date_end'],
          units: ['month']
        }
      ]);
    });

    it('should return a timeunit transform with timezone for utc units', () => {
      const t: TimeUnitTransform = {field: 'date', as: 'utcmonth_date', timeUnit: 'utcmonth'};

      expect(assembleFromTransform(t)).toEqual([
        {
          type: 'timeunit',
          field: 'date',
          timezone: 'utc',
          as: ['utcmonth_date', 'utcmonth_date_end'],
          units: ['month']
        }
      ]);
    });
  });

  describe('hash', () => {
    it('should generate the correct hash for point', () => {
      const model = parseUnitModel({
        data: {values: []},
        mark: 'point',
        encoding: {
          x: {field: 'a', type: 'temporal', timeUnit: 'month'}
        }
      });
      const timeUnitNode = TimeUnitNode.makeFromEncoding(null, model);
      expect(timeUnitNode.hash()).toBe(
        'TimeUnit {"{\\"as\\":\\"month_a\\",\\"field\\":\\"a\\",\\"timeUnit\\":\\"month\\"}":{"as":"month_a","field":"a","timeUnit":"month"}}'
      );
    });
    it('should generate the correct hash for bar', () => {
      const model = parseUnitModel({
        data: {values: []},
        mark: 'bar',
        encoding: {
          x: {field: 'a', type: 'temporal', timeUnit: 'month'}
        }
      });
      const timeUnitNode = TimeUnitNode.makeFromEncoding(null, model);
      expect(timeUnitNode.hash()).toBe(
        'TimeUnit {"{\\"as\\":\\"month_a\\",\\"field\\":\\"a\\",\\"timeUnit\\":\\"month\\"}":{"as":"month_a","band":true,"field":"a","timeUnit":"month"}}'
      );
    });
  });

  describe('clone', () => {
    it('should never clone parent', () => {
      const parent = new PlaceholderDataFlowNode(null);
      const timeUnit = new TimeUnitNode(parent, {});
      expect(timeUnit.clone().parent).toBeNull();
    });
  });
});
