/* tslint:disable:quotemark */

import {assert} from 'chai';

import {Channel, NONSPATIAL_SCALE_CHANNELS} from '../../../src/channel';
import {Scale, ScaleType} from '../../../src/scale';

import * as rules from '../../../src/compile/scale/rules';
import {Split} from '../../../src/compile/split';

describe('compile/scale', () => {
  describe('nice', () => {
    it('should return nice for x and y.', () => {
      for (const c of ['x', 'y'] as Channel[]) {
        assert.equal(rules.nice('linear', c, {type: 'quantitative'}), true);
      }
    });

    it('should not return nice for binned x and y.', () => {
      for (const c of ['x', 'y'] as Channel[]) {
        assert.equal(rules.nice('linear', c, {type: 'quantitative', bin: true}), undefined);
      }
    });

    // TODO
  });

  describe('padding', () => {
    it('should be pointPadding for point scale if channel is x or y and padding is not specified.', () => {
      for (const c of ['x', 'y'] as Channel[]) {
        assert.equal(rules.padding(c, 'point', {pointPadding: 13}), 13);
      }
    });
  });

  describe('paddingInner', () => {
    it('should be undefined if padding is specified.', () => {
      assert.equal(rules.paddingInner(10, 'x', {}), undefined);
    });

    it('should be bandPaddingInner if channel is x or y and padding is not specified.', () => {
      assert.equal(rules.paddingInner(undefined, 'x', {bandPaddingInner: 15}), 15);
      assert.equal(rules.paddingInner(undefined, 'y', {bandPaddingInner: 15}), 15);
    });

    it('should be undefined for non-xy channels.', () => {
      for (const c of NONSPATIAL_SCALE_CHANNELS) {
        assert.equal(rules.paddingInner(undefined, c, {bandPaddingInner: 15}), undefined);
      }
    });
  });

  describe('paddingOuter', () => {
    it('should be undefined if padding is specified.', () => {
      for (const scaleType of ['point', 'band'] as ScaleType[]) {
        assert.equal(rules.paddingOuter(10, 'x', scaleType, 0, {}), undefined);
      }
    });

    it('should be config.scale.bandPaddingOuter for band scale if channel is x or y and padding is not specified and config.scale.bandPaddingOuter.', () => {
      for (const c of ['x', 'y'] as Channel[]) {
        assert.equal(rules.paddingOuter(undefined, c, 'band', 0, {bandPaddingOuter: 16}), 16);
      }
    });
    it('should be paddingInner/2 for band scale if channel is x or y and padding is not specified and config.scale.bandPaddingOuter.', () => {
      for (const c of ['x', 'y'] as Channel[]) {
        assert.equal(rules.paddingOuter(undefined, c, 'band', 10, {}), 5);
      }
    });

    it('should be undefined for non-xy channels.', () => {
      for (const c of NONSPATIAL_SCALE_CHANNELS) {
        for (const scaleType of ['point', 'band'] as ScaleType[]) {
          assert.equal(rules.paddingOuter(undefined, c, scaleType, 0, {}), undefined);
        }
      }
    });
  });

  describe('round', () => {
    it('should return scaleConfig.round for x, y, row, column.', () => {
      for (const c of ['x', 'y', 'row', 'column'] as Channel[]) {
        assert(rules.round(c, {round: true}));
        assert(!rules.round(c, {round: false}));
      }
    });

    it('should return undefined other channels (not x, y, row, column).', () => {
      for (const c of NONSPATIAL_SCALE_CHANNELS) {
        assert.isUndefined(rules.round(c, {round: true}));
        assert.isUndefined(rules.round(c, {round: false}));
      }
    });
  });

  describe('zero', () => {
    it('should return true when mapping a quantitative field to size', () => {
      assert(rules.zero(new Split<Scale>(), 'size', {field: 'a', type: 'quantitative'}));
    });

    it('should return false when mapping a ordinal field to size', () => {
      assert(!rules.zero(new Split<Scale>(), 'size', {field: 'a', type: 'ordinal'}));
    });

    it('should return true when mapping a non-binned quantitative field to x/y', () => {
      for (const channel of ['x', 'y'] as Channel[]) {
        assert(rules.zero(new Split<Scale>(), channel, {field: 'a', type: 'quantitative'}));
      }
    });

    it('should return false when mapping a binned quantitative field to x/y', () => {
      for (const channel of ['x', 'y'] as Channel[]) {
        assert(!rules.zero(new Split<Scale>(), channel, {bin: true, field: 'a', type: 'quantitative'}));
      }
    });

    it('should return false when mapping a non-binned quantitative field with custom domain to x/y', () => {
      for (const channel of ['x', 'y'] as Channel[]) {
        assert(!rules.zero(new Split<Scale>({domain: [1, 5]}), channel, {
          bin: true, field: 'a', type: 'quantitative'
        }));
      }
    });
  });
});
