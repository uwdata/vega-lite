import {isBinned, isBinning} from '../../../bin';
import {getBand, isFieldDef} from '../../../channeldef';
import {hasDiscreteDomain} from '../../../scale';
import {VgEncodeChannel, VgValueRef} from '../../../vega.schema';
import {getMarkPropOrConfig, signalOrValueRef} from '../../common';
import {UnitModel} from '../../unit';
import {getOffset} from './offset';
import {positionRef} from './position-point';
import {position2Ref} from './position-range';
import {rectBinPosition} from './position-rect';
import {MidPointParams} from './valueref';

// This method is a simpler version of position-range, as we don't have to deal with lat/long and the fight between x2 and width (or y2 and height) here.
export function arcRangePosition(
  model: UnitModel,
  {
    channel,
    vgChannel,
    vgChannel2,
    defaultRef
  }: {
    channel: 'radius' | 'theta';
    vgChannel: VgEncodeChannel;
    vgChannel2?: VgEncodeChannel;
    defaultRef: VgValueRef;
  }
) {
  const {encoding, markDef, stack, config} = model;

  const channel2 = channel === 'radius' ? 'radius2' : 'theta2';

  const channelDef = encoding[channel];
  const channelDef2 = encoding[channel2];
  const scale = model.getScaleComponent(channel);
  const scaleType = scale ? scale.get('type') : undefined;
  const scaleName = model.scaleName(channel);

  if (
    isFieldDef(channelDef) &&
    (isBinning(channelDef.bin) || isBinned(channelDef.bin) || (channelDef.timeUnit && !channelDef2)) &&
    !hasDiscreteDomain(scaleType)
  ) {
    const band = getBand({channel, fieldDef: channelDef, stack, markDef, config});

    return rectBinPosition({
      fieldDef: channelDef,
      channel,
      vgChannel,
      vgChannel2,
      markDef,
      scaleName,
      band,
      spacing: 0,
      axisTranslate: 0,
      reverse: scale.get('reverse'),
      config
    });
  }

  const sharedParams: MidPointParams & {channel: 'radius' | 'theta'} = {
    channel,
    channelDef,
    channel2Def: channelDef2,
    markDef,
    config,
    scaleName,
    scale,
    stack,
    offset: 0,
    defaultRef: undefined // defining below
  };

  const defaultValue = getMarkPropOrConfig(channel, markDef, config, {vgChannel});

  const defaultValue2 = getMarkPropOrConfig(channel2, markDef, config, {vgChannel: vgChannel2});

  return {
    [vgChannel]: positionRef({
      ...sharedParams,
      defaultRef: defaultValue !== undefined ? signalOrValueRef(defaultValue) : defaultRef
    }),
    [vgChannel2]: position2Ref({
      ...sharedParams,
      channel: channel2,
      defaultRef: signalOrValueRef(defaultValue2 ?? 0)
    })
  };
}

export function arcPointPosition(channel: 'radius' | 'theta', model: UnitModel) {
  const {encoding, markDef, stack, config} = model;

  const defaultValue = getMarkPropOrConfig(channel, markDef, config);

  const ref = positionRef({
    channel,
    channelDef: encoding[channel],
    markDef,
    config,
    isMidPoint: true,
    scaleName: model.scaleName(channel),
    scale: model.getScaleComponent(channel),
    stack,
    offset: getOffset(channel, markDef),
    defaultRef: defaultValue ? signalOrValueRef(defaultValue) : undefined
  });

  return ref ? {[channel]: ref} : {};
}
