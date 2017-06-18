import {AxisOrient} from '../../axis';
import {Channel, SpatialScaleChannel, X} from '../../channel';
import {ScaleType} from '../../scale';
import {NOMINAL, ORDINAL, TEMPORAL} from '../../type';
import {contains, extend, keys} from '../../util';
import {VgAxis} from '../../vega.schema';
import {timeFormatExpression} from '../common';
import {UnitModel} from '../unit';

export function labels(model: UnitModel, channel: SpatialScaleChannel, specifiedLabelsSpec: any, def: VgAxis) {
  const fieldDef = model.fieldDef(channel) ||
    (
      channel === 'x' ? model.fieldDef('x2') :
      channel === 'y' ? model.fieldDef('y2') :
      undefined
    );
  const axis = model.axis(channel);
  const config = model.config;

  let labelsSpec: any = {};

  // Text
  if (fieldDef.type === TEMPORAL) {
    const isUTCScale = model.getScaleComponent(channel).get('type') === ScaleType.UTC;

    labelsSpec.text =  {
      signal: timeFormatExpression('datum.value', fieldDef.timeUnit, axis.format, config.axis.shortTimeLabels, config.timeFormat, isUTCScale)
    };
  }

  // Label Angle
  if (axis.labelAngle !== undefined) {
    labelsSpec.angle = {value: axis.labelAngle};
  } else {
    // auto rotate for X
    if (channel === X && (contains([NOMINAL, ORDINAL], fieldDef.type) || !!fieldDef.bin || fieldDef.type === TEMPORAL)) {
      labelsSpec.angle = {value: 270};
    }
  }

  if (labelsSpec.angle && channel === 'x') {
    // Make angle within [0,360)
    const angle = ((labelsSpec.angle.value % 360) + 360) % 360;
    const align = labelAlign(angle, def.orient);
    if (align) {
      labelsSpec.align = {value: align};
    }

    // Auto set baseline if x is rotated by 90, or -90
    if (contains([90, 270], angle)) {
      labelsSpec.baseline = {value: 'middle'};
    }
  }

  labelsSpec = {
    ...labelsSpec,
    ...specifiedLabelsSpec
  };

  return keys(labelsSpec).length === 0 ? undefined : labelsSpec;
}

export function labelAlign(angle: number, orient: AxisOrient) {
  if (angle && angle > 0) {
    if (angle > 180) {
      return orient === 'top' ? 'left' : 'right';
    }  else if (angle < 180) {
      return orient === 'top' ? 'right': 'left';
    }
  }
  return undefined;
}

