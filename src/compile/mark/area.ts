import {X, Y} from '../../channel';
import {Orient} from '../../config';

import {applyColorAndOpacity, applyMarkConfig} from '../common';
import {UnitModel} from '../unit';
import * as ref from './valueref';

export namespace area {
  export function markType() {
    return 'area';
  }

  export function properties(model: UnitModel) {
    // TODO Use Vega's marks properties interface
    let p: any = {};
    const config = model.config();

    // We should always have orient as we augment it in config.ts
    const orient = config.mark.orient;
    p.orient = { value: orient} ;

    const stack = model.stack();

    // TODO: refactor how refer to scale as discussed in https://github.com/vega/vega-lite/pull/1613

    p.x = ref.stackableX(model.encoding().x, model.scaleName(X), model.scale(X), stack, 'baseX');
    p.y = ref.stackableY(model.encoding().y, model.scaleName(Y), model.scale(Y), stack, 'baseY');

    // Have only x2 or y2 based on orientation
    if (orient === Orient.HORIZONTAL) {
      p.x2 = ref.stackableX2(model.encoding().x, model.encoding().x2, model.scaleName(X), model.scale(X), stack, 'baseX');
    } else {
      p.y2 = ref.stackableY2(model.encoding().y, model.encoding().y2, model.scaleName(Y), model.scale(Y), stack, 'baseY');
    }

    applyColorAndOpacity(p, model);
    applyMarkConfig(p, model, ['interpolate', 'tension']);
    return p;
  }
}
