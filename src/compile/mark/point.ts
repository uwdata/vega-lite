import {UnitModel} from '../unit';
import {X, Y, SHAPE, SIZE} from '../../channel';
import {applyColorAndOpacity} from '../common';

export namespace point {
  export function markType() {
    return 'symbol';
  }

  export function properties(model: UnitModel, fixedShape?: string) {
    // TODO Use Vega's marks properties interface
    let p: any = {};

    // x
    if (model.has(X)) {
      p.x = {
        scale: model.scaleName(X),
        field: model.fieldRef(X, { binSuffix: '_mid' })
      };
    } else {
      p.x = { value: model.config().scale.bandSize / 2 };
    }

    // y
    if (model.has(Y)) {
      p.y = {
        scale: model.scaleName(Y),
        field: model.fieldRef(Y, { binSuffix: '_mid' })
      };
    } else {
      p.y = { value: model.config().scale.bandSize / 2 };
    }

    // size
    if (model.has(SIZE)) {
      p.size = {
        scale: model.scaleName(SIZE),
        field: model.fieldRef(SIZE)
      };
    } else {
      p.size = { value: sizeValue(model) };
    }

    // shape
    if (fixedShape) { // square and circle marks
      p.shape = { value: fixedShape };
    } else if (model.has(SHAPE)) {
      p.shape = {
        scale: model.scaleName(SHAPE),
        field: model.fieldRef(SHAPE)
      };
    } else if (model.fieldDef(SHAPE).value) {
      p.shape = { value: model.fieldDef(SHAPE).value };
    } else if (model.config().mark.shape) {
      p.shape = { value: model.config().mark.shape };
    }

    applyColorAndOpacity(p, model);
    return p;
  }

  function sizeValue(model: UnitModel) {
    const fieldDef = model.fieldDef(SIZE);
    if (fieldDef && fieldDef.value !== undefined) {
       return fieldDef.value;
    }

    return model.config().mark.size;
  }

  export function labels(model: UnitModel) {
    // TODO(#240): fill this method
  }
}

export namespace circle {
  export function markType() {
    return 'symbol';
  }

  export function properties(model: UnitModel) {
    return point.properties(model, 'circle');
  }

  export function labels(model: UnitModel) {
    // TODO(#240): fill this method
    return undefined;
  }
}

export namespace square {
  export function markType() {
    return 'symbol';
  }

  export function properties(model: UnitModel) {
    return point.properties(model, 'square');
  }

  export function labels(model: UnitModel) {
    // TODO(#240): fill this method
    return undefined;
  }
}
