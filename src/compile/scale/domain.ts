import {SHARED_DOMAIN_OP_INDEX} from '../../aggregate';
import {binToString} from '../../bin';
import {Channel} from '../../channel';
import {MAIN, RAW} from '../../data';
import {DateTime, dateTimeExpr, isDateTime} from '../../datetime';
import {FieldDef} from '../../fielddef';
import * as log from '../../log';
import {Domain, hasDiscreteDomain, isBinScale, isSelectionDomain, Scale, ScaleConfig, ScaleType} from '../../scale';
import {isSortField} from '../../sort';
import * as util from '../../util';
import {
  FieldRefUnionDomain,
  isDataRefDomain,
  isDataRefUnionedDomain,
  isFieldRefUnionDomain,
  isSignalRefDomain,
  VgDataRef,
  VgDomain,
  VgSortField
} from '../../vega.schema';
import {VgSignalRef} from '../../vega.schema';
import {UnitModel} from '../unit';


export function initDomain(domain: Domain, fieldDef: FieldDef<string>, scale: ScaleType, scaleConfig: ScaleConfig) {
  if (domain === 'unaggregated') {
    const {valid, reason} = canUseUnaggregatedDomain(fieldDef, scale);
    if(!valid) {
      log.warn(reason);
      return undefined;
    }
  } else if (domain === undefined && scaleConfig.useUnaggregatedDomain) {
    // Apply config if domain is not specified.
    const {valid} = canUseUnaggregatedDomain(fieldDef, scale);
    if (valid) {
      return 'unaggregated';
    }
  }

  return domain;
}


export function parseDomain(model: UnitModel, channel: Channel): VgDomain {
  const scale = model.scale(channel);

  // If channel is either X or Y then union them with X2 & Y2 if they exist
  if (channel === 'x' && model.channelHasField('x2')) {
    if (model.channelHasField('x')) {
      return unionDomains(parseSingleChannelDomain(scale, model, 'x'), parseSingleChannelDomain(scale, model, 'x2'));
    } else {
      return parseSingleChannelDomain(scale, model, 'x2');
    }
  } else if (channel === 'y' && model.channelHasField('y2')) {
    if (model.channelHasField('y')) {
      return unionDomains(parseSingleChannelDomain(scale, model, 'y'), parseSingleChannelDomain(scale, model, 'y2'));
    } else {
      return parseSingleChannelDomain(scale, model, 'y2');
    }
  }
  return parseSingleChannelDomain(scale, model, channel);
}

function parseSingleChannelDomain(scale: Scale, model: UnitModel, channel:Channel): VgDomain {
  const fieldDef = model.fieldDef(channel);

  if (scale.domain && scale.domain !== 'unaggregated' && !isSelectionDomain(scale.domain)) { // explicit value
    if (isDateTime(scale.domain[0])) {
      return (scale.domain as DateTime[]).map((dt) => {
        return {signal: dateTimeExpr(dt, true)};
      });
    }
    return scale.domain;
  }

  const stack = model.stack;
  if (stack && channel === stack.fieldChannel) {
    if(stack.offset === 'normalize') {
      return [0, 1];
    }
    return {
      data: model.requestDataName(MAIN),
      fields: [
        model.field(channel, {suffix: 'start'}),
        model.field(channel, {suffix: 'end'})
      ]
    };
  }

  const sort = domainSort(model, channel, scale.type);

  if (scale.domain === 'unaggregated') {
    return {
      data: model.requestDataName(MAIN),
      fields: [
        model.field(channel, {aggregate: 'min'}),
        model.field(channel, {aggregate: 'max'})
      ]
    };
  } else if (fieldDef.bin) { // bin
    if (isBinScale(scale.type)) {
      const signal = model.getName(`${binToString(fieldDef.bin)}_${fieldDef.field}_bins`);
      return {signal: `sequence(${signal}.start, ${signal}.stop + ${signal}.step, ${signal}.step)`};
    }

    if (hasDiscreteDomain(scale.type)) {
      // ordinal bin scale takes domain from bin_range, ordered by bin_start
      // This is useful for both axis-based scale (x, y, column, and row) and legend-based scale (other channels).
      return {
        data: model.requestDataName(MAIN),
        field: model.field(channel, {binSuffix: 'range'}),
        sort: {
          field: model.field(channel, {binSuffix: 'start'}),
          op: 'min' // min or max doesn't matter since same _range would have the same _start
        }
      };
    } else { // continuous scales
      if (channel === 'x' || channel === 'y') {
        // X/Y position have to include start and end for non-ordinal scale
        return {
          data: model.requestDataName(MAIN),
          fields: [
            model.field(channel, {binSuffix: 'start'}),
            model.field(channel, {binSuffix: 'end'})
          ]
        };
      } else {
        // TODO: use bin_mid
        return {
          data: model.requestDataName(MAIN),
          field: model.field(channel, {binSuffix: 'start'})
        };
      }
    }
  } else if (sort) {
    return {
      // If sort by aggregation of a specified sort field, we need to use RAW table,
      // so we can aggregate values for the scale independently from the main aggregation.
      data: util.isBoolean(sort) ? model.requestDataName(MAIN) : model.requestDataName(RAW),
      field: model.field(channel),
      sort: sort
    };
  } else {
    return {
      data: model.requestDataName(MAIN),
      field: model.field(channel)
    };
  }
}


