import {FieldDef} from '../../fielddef';
import {extend, keys, differ, Dict, every, duplicate} from '../../util';

import {FacetModel} from './../facet';
import {Model} from './../model';

import {DataComponent} from './data';

const DEFAULT_NULL_FILTERS = {
  nominal: false,
  ordinal: false,
  quantitative: true,
  temporal: true
};

// TODO: rename to invalidFilter
export namespace nullFilter {
  /** Return Hashset of fields for null filtering (key=field, value = true). */
  function parse(model: Model): Dict<boolean> {
    const transform = model.transform();
    let filterInvalid = transform.filterInvalid;

    if (filterInvalid === undefined && transform['filterNull'] !== undefined) {
      filterInvalid = transform['filterNull'];
      console.warn('filterNull is deprecated. Please use filterInvalid instead.');
    }

    return model.reduce(function(aggregator, fieldDef: FieldDef) {
      if (filterInvalid ||
        (filterInvalid === undefined && fieldDef.field && fieldDef.field !== '*' && DEFAULT_NULL_FILTERS[fieldDef.type])) {
        aggregator[fieldDef.field] = true;
      } else {
        // define this so we know that we don't filter nulls for this field
        // this makes it easier to merge into parents
        aggregator[fieldDef.field] = false;
      }
      return aggregator;
    }, {});
  }

  export const parseUnit = parse;

  export function parseFacet(model: FacetModel) {
    const nullFilterComponent = parse(model);
    const childDataComponent = model.child().component.data;

    extend(nullFilterComponent, childDataComponent.nullFilter);
    return nullFilterComponent;
  }

  export function mergeIfCompatible(dataComponent: DataComponent, childDataComponents: DataComponent[]) {
    const nullFilterComponent = childDataComponents.reduce((collector, childData) => {
      extend(collector, childData.nullFilter);
      return collector;
    }, duplicate(dataComponent.nullFilter));

    const compatibleNullfilter = every(childDataComponents, (childData) => {
      return !differ(childData.nullFilter, nullFilterComponent);
    });

    if (compatibleNullfilter) {
      dataComponent.nullFilter = nullFilterComponent;
      childDataComponents.forEach((childData) => {
        delete childData.nullFilter;
      });
    }

    return compatibleNullfilter;
  }

  /** Convert the hashset of fields to a filter transform.  */
  export function assemble(component: DataComponent) {
    const filteredFields = keys(component.nullFilter).filter((field) => {
      // only include fields that has value = true
      return component.nullFilter[field];
    });
    return filteredFields.length > 0 ?
      [{
        type: 'filter',
        test: filteredFields.map(function(fieldName) {
          return '(datum.' + fieldName + '!==null' +
            ' && !isNaN(datum.'+ fieldName + '))';
        }).join(' && ')
      }] : [];
  }
}
