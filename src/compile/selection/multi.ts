import {stringValue} from 'vega-util';
import {SelectionInit} from '../../selection';
import {accessPathWithDatum} from '../../util';
import {UnitModel} from '../unit';
import {assembleInit, SelectionCompiler, SelectionComponent, STORE, TUPLE, unitName} from './selection';
import {TUPLE_FIELDS} from './transforms/project';

export function singleOrMultiSignals(model: UnitModel, selCmpt: SelectionComponent<'single' | 'multi'>) {
  const name = selCmpt.name;
  const fieldsSg = name + TUPLE + TUPLE_FIELDS;
  const proj = selCmpt.project;
  const datum = '(item().isVoronoi ? datum.datum : datum)';
  const values = proj
    .map(p => {
      const fieldDef = model.fieldDef(p.channel);
      // Binned fields should capture extents, for a range test against the raw field.
      return fieldDef && fieldDef.bin
        ? `[${accessPathWithDatum(model.vgField(p.channel, {}), datum)}, ` +
            `${accessPathWithDatum(model.vgField(p.channel, {binSuffix: 'end'}), datum)}]`
        : `${accessPathWithDatum(p.field, datum)}`;
    })
    .join(', ');

  // Only add a discrete selection to the store if a datum is present _and_
  // the interaction isn't occurring on a group mark. This guards against
  // polluting interactive state with invalid values in faceted displays
  // as the group marks are also data-driven. We force the update to account
  // for constant null states but varying toggles (e.g., shift-click in
  // whitespace followed by a click in whitespace; the store should only
  // be cleared on the second click).
  const update = `unit: ${unitName(model)}, fields: ${fieldsSg}, values`;
  const signals: any[] = [
    {
      name: name + TUPLE,
      on: [
        {
          events: selCmpt.events,
          update: `datum && item().mark.marktype !== 'group' ? {${update}: [${values}]} : null`,
          force: true
        }
      ]
    }
  ];

  if (selCmpt.init) {
    const insert = selCmpt.init.map((i: SelectionInit | SelectionInit[]) => {
      const str = assembleInit(i);
      return `{${update}: ${str}}`;
    });
    signals.push({
      name: `${name}_init`,
      init: `modify(${stringValue(selCmpt.name + STORE)}, [${insert}])`
    });
  }

  return signals;
}

const multi: SelectionCompiler<'multi'> = {
  signals: singleOrMultiSignals,

  modifyExpr: (model, selCmpt) => {
    const tpl = selCmpt.name + TUPLE;
    return tpl + ', ' + (selCmpt.resolve === 'global' ? 'null' : `{unit: ${unitName(model)}}`);
  }
};

export default multi;
