import {X, Y} from '../../channel';
import {isFieldDef} from '../../fielddef';
import {ScaleType, hasDiscreteDomain} from '../../scale';
import {RECT} from '../../mark';
import * as log from '../../log';

import * as mixins from './mixins';
import {UnitModel} from '../unit';

import {MarkCompiler} from './base';

export const rect: MarkCompiler = {
  vgMark: 'rect',
  role: undefined,
  encodeEntry: (model: UnitModel) => {
    return {
      ...x(model),
      ...y(model),
      ...mixins.color(model),
      ...mixins.nonPosition('opacity', model),
    };
  }
};

function x(model: UnitModel) {
  const xDef = model.encoding.x;
  const x2Def = model.encoding.x2;
  const xScale = model.scale(X);

  if (isFieldDef(xDef) && xDef.bin && !x2Def) {
    return mixins.binnedPosition('x', model, 0);
  } else if (xScale && hasDiscreteDomain(xScale.type)) {
    /* istanbul ignore else */
    if (xScale.type === ScaleType.BAND) {
      return mixins.bandPosition('x', model);
    } else {
      // We don't support rect mark with point/ordinal scale
      throw new Error(log.message.scaleTypeNotWorkWithMark(RECT, xScale.type));
    }
  } else { // continuous scale or no scale
    return {
      ...mixins.pointPosition('x', model, 'baseOrMax'),
      ...mixins.pointPosition2(model, 'base', 'x2')
    };
  }
}

function y(model: UnitModel) {
  const yDef = model.encoding.y;
  const y2Def = model.encoding.y2;
  const yScale = model.scale(Y);

  if (isFieldDef(yDef) && yDef.bin && !y2Def) {
    return mixins.binnedPosition('y', model, 0);
  } else if (yScale && hasDiscreteDomain(yScale.type)) {
    /* istanbul ignore else */
    if (yScale.type === ScaleType.BAND) {
      return mixins.bandPosition('y', model);
    } else {
      // We don't support rect mark with point/ordinal scale
      throw new Error(log.message.scaleTypeNotWorkWithMark(RECT, yScale.type));
    }
  } else { // continuous scale or no scale
    return {
      ...mixins.pointPosition('y', model, 'baseOrMax'),
      ...mixins.pointPosition2(model, 'base', 'y2')
    };
  }
}
