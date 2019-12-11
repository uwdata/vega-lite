import {SecondaryFieldDef, TypedFieldDef} from '../../../../src/channeldef';
import {midPoint} from '../../../../src/compile/mark/encode/valueref';
import {defaultConfig} from '../../../../src/config';

describe('compile/mark/valueref', () => {
  describe('midPoint()', () => {
    const defaultRef = () => ({value: 0});
    it('should return correct value for width', () => {
      const ref = midPoint({
        channel: 'x',
        channelDef: {value: 'width'},
        markDef: {type: 'point'},
        config: defaultConfig,
        scaleName: undefined,
        scale: undefined,
        defaultRef
      });
      expect(ref).toEqual({field: {group: 'width'}});
    });
    it('should return correct value for height', () => {
      const ref = midPoint({
        channel: 'y',
        channelDef: {value: 'height'},
        markDef: {type: 'point'},
        config: defaultConfig,
        scaleName: undefined,
        scale: undefined,
        defaultRef
      });
      expect(ref).toEqual({field: {group: 'height'}});
    });
    it('should return correct value for binned data', () => {
      const fieldDef: TypedFieldDef<string> = {field: 'bin_start', bin: 'binned', type: 'quantitative'};
      const fieldDef2: SecondaryFieldDef<string> = {field: 'bin_end'};
      const ref = midPoint({
        channel: 'x',
        channelDef: fieldDef,
        channel2Def: fieldDef2,
        markDef: {type: 'point'},
        config: defaultConfig,
        scaleName: 'x',
        scale: undefined,
        defaultRef
      });
      expect(ref).toEqual({signal: 'scale("x", 0.5 * datum["bin_start"] + 0.5 * datum["bin_end"])'});
    });
  });
});
