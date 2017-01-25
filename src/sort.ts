import {AggregateOp} from './aggregate';

export namespace SortOrder {
  export const ASCENDING: 'ascending' = 'ascending';
  export const DESCENDING: 'descending' = 'descending';
}

export type SortOrder = typeof SortOrder.ASCENDING | typeof SortOrder.DESCENDING | null;

export interface SortField {
  /**
   * The field name to aggregate over.
   */
  field: string;
  /**
   * The sort aggregation operator
   */
  op: AggregateOp;

  order?: SortOrder;
}

export function isSortField(sort: SortOrder | SortField): sort is SortField {
  return !!sort && !!sort['field'] && !!sort['op'];
}
