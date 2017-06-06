import {stringValue} from '../../../util';
import {TransformCompiler} from './transforms';

const inputBindings:TransformCompiler = {
  has: function(selCmpt) {
    return selCmpt.type === 'single' && selCmpt.resolve === 'global' &&
      selCmpt.bind && selCmpt.bind !== 'scales';
  },

  topLevelSignals: function(model, selCmpt, signals) {
    const name = selCmpt.name;
    const proj = selCmpt.project;
    const bind = selCmpt.bind;
    const datum = '(item().isVoronoi ? datum.datum : datum)';

    proj.forEach(function(p) {
      signals.unshift({
        name: name + id(p.field),
        value: '',
        on: [{
          events: selCmpt.events,
          update: `${datum}[${stringValue(p.field)}]`
        }],
        bind: bind[p.field] || bind[p.encoding] || bind
      });
    });

    return signals;
  },

  signals: function(model, selCmpt, signals) {
    const name = selCmpt.name;
    const proj = selCmpt.project;
    const signal = signals.filter((s) => s.name === name)[0];
    const fields = proj.map((p) => stringValue(p.field)).join(', ');
    const values = proj.map((p) => name + id(p.field)).join(', ');

    signal.update = `{fields: [${fields}], values: [${values}]}`;
    delete signal.value;
    delete signal.on;

    return signals;
  }
};

export {inputBindings as default};

function id(str: string) {
  return '_' + str.replace(/\W/g, '_');
}
