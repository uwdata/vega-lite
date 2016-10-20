/** Constants and utilities for data type */

export namespace Types {
  export const QUANTITATIVE: 'quantitative' = 'quantitative';
  export const ORDINAL: 'ordinal' = 'ordinal';
  export const TEMPORAL: 'temporal' = 'temporal';
  export const NOMINAL: 'nominal' = 'nominal';
}

export type Type = typeof Types.NOMINAL | typeof Types.ORDINAL | typeof Types.QUANTITATIVE | typeof Types.TEMPORAL;

export const QUANTITATIVE = Types.QUANTITATIVE;
export const ORDINAL = Types.ORDINAL;
export const TEMPORAL = Types.TEMPORAL;
export const NOMINAL = Types.NOMINAL;

/**
 * Mapping from full type names to short type names.
 * @type {Object}
 */
export const SHORT_TYPE = {
  quantitative: 'Q',
  temporal: 'T',
  nominal: 'N',
  ordinal: 'O'
};
/**
 * Mapping from short type names to full type names.
 * @type {Object}
 */
export const TYPE_FROM_SHORT_TYPE = {
  Q: QUANTITATIVE,
  T: TEMPORAL,
  O: ORDINAL,
  N: NOMINAL
};

/**
 * Get full, lowercase type name for a given type.
 * @param  type
 * @return Full type name.
 */
export function getFullName(type: Type): Type {
  const typeString = <any>type;  // force type as string so we can translate short types
  return TYPE_FROM_SHORT_TYPE[typeString.toUpperCase()] || // short type is uppercase by default
         typeString.toLowerCase();
}
