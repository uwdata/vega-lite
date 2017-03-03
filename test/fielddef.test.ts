import {assert} from 'chai';

import {Channel} from '../src/channel';
import {defaultType, normalize, title} from '../src/fielddef';
import * as log from '../src/log';
import {TimeUnit} from '../src/timeunit';
import {QUANTITATIVE, TEMPORAL} from '../src/type';

describe('fieldDef', () => {
  describe('defaultType()', () => {
    it('should return temporal if there is timeUnit', () => {
      assert.equal(defaultType({timeUnit: 'month', field: 'a'}, 'x'), 'temporal');
    });

    it('should return quantitative if there is bin', () => {
      assert.equal(defaultType({bin: 'true', field: 'a'}, 'x'), 'quantitative');
    });

    it('should return quantitative for a channel that supports measure', () => {
      for (let c of ['x', 'y', 'size', 'opacity', 'order'] as Channel[]) {
        assert.equal(defaultType({field: 'a'}, c), 'quantitative', c);
      }
    });

    it('should return nominal for a channel that does not support measure', () => {
      for (let c of ['color', 'shape', 'row', 'column'] as Channel[]) {
        assert.equal(defaultType({field: 'a'}, c), 'nominal', c);
      }
    });
  });

  describe('normalize()', () => {
    it('should return fieldDef with full type name.', () => {
      const fieldDef = {field: 'a', type: 'q' as any};
      assert.deepEqual(normalize(fieldDef, 'x'), {field: 'a', type: 'quantitative'});
    });

    it('should return fieldDef with default type and throw warning if type is missing.', log.wrap((localLogger) => {
      const fieldDef = {field: 'a'};
      assert.deepEqual(normalize(fieldDef, 'x'), {field: 'a', type: 'quantitative'});
      assert.equal(localLogger.warns[0], log.message.emptyOrInvalidFieldType(undefined, 'x', 'quantitative'));
    }));
  });

  describe('title()', () => {
    it('should return title if the fieldDef has title', () => {
      const fieldDef = {field: '2', type: QUANTITATIVE, title: 'baz'};
      assert.equal(title(fieldDef,{}), 'baz');
    });

    it('should return correct title for aggregate', () => {
      assert.equal(title({field: 'f', type: QUANTITATIVE, aggregate: 'mean'}, {}), 'MEAN(f)');
    });

    it('should return correct title for count', () => {
      assert.equal(title({field: '*', type: QUANTITATIVE, aggregate: 'count'}, {countTitle: 'baz!'}), 'baz!');
    });

    it('should return correct title for bin', () => {
      const fieldDef = {field: 'f', type: QUANTITATIVE, bin: true};
      assert.equal(title(fieldDef,{}), 'BIN(f)');
    });

    it('should return correct title for timeUnit', () => {
      const fieldDef = {field: 'f', type: TEMPORAL, timeUnit: TimeUnit.MONTH};
      assert.equal(title(fieldDef,{}), 'MONTH(f)');
    });

    it('should return correct title for raw field', () => {
      const fieldDef = {field: 'f', type: TEMPORAL};
      assert.equal(title(fieldDef,{}), 'f');
    });
  });
});
