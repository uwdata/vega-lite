import {selector as parseSelector} from 'vega-event-selector';
import {Channel, X, Y} from '../../../channel';
import {stringValue} from '../../../util';
import {BRUSH as INTERVAL_BRUSH, projections as intervalProjections} from '../interval';
import {channelSignalName, SelectionComponent} from '../selection';
import {UnitModel} from './../../unit';
import {default as scalesCompiler, domain} from './scales';
import {TransformCompiler} from './transforms';


const ANCHOR = '_zoom_anchor';
const DELTA  = '_zoom_delta';

const zoom:TransformCompiler = {
  has: function(selCmpt) {
    return selCmpt.type === 'interval' && selCmpt.zoom !== undefined && selCmpt.zoom !== false;
  },

  signals: function(model, selCmpt, signals) {
    const name = selCmpt.name;
    const hasScales = scalesCompiler.has(selCmpt);
    const delta = name + DELTA;
    const {x, y} = intervalProjections(selCmpt);
    const sx = stringValue(model.scaleName(X));
    const sy = stringValue(model.scaleName(Y));
    let events = parseSelector(selCmpt.zoom, 'scope');

    if (!hasScales) {
      events = events.map((e) => (e.markname = name + INTERVAL_BRUSH, e));
    }

    signals.push({
      name: name + ANCHOR,
      on: [{
        events: events,
        update: hasScales ?
          `{x: invert(${sx}, x(unit)), y: invert(${sy}, y(unit))}` :
          `{x: x(unit), y: y(unit)}`
      }]
    }, {
      name: delta,
      on: [{
        events: events,
        force: true,
        update: 'pow(1.001, event.deltaY * pow(16, event.deltaMode))'
      }]
    });

    if (x !== null) {
      onDelta(model, selCmpt, 'x', 'width', signals);
    }

    if (y !== null) {
      onDelta(model, selCmpt, 'y', 'height', signals);
    }

    return signals;
  }
};

export {zoom as default};

function onDelta(model: UnitModel, selCmpt: SelectionComponent, channel: Channel, size: 'width' | 'height', signals: any[]) {
  const name = selCmpt.name;
  const hasScales = scalesCompiler.has(selCmpt);
  const signal:any = signals.filter((s:any) => {
    return s.name === channelSignalName(selCmpt, channel, hasScales ? 'data' : 'visual');
  })[0];
  const sizeSg = model.getSizeSignalRef(size).signal;
  const base = hasScales ? domain(model, channel) : signal.name;
  const anchor = `${name}${ANCHOR}.${channel}`;
  const delta  = name + DELTA;
  const scale  = stringValue(model.scaleName(channel));
  const range  = `[${anchor} + (${base}[0] - ${anchor}) * ${delta}, ` +
    `${anchor} + (${base}[1] - ${anchor}) * ${delta}]`;

  signal.on.push({
    events: {signal: delta},
    update: hasScales ? range : `clampRange(${range}, 0, ${sizeSg})`
  });
}
