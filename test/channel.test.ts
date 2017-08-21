import {assert} from 'chai';
import {Channel, hasScale, rangeType, SINGLE_DEF_CHANNELS} from '../src/channel';
import {CHANNELS, NONSPATIAL_CHANNELS, NONSPATIAL_SCALE_CHANNELS, SCALE_CHANNELS, UNIT_CHANNELS} from '../src/channel';
import {without} from '../src/util';


describe('channel', () => {
  describe('UNIT_CHANNELS', () => {
    it('should be CHANNELS without row and column', () => {
      assert.deepEqual(UNIT_CHANNELS, without(CHANNELS, ['row', 'column']));
    });
  });

  describe('SINGLE_DEF_CHANNELS', () => {
    it('should be CHANNELS without detail and order', () => {
      assert.deepEqual(SINGLE_DEF_CHANNELS, without(CHANNELS, ['detail', 'order']));
    });
  });

  describe('SCALE_CHANNELS', () => {
    it('should be UNIT_CHANNELS without X2, Y2, ORDER, DETAIL, TEXT, LABEL, TOOLTIP', () => {
      assert.deepEqual(SCALE_CHANNELS, without(UNIT_CHANNELS, ['x2', 'y2', 'order', 'detail', 'text', 'label', 'tooltip']));
    });
  });

  describe('NONSPATIAL_CHANNELS', () => {
    it('should be UNIT_CHANNELS without x, y, x2, y2', () => {
      assert.deepEqual(NONSPATIAL_CHANNELS, without(UNIT_CHANNELS, ['x', 'y', 'x2', 'y2']));
    });
  });

  describe('NONSPATIAL_SCALE_CHANNELS', () => {
    it('should be SCALE_CHANNELS without x, y, x2, y2', () => {
      assert.deepEqual(NONSPATIAL_SCALE_CHANNELS, without(SCALE_CHANNELS, ['x', 'y']));
    });
  });

  describe('hasScale', () => {
    it('should return true for all scale channel', () => {
      for (const channel of SCALE_CHANNELS) {
        assert(hasScale(channel));
      }
    });
  });

  describe('rangeType', () => {
    it('should be defined for all channels (no error).', () => {
      for (const c of CHANNELS) {
        assert.doesNotThrow(() => {
          rangeType(c);
        });
      }
    });
  });
});
