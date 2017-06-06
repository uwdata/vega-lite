import {Channel} from '../../../channel';
import {warn} from '../../../log';
import {hasContinuousDomain, isBinScale} from '../../../scale';
import {stringValue} from '../../../util';
import {UnitModel} from '../../unit';
import {channelSignalName, MODIFY, TUPLE} from '../selection';
import {TransformCompiler} from './transforms';

const scaleBindings:TransformCompiler = {
  clipGroup: true,

  has: function(selCmpt) {
    return selCmpt.type === 'interval' && selCmpt.resolve === 'global' &&
      selCmpt.bind && selCmpt.bind === 'scales';
  },

  parse: function(model, selDef, selCmpt) {
    const bound:Channel[] = selCmpt.scales = [];

    selCmpt.project.forEach(function(p) {
      const channel = p.encoding;
      const scale = model.getScaleComponent(channel);

      if (!scale || !hasContinuousDomain(scale.type) || isBinScale(scale.type)) {
        warn('Scale bindings are currently only supported for scales with unbinned, continuous domains.');
        return;
      }

      scale.domainRaw = {signal: channelSignalName(selCmpt, channel, 'data')};
      bound.push(channel);
    });
  },

  topLevelSignals: function(model, selCmpt, signals) {
    const channels = selCmpt.scales.filter((channel) => {
      return !(signals.filter((s) => s.name === channelSignalName(selCmpt, channel, 'data')).length);
    });

    return signals.concat(channels.map((channel) => {
      return {name: channelSignalName(selCmpt, channel, 'data')};
    }));
  },

  signals: function(model, selCmpt, signals) {
    const name = selCmpt.name;
    signals = signals.filter(function(s) {
      return s.name !== name + TUPLE && s.name !== MODIFY;
    });

    selCmpt.scales.forEach(function(channel) {
      const signal = signals.filter((s) => s.name === channelSignalName(selCmpt, channel, 'data'))[0];
      signal.push = 'outer';
      delete signal.value;
      delete signal.update;
    });

    return signals;
  }
};

export {scaleBindings as default};

export function domain(model: UnitModel, channel: Channel) {
  const scale = stringValue(model.scaleName(channel));
  return `domain(${scale})`;
}
