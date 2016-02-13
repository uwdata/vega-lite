import {axis, Axis} from './axis.schema';
import {bin, Bin} from './bin.schema';
import {legend, Legend} from './legend.schema';
import {typicalScale, ordinalOnlyScale, Scale} from './scale.schema';
import {sort, sortEnum, Sort} from './sort.schema';

import {AGGREGATE_OPS} from '../aggregate';
import {toMap, duplicate} from '../util';
import {mergeDeep} from './schemautil';
import {TIMEUNITS} from '../timeunit';
import {NOMINAL, ORDINAL, QUANTITATIVE, TEMPORAL, Type} from '../type';

/**
 *  Interface for any kind of FieldDef;
 *  For simplicity, we do not declare multiple interfaces of FieldDef like
 *  we do for JSON schema.
 */
export interface FieldDef {
  field?: string;
  type?: Type;
  value?: any;
  unit?: string;

  // function
  timeUnit?: string;
  bin?: boolean | Bin;

  aggregate?: string;
  sort?: Sort | string;

  // override vega components
  axis?: Axis | boolean;
  legend?: Legend | boolean;
  scale?: Scale;

  // TODO: maybe extend this in other app?
  // unused metadata -- for other application
  displayName?: string;
}

export const aggregate = {
  type: 'string',
  enum: AGGREGATE_OPS,
  supportedEnums: {
    quantitative: AGGREGATE_OPS,
    ordinal: ['median','min','max'],
    nominal: [],
    temporal: ['mean', 'median', 'min', 'max'], // TODO: revise what should time support
    '': ['count']
  },
  supportedTypes: toMap([QUANTITATIVE, NOMINAL, ORDINAL, TEMPORAL, ''])
};

const fieldDef = {
  type: 'object',
  properties: {
    field: {
      type: 'string'
    },
    value: {
      type: ['string', 'number']
    },
    type: {
      type: 'string',
      enum: [NOMINAL, ORDINAL, QUANTITATIVE, TEMPORAL]
    },
    unit : {
      type : 'string'
    },
    bin: bin,
    timeUnit: {
      type: 'string',
      enum: TIMEUNITS,
      supportedTypes: toMap([TEMPORAL])
    },
    aggregate: aggregate,
  }
};

const fieldDefWithScale = mergeDeep(duplicate(fieldDef), {
  properties: {
    scale: typicalScale,
    sort: sort
  }
});

export const positionFieldDef = mergeDeep(duplicate(fieldDefWithScale), {
  required: ['field', 'type'], // TODO: remove if possible
  properties: {
    scale: {
      // TODO: remove
      // replacing default values for just these two axes
      properties: {
        padding: {default: 1}
      }
    },
    axis: axis
  }
});

export const colorFieldDef = mergeDeep(duplicate(fieldDefWithScale), {
  properties: {
    legend: legend
  }
});

export const sizeFieldDef = colorFieldDef;

// Detail

export const detailFieldDefs = {
  default: undefined,
  oneOf: [duplicate(fieldDef), {
    type: 'array',
    items: duplicate(fieldDef)
  }]
};

// Order Path have no scale

const orderFieldDef = mergeDeep(duplicate(fieldDef), {
  properties: {
    sort: sortEnum
  }
});

export const orderFieldDefs = {
  default: undefined,
  oneOf: [duplicate(orderFieldDef), {
    type: 'array',
    items: duplicate(orderFieldDef)
  }]
};

// Text has default value = `Abc`

export const textFieldDef = mergeDeep(duplicate(fieldDef), {
  properties: {
    value: {
      type: 'string',
      default: 'Abc'
    }
  }
});

// Shape / Row / Column only supports ordinal scale

const fieldDefWithOrdinalScale = mergeDeep(duplicate(fieldDef), {
  properties: {
    scale: ordinalOnlyScale,
    sort: sort
  }
});

export const shapeFieldDef =  mergeDeep(duplicate(fieldDefWithOrdinalScale), {
  properties: {
    legend: legend
  }
});

export const facetFieldDef = mergeDeep(duplicate(fieldDefWithOrdinalScale), {
  required: ['field', 'type'],
  properties: {
    axis: axis
  }
});
