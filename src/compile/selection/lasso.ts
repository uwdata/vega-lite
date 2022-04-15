import {OnEvent, Signal, Stream} from 'vega';
import {stringValue} from 'vega-util';
import {SelectionCompiler, SelectionComponent, TUPLE, unitName} from '.';
import {warn} from '../../log';
import {BRUSH} from './interval';
import scales from './scales';
export const SCREEN_PATH = '_screen_path';

const lasso: SelectionCompiler<'lasso'> = {
  defined: selCmpt => selCmpt.type === 'lasso',

  signals: (model, selCmpt, signals) => {
    const name = selCmpt.name;
    const signalsToAdd: Signal[] = [];

    const screenPathName = `${name}${SCREEN_PATH}`;

    const w = model.getSizeSignalRef('width').signal;
    const h = model.getSizeSignalRef('height').signal;

    signalsToAdd.push({
      name: `${name}${TUPLE}`,
      on: [
        {
          events: [{signal: screenPathName}],
          update: `vlSelectionTuples(intersectLasso(${stringValue(
            model.getName('marks')
          )}, ${screenPathName}, unit), {unit: ${unitName(model)}})`
        }
      ]
    });

    const on = events(selCmpt, (def: OnEvent[], evt: Stream) => {
      return [
        ...def,
        {events: evt.between[0], update: `[[x(unit), y(unit)]]`},
        {events: evt, update: `lassoAppend(${screenPathName}, clamp(x(unit), 0, ${w}), clamp(y(unit), 0, ${h}))`}
      ];
    });

    signalsToAdd.push({
      name: screenPathName,
      init: '[]',
      on: on
    });

    return [...signals, ...signalsToAdd];
  },

  marks: (model, selCmpt, marks) => {
    const name = selCmpt.name;
    const {fill, fillOpacity, stroke, strokeDash, strokeWidth} = selCmpt.mark;

    const screenPathName = `${name}${SCREEN_PATH}`;

    // Do not add a brush if we're binding to scales.
    if (scales.defined(selCmpt)) {
      return marks;
    }

    return [
      {
        name: `${name + BRUSH}`,
        type: 'path',
        encode: {
          enter: {
            fill: {value: fill},
            fillOpacity: {value: fillOpacity},
            stroke: {value: stroke},
            strokeWidth: {value: strokeWidth},
            strokeDash: {value: strokeDash}
          },
          update: {
            path: {
              test: true,
              signal: `lassoPath(${screenPathName})`
            }
          }
        }
      },
      ...marks
    ];
  }
};

function events(selCmpt: SelectionComponent<'lasso'>, cb: (def: OnEvent[], evt: Stream) => OnEvent[]): OnEvent[] {
  return selCmpt.events.reduce((on, evt) => {
    if (!evt.between) {
      warn(`${evt} is not an ordered event stream for lasso selections.`);
      return on;
    }
    return cb(on, evt);
  }, [] as OnEvent[]);
}

export default lasso;
