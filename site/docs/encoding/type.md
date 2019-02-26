---
layout: docs
title: Type
permalink: /docs/type.html
---

If a field is specified, the channel definition **must** describe the encoded data's [type of measurement (level of measurement)](https://en.wikipedia.org/wiki/Level_of_measurement). The supported data types are: [`"quantitative"`](#quantitative), [`"temporal"`](#temporal), [`"ordinal"`](#ordinal), [`"nominal"`](#nominal), and [`"geojson"`](#geojson).

{% include table.html props="type" source="FieldDef" %}

**Notes**:

1. Data `type` describes the semantics of the data rather than the primitive data types (`number`, `string`, etc.). The same primitive data type can have different types of measurement. For example, numeric data can represent quantitative, ordinal, or nominal data.

2. When using with [`aggregate`](aggregate.html), the `type` property refers to the post-aggregation data type. For example, we can calculate count `distinct` of a categorical field `"cat"` using `{"aggregate": "distinct", "field": "cat", "type": "quantitative"}`. The `"type"` of the aggregate output is `"quantitative"`.

3. When using with [`bin`](bin.html), the `type` property can be either `"quantitative"` (for using a linear bin scale) or [`"ordinal"` (for using an ordinal bin scale)](#cast-bin).

4. When using with [`timeUnit`](timeunit.html), the `type` property can be either `"temporal"` (for using a temporal scale) or [`"ordinal"` (for using an ordinal scale)](#cast-timeunit).

{:#quantitative}

## Quantitative

Quantitative data expresses some kind of quantity. Typically this is numerical data. For example `7.3`, `42.0`, `12.1`.

{:#temporal}

## Temporal

Temporal data supports date-times and times. For example `2015-03-07 12:32:17`, `17:01`, `2015-03-16`.

Note that when a `"temporal"` type is used for a field, Vega-Lite will treat it as a continuous field and thus will use a [`time` scale](scale.html#time) to map its data to visual values. For example, the following bar chart shows the mean precipitation for different months.

<span class="vl-example" data-name="bar_month_temporal"></span>

{:#ordinal}

## Ordinal

Ordinal data represents ranked order (1st, 2nd, ...) by which the data can be sorted. However, as opposed to quantitative data, there is no notion of _relative degree of difference_ between them. For illustration, a "size" variable might have the following values `small`, `medium`, `large`, `extra-large`. We know that medium is larger than small and same for extra-large larger than large. However, we cannot compare the magnitude of relative difference, for example, between (1) `small` and `medium` and (2) `medium` and `large`. Similarly, we cannot say that `large` is two times as large as `small`.

{:#cast-timeunit}

### Casting a Temporal Field as an Ordinal Field

To treat a date-time field with `timeUnit` as a discrete field, you can cast it be an `"ordinal"` field. This type casting can be useful for time units with low cardinality such as `"month"`.

<span class="vl-example" data-name="bar_month"></span>

{:#cast-bin}

### Casting a Binned Field as an Ordinal Field

Setting a binned field's `type` to `"ordinal"` produces a histogram with an ordinal scale.

<div class="vl-example" data-name="histogram_ordinal"></div>

{:#nominal}

## Nominal

Nominal data, also known as categorical data, differentiates between values based only on their names or categories. For example, gender, nationality, music genre, and name are nominal data. Numbers maybe used to represent the variables but the number do not determine magnitude or ordering. For example, if a nominal variable contains three values 1, 2, and 3. We cannot claim that 1 is less than 2 nor 3.

{:#geojson}

## GeoJSON

GeoJSON data represents geographic shapes specified as [GeoJSON](http://geojson.org/).
