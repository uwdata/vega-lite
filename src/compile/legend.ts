import {FieldDef} from '../schema/fielddef.schema';

import {COLOR, SIZE, SHAPE, Channel} from '../channel';
import {title as fieldTitle} from '../fielddef';
import {AREA, BAR, TICK, TEXT, LINE, POINT, CIRCLE, SQUARE} from '../mark';
import {extend, keys} from '../util';
import {Model} from './Model';
import {applyMarkConfig, FILL_STROKE_CONFIG, formatMixins as utilFormatMixins, timeFormat} from './util';
import {ORDINAL} from '../type';
import {COLOR_LEGEND, COLOR_LEGEND_LABEL} from './scale';

export function compileLegends(model: Model) {
  var defs = [];

  if (model.has(COLOR) && model.fieldDef(COLOR).legend) {
    const fieldDef = model.fieldDef(COLOR);
    defs.push(compileLegend(model, COLOR, {
      fill: (fieldDef.type === ORDINAL || fieldDef.bin || fieldDef.timeUnit) ?
        // To produce ordinal legend (list, rather than linear range) with correct labels:
        // - For an ordinal field, provide an ordinal scale that maps rank values to field values
        // - For a field with bin or timeUnit, provide an identity ordinal scale
        // (mapping the field values to themselves)
        COLOR_LEGEND :
        model.scaleName(COLOR)
      // TODO: consider if this should be stroke for line
    }));
  }

  if (model.has(SIZE) && model.fieldDef(SIZE).legend) {
    defs.push(compileLegend(model, SIZE, {
      size: model.scaleName(SIZE)
    }));
  }

  if (model.has(SHAPE) && model.fieldDef(SHAPE).legend) {
    defs.push(compileLegend(model, SHAPE, {
      shape: model.scaleName(SHAPE)
    }));
  }
  return defs;
}

export function compileLegend(model: Model, channel: Channel, def) {
  const fieldDef = model.fieldDef(channel);
  const legend = fieldDef.legend;

  // 1.1 Add properties with special rules
  def.title = title(fieldDef);

  extend(def, formatMixins(model, channel));

  // 1.2 Add properties without rules
  ['orient', 'values'].forEach(function(property) {
    const value = legend[property];
    if (value !== undefined) {
      def[property] = value;
    }
  });

  // 2) Add mark property definition groups
  const props = (typeof legend !== 'boolean' && legend.properties) || {};
  ['title', 'symbols', 'legend', 'labels'].forEach(function(group) {
    let value = properties[group] ?
      properties[group](fieldDef, props[group], model, channel) : // apply rule
      props[group]; // no rule -- just default values
    if (value !== undefined) {
      def.properties = def.properties || {};
      def.properties[group] = value;
    }
  });

  return def;
}

export function title(fieldDef: FieldDef) {
  const legend = fieldDef.legend;
  if (typeof legend !== 'boolean' && legend.title) {
    return legend.title;
  } else if ((typeof legend !== 'boolean' && legend.showUnit === 'title')
              || (typeof legend === 'boolean' && fieldDef.unit)) {
    return fieldTitle(fieldDef, true);
  }

  return fieldTitle(fieldDef, false);
}

export function formatMixins(model: Model, channel: Channel) {
  const fieldDef = model.fieldDef(channel);

  // If the channel is binned, we should not set the format because we have a range label
  if (fieldDef.bin) {
    return {};
  }

  const legend = fieldDef.legend;
  return utilFormatMixins(model, channel, typeof legend !== 'boolean' ? legend.format : undefined);
}

namespace properties {
  export function symbols(fieldDef: FieldDef, symbolsSpec, model: Model, channel: Channel) {
    let symbols:any = {};
    const mark = model.mark();

    switch (mark) {
      case BAR:
      case TICK:
      case TEXT:
        symbols.shape = {value: 'square'};

        // set stroke to transparent by default unless there is a config for stroke
        symbols.stroke = {value: 'transparent'};
        applyMarkConfig(symbols, model, FILL_STROKE_CONFIG);

        // no need to apply color to fill as they are set automatically
        break;

      case CIRCLE:
      case SQUARE:
        /* tslint:disable:no-switch-case-fall-through */
        symbols.shape = {value: mark};
        /* tslint:enable:no-switch-case-fall-through */
      case POINT:
        // fill or stroke
        if (model.config().mark.filled) { // filled
          // set stroke to transparent by default unless there is a config for stroke
          symbols.stroke = {value: 'transparent'};
          applyMarkConfig(symbols, model, FILL_STROKE_CONFIG);

          if (model.has(COLOR) && channel === COLOR) {
            symbols.fill = {scale: model.scaleName(COLOR), field: 'data'};
          } else if (model.fieldDef(COLOR).value) {
            symbols.fill = {value: model.fieldDef(COLOR).value};
          } else {
            symbols.fill = {value: model.config().mark.color};
          }
        } else { // stroked
          // set fill to transparent by default unless there is a config for stroke
          symbols.fill = {value: 'transparent'};
          applyMarkConfig(symbols, model, FILL_STROKE_CONFIG);

          if (model.has(COLOR) && channel === COLOR) {
            symbols.stroke = {scale: model.scaleName(COLOR), field: 'data'};
          } else if (model.fieldDef(COLOR).value) {
            symbols.stroke = {value: model.fieldDef(COLOR).value};
          } else {
            symbols.stroke = {value: model.config().mark.color};
          }
        }

        break;
      case LINE:
      case AREA:
        // set stroke to transparent by default unless there is a config for stroke
        symbols.stroke = {value: 'transparent'};
        applyMarkConfig(symbols, model, FILL_STROKE_CONFIG);

        // TODO use shape here after implementing #508
        break;
    }

    symbols = extend(symbols, symbolsSpec || {});

    return keys(symbols).length > 0 ? symbols : undefined;
  }

  export function labels(fieldDef: FieldDef, symbolsSpec, model: Model, channel: Channel): any {
    if (channel === COLOR) {
      if (fieldDef.type === ORDINAL) {
        return {
          text: {
            scale: COLOR_LEGEND,
            field: 'data'
          }
        };
      } else if (fieldDef.bin) {
        return {
          text: {
            scale: COLOR_LEGEND_LABEL,
            field: 'data'
          }
        };
      } else if (fieldDef.timeUnit) {
        return {
          text: {
            template: '{{ datum.data | time:\'' + timeFormat(model, channel) + '\'}}'
          }
        };
      }
    }
    return undefined;
  }
}
