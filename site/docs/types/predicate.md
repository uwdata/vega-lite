---
layout: docs
menu: docs
title: Predicate
permalink: /docs/predicate.html
---

To test a data point in a [filter transform](filter.html) or a [`test` property in conditonal encoding](https://vega.github.io/vega-lite/docs/condition.html), a prediction definition of the following forms must be specified:

1. a [Vega expression](https://vega.github.io/vega-lite/docs/types.html#expression) string, where `datum` can be used to refer to the current data object. For example, `datum.b2 > 60` would test if the value in the field `b2` for each data point is over 60.

2. one of the [field predicates](https://vega.github.io/vega-lite/docs/predicate.html#field-predicate): [`equal`](https://vega.github.io/vega-lite/docs/predicate.html#field-equal-predicate), [`lt`](https://vega.github.io/vega-lite/docs/predicate.html#lt-predicate), [`lte`](https://vega.github.io/vega-lite/docs/predicate.html#lte-predicate), [`gt`](https://vega.github.io/vega-lite/docs/predicate.html#gt-predicate), [`gte`](https://vega.github.io/vega-lite/docs/predicate.html#gte-predicate), [`range`](https://vega.github.io/vega-lite/docs/predicate.html#range-predicate), [`oneOf`](https://vega.github.io/vega-lite/docs/predicate.html#one-of-predicate), or [`valid`](https://vega.github.io/vega-lite/docs/predicate.html#valid-predicate),

3. a [selection predicate](https://vega.github.io/vega-lite/docs/predicate.html#selection-predicate), which define the names of a selection hat the data point should belong to (or a logical composition of selections).

4. a [logical composition](https://vega.github.io/vega-lite/docs/predicate.html#composition) of (1), (2), or (3).

## Field Predicate

Test if a field in the data point satisfies certain conditions.

For a field predicate, a `field` must be provided along with one of the predicate properties: [`equal`](#equal-predicate), [`lt`](#lt-predicate) (less than), [`lte`](#lte-predicate) (less than or equal), [`gt`](#gt-predicate) (greater than), [`gte`](#gte-predicate)(greater than or equal), [`range`](#range-predicate), or [`oneOf`](#one-of-predicate). Values of these operators can be primitive types (string, number, boolean) or a [DateTime definition object](types.html#datetime) to describe time. In addition, `timeUnit` can be provided to further transform a temporal `field`.

{% include table.html props="field,timeUnit" source="FieldEqualPredicate" %}

{:#equal-predicate}

### Field Equal Predicate

{% include table.html props="equal" source="FieldEqualPredicate" %}

For example, to check if the `car_color` field's value is equal to `"red"`, we can use the following predicate:

```json
{"field": "car_color", "equal": "red"}
```

{:#lt-predicate}

### Field Less Than Predicate

{% include table.html props="lt" source="FieldLTPredicate" %}

For example, to check if the `height` field's value is less than `180`, we can use the following predicate:

```json
{"field": "height", "lt": 180}
```

{:#lte-predicate}

### Field Less Than or Equals Predicate

{% include table.html props="lte" source="FieldLTEPredicate" %}

For example, to check if the `Year` field's value is less than or equals to `"2000"`, we can use the following predicate:

```json
{"timeUnit": "year", "field": "Year", "lte": "2000"}
```

{:#gt-predicate}

### Field Greater Than Predicate

{% include table.html props="gt" source="FieldGTPredicate" %}

To check if the `state` field's value is greater than `"Arizona"` by string comparison, we can use the following predicate: (Note: Standard Javascript string comparison is done, ie., "A" < "B", but "B" < "a")

```json
{"field": "state", "gt": "Arizona"}
```

{:#gte-predicate}

### Field Greater Than or Equals Predicate

{% include table.html props="gte" source="FieldGTEPredicate" %}

For example, to check if the `height` field's value is greater than or equals to `0`, we can use the following predicate:

```json
{"field": "height", "gte": 0}
```

{:#range-predicate}

### Field Range Predicate

{% include table.html props="range" source="FieldRangePredicate" %}

**Examples**

- `{"field": "x", "range": [0, 5]}}` checks if the `x` field's value is in range [0,5] (0 ≤ x ≤ 5)
- `{"timeUnit": "year", "field": "date", "range": [2006, 2008] }}` checks if the `date`'s value is between year 2006 and 2008
- `{"field": "date", "range": [{"year": 2006, "month": "jan", "date": 1}, {"year": 2008, "month": "feb", "date": 20}] }}` checks if the `date`'svalue is between Jan 1, 2006 and Feb 20, 2008.

{:#one-of-predicate}

### Field One-Of Predicate

{% include table.html props="oneOf" source="FieldOneOfPredicate" %}

For example, `{"field": "car_color", "oneOf": ["red", "yellow"]}}` checks if the `car_color` field's value is `"red"` or `"yellow"`

{:#valid-predicate}

### Field Valid Predicate

{% include table.html props="valid" source="FieldValidPredicate" %}

For example, `{"field": "car_color", "valid": true}}` checks if the `car_color` field's value is valid meaning it is both not `null` and not[`NaN`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN).

{:#selection-predicate}

## Selection Predicate

For a selection predicate, a `selection` name must be provided.

{% include table.html props="selection" source="SelectionPredicate" %}

For example, with `{"selection": "brush"}}`, only data values that fall within the selection named `brush` will remain in the dataset as shownbelow.

<div class="vl-example" data-name="selection_filter"></div>

All [selection composition](selection.html#compose) can be used here as well. For instance, `{"selection": {"and": ["alex", "morgan"]}}}` filtersfor data values that are within both the `alex` and `morgan` selections.

When you use a selection filter to dynamically filter the data, scale domains may change, which can lead to jumping titles. To prevent this, you can fix the `minExtent` of the axis whose scale domain changes. For example, to set the minimum extent to `30`, add `{"axis": {"minExtent": 30}}` to the corresponding encoding.

{:#composition}

## Predicate Composition

We can also use the logical composition operators (`and`, `or`, `not`) to combine predicates.

**Examples**

- `{"and": [{"field": "height", "gt": 0}, {"field": "height", "lt": 180}]}` checks if the field `"height"` is between 0 and 180.
- `{"not": {"field": "x", "range": [0, 5]}}}` checks if the `x` field's value is _not_ in range [0,5] (0 ≤ x ≤ 5).
