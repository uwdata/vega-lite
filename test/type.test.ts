import {assert} from 'chai';

import * as type from '../src/type';

describe('type', function () {
  describe('getFullName()', () => {
    it('should return correct lowercase, full type names.', () => {
      for (let t of ['q', 'Q', 'quantitative', 'QUANTITATIVE']) {
        assert.equal(type.getFullName(t), 'quantitative');
      }
      for (let t of ['t', 'T', 'temporal', 'TEMPORAL']) {
        assert.equal(type.getFullName(t), 'temporal');
      }
      for (let t of ['o', 'O', 'ordinal', 'ORDINAL']) {
        assert.equal(type.getFullName(t), 'ordinal');
      }
      for (let t of ['n', 'N', 'nominal', 'NOMINAL']) {
        assert.equal(type.getFullName(t), 'nominal');
      }
    });

    it('should return undefined for invalid type', () => {
      assert.equal(type.getFullName('haha'), undefined);
    });
  });
});
