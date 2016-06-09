import {UnitModel} from '../unit';
import {X, Y, COLOR, TEXT, SIZE, ANCHOR, OFFSET} from '../../channel';
import {applyMarkConfig, applyColorAndOpacity, formatMixins} from '../common';
import {extend, contains} from '../../util';
import {QUANTITATIVE, ORDINAL, TEMPORAL} from '../../type';

export namespace label {
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
        field: model.field(COLOR, model.fieldDef(COLOR).type === ORDINAL ? {prefn: 'rank_'} : {})
      }
    };
  }
  
  export function properties(model: UnitModel, visible: boolean=false) {
    // TODO Use Vega's marks properties interface
    let p: any = visible ? {
      xc:       {field: 'label_xc'}, // presets so transform can change values
      yc:       {field: 'label_yc'},
      align:    {field: 'label_align'},
      fill:     {field: 'label_color'},
      baseline: {field: 'label_baseline'}
    } : {};

    applyMarkConfig(p, model,
      ['angle', 'dx', 'dy', 'font', 'fontWeight',
        'fontStyle', 'radius', 'theta', 'text']);
        
    const fieldDef = model.fieldDef(TEXT);

    // size
    if (model.has(SIZE)) {
      p.fontSize = { field: model.field(SIZE, extend({ datum: true }, visible ? { prefn: 'datum.' } : {} )) };
    } else {
      p.fontSize = { value: sizeValue(model) };
    }
    
    p.opacity = visible ? { field: 'label_opacity' } : { value: 0 };

    // text
    if (model.has(TEXT)) {
      if (contains([QUANTITATIVE, TEMPORAL], model.fieldDef(TEXT).type)) {
        const format = model.config().mark.format;
        extend(p, formatMixins(model, TEXT, format));
      } else {
        p.text = { field: model.field(TEXT, extend({datum: true}, visible ? { prefn: 'datum.' } : {} )) };
      }
    } else if (fieldDef.value) {
      p.text = { value: fieldDef.value };
    }

    return p;
  }
  
  export function transform(model: UnitModel, reference?: UnitModel) {
    const opacity        = model.config().mark.opacity;
    const anchorFieldDef = model.encoding().anchor;
    const offsetFieldDef = model.encoding().offset;
    const colorFieldDef  = model.encoding().color;
    
    let t: any = { 
      type: 'label',
      anchor: anchorFieldDef ? anchorFieldDef.value : 'auto',
      offset: offsetFieldDef ? offsetFieldDef.value : 'auto',
      color: colorFieldDef ? colorFieldDef.value : 'black',
      opacity: opacity ? opacity : 1
    };
    
    if (reference && reference.config().mark.orient) {
      t.orientation = reference.config().mark.orient;
    }
    
    return [t];
  }

  function sizeValue(model: UnitModel) {
    const fieldDef = model.fieldDef(SIZE);
    if (fieldDef && fieldDef.value !== undefined) {
       return fieldDef.value;
    }

    return model.config().mark.fontSize;
  }
  
  export function ref(model: UnitModel) {
    // TODO(#240): fill this method
    return undefined;
  }
}
