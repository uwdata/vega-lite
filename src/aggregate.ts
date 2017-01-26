
export type AggregateOp = 'argmax' | 'argmin' | 'average' | 'count'
  | 'distinct' | 'max' | 'mean' | 'median' | 'min' | 'missing' | 'modeskew'
  | 'q1' | 'q3' | 'stdev' | 'stdevp' | 'sum' | 'valid' | 'values' | 'variance'
  | 'variancep';

export const AGGREGATE_OPS = [
    'values',
    'count',
    'valid',
    'missing',
    'distinct',
    'sum',
    'mean',
    'average',
    'variance',
    'variancep',
    'stdev',
    'stdevp',
    'median',
    'q1',
    'q3',
    'modeskew',
    'min',
    'max',
    'argmin',
    'argmax',
];

/** Additive-based aggregation operations.  These can be applied to stack. */
export const SUM_OPS = [
    'count',
    'sum',
    'distinct',
    'valid',
    'missing'
];

/**
 * Aggregation operators that always produce values within the range [domainMin, domainMax].
 */
export const SHARED_DOMAIN_OPS = [
    'mean',
    'average',
    'median',
    'q1',
    'q3',
    'min',
    'max',
];
