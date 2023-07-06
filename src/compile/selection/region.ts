import {OnEvent, Signal} from 'vega';
import {stringValue} from 'vega-util';
import {SelectionCompiler, TUPLE, unitName} from './index.js';
import {warn} from '../../log/index.js';
import {BRUSH} from './interval.js';
import scales from './scales.js';
import {SELECTION_ID} from '../../selection.js';

export const SCREEN_PATH = '_screen_path';

const region: SelectionCompiler<'region'> = {
  defined: selCmpt => selCmpt.type === 'region',

  parse: (model, selCmpt, selDef) => {
    // Region selections are only valid over the SELECTION_ID field.
    // As a result, we don't expose "fields" as a valid property of the interface
    // and instead hardwire it here during parsing.
    selDef.select = {type: 'region', fields: [SELECTION_ID]} as any;
  },

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

    const regionEvents = selCmpt.events.reduce((on, evt) => {
      if (!evt.between) {
        warn(`${evt} is not an ordered event stream for region selections.`);
        return on;
      }

      return [
        ...on,
        {events: evt.between[0], update: `[[x(unit), y(unit)]]`},
        {events: evt, update: `lassoAppend(${screenPathName}, clamp(x(unit), 0, ${w}), clamp(y(unit), 0, ${h}))`}
      ];
    }, [] as OnEvent[]);

    signalsToAdd.push({
      name: screenPathName,
      init: '[]',
      on: regionEvents
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
              signal: `lassoPath(${screenPathName})`
            }
          }
        }
      },
      ...marks
    ];
  }
};

export default region;