export function domainSort(model: UnitModel, channel: Channel, scaleType: ScaleType): VgSortField {
  if (!hasDiscreteDomain(scaleType)) {
    return undefined;
  }

  const sort = model.sort(channel);

  // Sorted based on an aggregate calculation over a specified sort field (only for ordinal scale)
  if (isSortField(sort)) {
    return sort;
  }

  if (util.contains(['ascending', 'descending', undefined /* default =ascending*/], sort)) {
    return true;
  }

  // sort === 'none'
  return undefined;
}



/**
 * Determine if a scale can use unaggregated domain.
 * @return {Boolean} Returns true if all of the following conditons applies:
 * 1. `scale.domain` is `unaggregated`
 * 2. Aggregation function is not `count` or `sum`
 * 3. The scale is quantitative or time scale.
 */
export function canUseUnaggregatedDomain(fieldDef: FieldDef<string>, scaleType: ScaleType): {valid: boolean, reason?: string} {
  if (!fieldDef.aggregate) {
    return {
      valid: false,
      reason: log.message.unaggregateDomainHasNoEffectForRawField(fieldDef)
    };
  }

  if (!SHARED_DOMAIN_OP_INDEX[fieldDef.aggregate]) {
    return {
      valid: false,
      reason: log.message.unaggregateDomainWithNonSharedDomainOp(fieldDef.aggregate)
    };
  }

  if (fieldDef.type === 'quantitative') {
    if (scaleType === 'log') {
      return {
        valid: false,
        reason: log.message.unaggregatedDomainWithLogScale(fieldDef)
      };
    }
  }

  return {valid: true};
}

/**
 * Convert the domain to an array of data refs or an array of values. Also, throw
 * away sorting information since we always sort the domain when we union two domains.
 */
function normalizeDomain(domain: VgDomain): (any[] | VgDataRef | VgSignalRef)[] {
  if (util.isArray(domain)) {
    return [domain];
  } else if (isSignalRefDomain(domain)) {
    return [domain];
  } else if (isDataRefDomain(domain)) {
    delete domain.sort;
    return [domain];
  } else if(isFieldRefUnionDomain(domain)) {
    return domain.fields.map(d => {
      return {
        data: domain.data,
        field: d
      };
    });
  } else if (isDataRefUnionedDomain(domain)) {
    return domain.fields;
  }
  /* istanbul ignore next: This should never happen. */
  throw new Error(log.message.INVAID_DOMAIN);
}

/**
 * Union two data domains. A unioned domain is always sorted.
 */
export function unionDomains(domain1: VgDomain, domain2: VgDomain): VgDomain {
  const normalizedDomain1 = normalizeDomain(domain1);
  const normalizedDomain2 = normalizeDomain(domain2);

  let domains = normalizedDomain1.concat(normalizedDomain2);
  domains = util.unique(domains, util.hash);

  if (domains.length > 1) {
    const allData = domains.map(d => {
      if (isDataRefDomain(d)) {
        return d.data;
      }
      return null;
    });

    if (util.unique(allData, x => x).length === 1 && allData[0] !== null) {
      // create a union domain of different fields with a single data source
      const domain: FieldRefUnionDomain = {
        data: allData[0],
        fields: domains.map(d => (d as VgDataRef).field)
      };
      return domain;
    }

    return {fields: domains, sort: true};
  } else {
    return domains[0];
  }
}
