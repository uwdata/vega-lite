import {X, Y, COLOR, TEXT, SIZE} from '../../channel';
import {applyConfig, applyColorAndOpacity, numberFormat, timeFormatExpression} from '../common';
import {Config} from '../../config';
import {FieldDef, field} from '../../fielddef';
import {QUANTITATIVE, TEMPORAL} from '../../type';
import {UnitModel} from '../unit';
import * as ref from './valueref';
import {VgValueRef} from '../../vega.schema';

export namespace text {
  export function markType() {
    return 'text';
  }

  export function background(model: UnitModel) {
    return {
      x: { value: 0 },
      y: { value: 0 },
      width: { field: { group: 'width' } },
      height: { field: { group: 'height' } },
      fill: {
        scale: model.scaleName(COLOR),
        field: model.field(COLOR)
      }
    };
  }

  export function properties(model: UnitModel) {
    // TODO Use Vega's marks properties interface
    let p: any = {};

    applyConfig(p, model.config().text,
      ['angle', 'align', 'baseline', 'dx', 'dy', 'font', 'fontWeight',
        'fontStyle', 'radius', 'theta', 'text']);

    const config = model.config();
    const stack = model.stack();
    const textFieldDef = model.encoding().text;

    // TODO: refactor how refer to scale as discussed in https://github.com/vega/vega-lite/pull/1613

    p.x = ref.stackable(X, model.encoding().x, model.scaleName(X), model.scale(X), stack, xDefault(config, textFieldDef));
    p.y = ref.stackable(Y, model.encoding().y, model.scaleName(Y), model.scale(Y), stack, ref.midY(config));

    p.fontSize = ref.midPoint(SIZE, model.encoding().size, model.scaleName(SIZE), model.scale(SIZE),
       {value: config.text.fontSize}
    );

    p.text = text(textFieldDef, model.scaleName(TEXT), config);

    if (model.config().text.applyColorToBackground && !model.has(X) && !model.has(Y)) {
      p.fill = {value: 'black'}; // TODO: add rules for swapping between black and white
      // opacity
      const opacity = model.config().mark.opacity;
      if (opacity) { p.opacity = { value: opacity }; };
    } else {
      applyColorAndOpacity(p, model);
    }

    return p;
  }

  function xDefault(config: Config, textFieldDef:FieldDef): VgValueRef {
    if (textFieldDef && textFieldDef.type === QUANTITATIVE) {
      return { field: { group: 'width' }, offset: -5 };
    }
    // TODO: allow this to fit (Be consistent with ref.midX())
    return { value: config.scale.textXRangeStep / 2 };
  }

  function text(textFieldDef: FieldDef, scaleName: string, config: Config): VgValueRef {
    // text
    if (textFieldDef) {
      if (textFieldDef.field) {
        if (QUANTITATIVE === textFieldDef.type) {
          // FIXME: what happens if we have bin?
          const format = numberFormat(textFieldDef, config.text.format, config, TEXT);
          return {
            signal: `format(${field(textFieldDef, { datum: true })}, '${format}')`
          };
        } else if (TEMPORAL === textFieldDef.type) {
          return {
            signal: timeFormatExpression(field(textFieldDef, {datum: true}), textFieldDef.timeUnit, config.text.format, config.text.shortTimeLabels, config)
          };
        } else {
          return { field: textFieldDef.field };
        }
      } else if (textFieldDef.value) {
        return { value: textFieldDef.value };
      }
    }
    return {value: config.text.text};
  }
}
