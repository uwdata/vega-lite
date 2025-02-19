---
layout: docs
menu: docs
title: Encoding
permalink: /docs/encoding.html
---

An integral part of the data visualization process is encoding data with visual properties of graphical marks. The `encoding` property of a single view specification represents the mapping between [encoding channels](#channels) (such as `x`, `y`, or `color`) and [data fields](#field-def), constant [visual values](#value-def), or constant [data values (datum)](#datum-def).

```js
// Specification of a Single View
{
  "data": ... ,
  "mark": ... ,
  "encoding": {     // Encoding
    // Position Channels
    "x": ...,
    "y": ...,
    "x2": ...,
    "y2": ...,
    "xError": ...,
    "yError": ...,
    "xError2": ...,
    "yError2": ...,

    // Polar Position Channels
    "theta": ...,
    "radius": ...,
    "theta2": ...,
    "radius2": ...,

    // Geographic Position Channels
    "longitude": ...,
    "latitude": ...,
    "longitude2": ...,
    "latitude2": ...,

    // Mark Properties Channels
    "color": ...,
    "opacity": ...,
    "fillOpacity": ...,
    "strokeOpacity": ...,
    "strokeWidth": ...,
    "strokeDash": ...,
    "size": ...,
    "angle": ...,
    "shape": ...,

    // Text and Tooltip Channels
    "text": ...,
    "tooltip": ...,

    // Hyperlink Channel
    "href": ...,

    // Description Channel
    "description": ...,

    // Level of Detail Channel
    "detail": ...,

    // Key Channel
    "key": ...,

    // Order Channel
    "order": ...,

    // Facet Channels
    "facet": ...,
    "row": ...,
    "column": ...
  },
  ...
}
```

{:#channels}

## Encoding Channels

The keys in the `encoding` object are encoding channels. Vega-Lite supports the following groups of encoding channels

- [Position Channels](#position): `x`, `y`, `x2`, `y2`, `xError`, `yError`, `xError2`, `yError2`
- [Position Offset Channels](#position-offset): `xOffset`, `yOffset`
- [Polar Position Channels](#polar): `theta`, `theta2`, `radius`, `radius2`
- [Geographic Position Channels](#geo): `longitude`, `latitude`, `longitude2`, `latitude2`
- [Time Channel](#time): `time`
- [Mark Property Channels](#mark-prop): `angle`, `color` (and `fill` / `stroke`), `opacity`, `fillOpacity`, `strokeOpacity`, `shape`, `size`, `strokeDash`, `strokeWidth`
- [Text and Tooltip Channels](#text): `text`, `tooltip`
- [Hyperlink Channel](#href): `href`
- [Description Channel](#description): `description`
- [Level of Detail Channel](#detail): `detail`
- [Key Channel](#key): `key`
- [Order Channel](#order): `order`
- [Facet Channels](#facet): `facet`, `row`, `column`

## Channel Definition

Each channel definition object must be one of the following:

- [Field definition](#field-def), which describes the data field encoded by the channel.
- [Value definition](#value-def), which describes an encoded constant visual value.
- [Datum definition](#datum-def), which describes a constant data value encoded via a scale.

{:#field-def}

### Field Definition

```js
// Specification of a Single View
{
  ...,
  "encoding": {     // Encoding
    ...: {
      "field": ...,
      "type": ...,
      ...
    },
    ...
  },
  ...
}
```

To encode a particular field in the data set with an encoding channel, the channel's field definition must describe the [`field`](field.html) name and its data [`type`](type.html). To facilitate data exploration, Vega-Lite also provides inline field transforms ([`aggregate`](aggregate.html), [`bin`](bin.html), [`sort`](sort.html), [`stack`](stack.html), and [`timeUnit`](timeunit.html)) as a part of a field definition in addition to the top-level [`transform`](transform.html).

All field definitions support the following properties:

{% include table.html props="field,type,bin,timeUnit,aggregate,band,title" source="TypedFieldDef" %}

In addition, field definitions for different encoding channels may support the following properties:

- [`scale`](scale.html) - The function that transforms values in the data domain (numbers, dates, strings, etc) to visual values (pixels, colors, sizes) for [position](#position) and [mark property](#mark-prop) channels.

- [`axis`](axis.html) - The guiding visualization to aid interpretation of scales for [position channels](#position).

- [`legend`](legend.html) - The guiding visualization to aid interpretation of [mark property channels](#mark-prop).

- [`format`](format.html) - The formatting pattern for text value for [text channels](#text).

- [`stack`](stack.html) - Type of stacking offset if a [position field](#position) with continuous domain should be stacked.

- [`sort`](sort.html) - Sort order for a field for [position](#position) and [mark property](#mark-prop) channels.

- [`condition`](condition.html) - The conditional encoding rule for [mark property](#mark-prop) and [text](#text) channels.

To see a list of additional properties for each type of encoding channels, please see the specific sections for [position](#position), [mark property](#mark-prop), [text and tooltip](#text), [detail](#detail), [order](#order), and [facet](#facet) channels.

{:#value-def}

### Value Definition

```js
// Specification of a Single View
{
  ...,
  "encoding": {     // Encoding
    ...: {
      "value": ...
    },
    ...
  },
  ...
}
```

To map a constant visual value to an encoding channel, the channel's value definition must describe the `value` property. (See the [`value`](value.html) page for more examples.)

<!--{% include table.html props="value" source="ValueDef" %}-->

{:#datum-def}

### Datum Definition

```js
// Specification of a Single View
{
  ...,
  "encoding": {     // Encoding
    ...: {
      "datum": ...
    },
    ...
  },
  ...
}
```

To map a constant data value (`datum`) via a scale to an encoding channel, the channel's value definition must describe the `datum` property. (See the [`datum`](datum.html) page for more examples.)

{% include table.html props="datum" source="DatumDef" %}

Similar to a field definition, datum definition of different encoding channels may support `band`, `scale`, `axis`, `legend`, `format`, or `condition` properties. However, data transforms (`aggregate`, `bin`, `timeUnit`, `sort` cannot be applied to a datum definition).

{:#position}

## Position Channels

`x` and `y` position channels determine the position of the marks, or width/height of horizontal/vertical `"area"` and `"bar"`. In addition, `x2` and `y2` can specify the span of ranged [`area`](area.html#ranged), [`bar`](bar.html#ranged), [`rect`](rect.html#ranged), and [`rule`](rule.html#ranged).

By default, Vega-Lite automatically generates a [scale](scale.html) and an [axis](axis.html) for each field mapped to a position channel. If unspecified, properties of scales and axes are determined based on a set of rules by the compiler. `scale` and `axis` properties of the field definition can be used to customize their properties.

{% include table.html props="x,y,x2,y2" source="Encoding" %}

{:#position-field-def}

{:#position-datum-def}

### Position Field Definition and Datum Definition

In addition to the general [field definition properties](#field-def), field definitions for `x` and `y` channels may include the properties listed below. Similarly, [datum definitions](#datum-def) for `x` and `y` channels also support these properties.

{% include table.html props="scale,axis,sort,impute,stack" source="PositionFieldDef" %}

**Note:** `x2` and `y2` do not have their own definitions for `scale`, `axis`, `sort`, and `stack` since they share the same scales and axes with `x` and `y` respectively.

{:#positon-offset}

## Position Offset Channels

`xOffset` and `yOffset` position channels determine additional offset to the `x` or `y` position.

### Position Offset Field Definition and Datum Definition

In addition to the general [field definition properties](#field-def), field definitions for `xOffset` and `yOffset` channels may include the properties listed below. Similarly, [datum definitions](#datum-def) for `x` and `y` channels also support these properties.

{% include table.html props="scale,sort" source="ScaleFieldDef" %}

### Example: Grouped Bar Chart

<span class="vl-example" data-name="bar_grouped"></span>

**Note:** Read [here](size.html#offset-step) for more details about how to set step size for offset scale.

### Example: Jittering

<span class="vl-example" data-name="point_offset_random"></span>

{:#polar}

## Polar Position Channels

`theta` and `radius` position channels determine the position or interval on polar coordinates for `arc` and `text` marks.

{% include table.html props="theta,radius,theta2,radius2" source="Encoding" %}

{:#polar-field-def}

{:#polar-datum-def}

### Polar Field Definition and Datum Definition

Polar field and datum definitions may include `scale`, `stack`, and `sort` properties, similar to [position field and datum definitions](#position-field-def).

{:#geo}

## Geographic Position Channels

`longitude` and `latitude` channels can be used to encode geographic coordinate data via a [projection](projection.html). In addition, `longitude2` and `latitude2` can specify the span of geographically projected ranged [`area`](area.html#ranged), [`bar`](bar.html#ranged), [`rect`](rect.html#ranged), and [`rule`](rule.html#ranged).

{% include table.html props="longitude,latitude,longitude2,latitude2" source="Encoding" %}

See [an example that uses `longitude` and `latitude` channels in a map]({{ site.baseurl }}/examples/geo_circle.html) or [another example that draws line segments (`rule`s) between points in a map]({{ site.baseurl }}/examples/geo_rule.html).

{:#time}

## Time Channel

The `time` channel maps data values to animation keyframes over time. When a time encoding is specified, together with a [selection parameter](selection.html) that has a `timer` [event stream](selection.html#on), marks are animated to show different data values as time progresses.

See [an example scatterplot animation]({{ site.baseurl }}/examples/animated_gapminder.html) that uses the `time` channel and a `timer` selection parameter.

{% include table.html props="time" source="Encoding" %}

Note: `time` encoding animations currently have a few restrictions. See the [example gallery]({{ site.baseurl }}/examples/#animated) for examples of animated visualizations.

- must also explicility specify a selection parameter
  - parameter must have a `timer` event
  - parameter must select the same field as the `time` field definition
- must explicitliy define a filter using that parameter
- currently, the `time` channel only supports `band` scales (these are the default for discrete frame animation)
- currently, only unit specifications are supported (no multi-view animations)

<!--
TODO(jzong): uncomment once we've added rescale, scale types

{:#time-field-def}

### Time Field Definition

In addition to the general [field definition properties](#field-def), the `time` field definition may include the properties listed below.

{% include table.html props="scale,rescale,sort" source="TimeFieldDef" %} -->

{:#mark-prop}

## Mark Property Channels

Mark properties channels map data fields to visual properties of the marks. By default, Vega-Lite automatically generates a scale and a legend for each field mapped to a mark property channel. If unspecified, properties of scales and legends are determined based on a set of rules by the compiler. `scale` and `legend` properties of the field definition can be used to customize their properties. In addition, definitions of mark property channels can include the `condition` property to specify conditional logic.

Here are the list of mark property channels:

{% include table.html props="angle,color,fill,stroke,opacity,fillOpacity,strokeOpacity,shape,size,strokeDash,strokeWidth" source="Encoding" %}

<a id="mark-prop-datum-def"></a>

{:#mark-prop-field-def}

### Mark Property Field Definition and Datum Definition

[Field definitions](#field-def) for mark property channels may also include the properties list below (in addition to [`field`](field.html), [`type`](type.html), [`bin`](bin.html), [`timeUnit`](timeunit.html) and [`aggregate`](aggregate.html)).

Similarly, [datum definitions](#datum-def) for mark property channels also support these properties.

{% include table.html props="scale,legend,condition" source="FieldOrDatumDefWithCondition<MarkPropFieldDef,number>" %}

{:#mark-prop-value-def}

### Mark Property Value Definition

In addition to the constant `value`, [value definitions](#value-def) of mark properties channels can include the `condition` property to specify conditional logic.

{% include table.html props="condition" source="ValueDefWithCondition<MarkPropFieldOrDatumDef,number>" %}

See [the `condition`](condition.html) page for examples how to specify condition logic.

{:#text}

## Text and Tooltip Channels

Text and tooltip channels directly encode text values of the data fields. By default, Vega-Lite automatically determines appropriate format for quantitative and temporal values. Users can set `format` property to customize text and time format. Similar to mark property channels, definitions of text and tooltip channels can include the `condition` property to specify conditional logic.

{% include table.html props="text,tooltip" source="Encoding" %}

{:#text-field-def}

### Text and Tooltip Field Definition

In addition to the general [field definition properties](#field-def), field definitions for `text` and `tooltip` channels may also include these properties:

{% include table.html props="format,formatType,condition" source="FieldOrDatumDefWithCondition<StringFieldDef,Text>" %}

{:#text-value-def}

### Text and Tooltip Value Definition

In addition to the constant `value`, [value definitions](#value-def) of `text` and `tooltip` channels can include the `condition` property to specify conditional logic.

{% include table.html props="condition" source="ValueDefWithCondition<StringFieldDef,Text>" %}

### Multiple Field Definitions for Tooltips

Similar to [`detail`](#detail), you can use an array of field definitions. Vega-Lite will display a tooltip with multiple fields. [Vega tooltip](https://github.com/vega/vega-tooltip/) will display a table that shows the name of the field and its value. See the [tooltip](tooltip.html) page for details.

{:#href}

## Hyperlink Channel

By setting the `href` channel, a mark becomes a hyperlink. The specified URL is loaded upon a mouse click. When the `href` channel is specified, the [`cursor` mark property](mark.html#hyperlink) is set to `"pointer"` by default to serve as affordance for hyperlinks.

{% include table.html props="href" source="Encoding" %}

{:#href-field-def}

### Hyperlink Field Definition

In addition to the general [field definition properties](#field-def), field definitions for the `href` channel can include the `condition` property to specify conditional logic.

{% include table.html props="condition" source="FieldDefWithCondition<StringFieldDef,string>" %}

The example below shows how the href channel can be used to provide links to external resources with more details.

<span class="vl-example" data-name="point_href"></span>

{:#href-value-def}

### Hyperlink Value Definition

In addition to the constant `value`, [value definitions](#value-def) of the `href` channel can include the `condition` property to specify conditional logic.

{% include table.html props="condition" source="ValueDefWithCondition<StringFieldDef,Text>" %}

{:#description}

## Description Channel

By setting the `description` channel, you can add a text description to the mark for ARIA accessibility (SVG output only). The `"aria-label"` attribute in the generated SVG will be set to this description.

By default, Vega-Lite generates a description based on the encoding similar to [default tooltips]({{ site.baseurl }}/docs/tooltip.html#encoding). To disable automatic descriptions, set [`config.aria`](config.html#aria-config) to false. No description will be generated if [`mark.aria`]({{ site.baseurl }}/docs/mark.html#general) is set to false.

{% include table.html props="description" source="Encoding" %}

{:#description-field-def}

### Description Field Definition

In addition to the general [field definition properties](#field-def), field definitions for the `description` channel can include these properties:

{% include table.html props="format,formatType,condition" source="FieldOrDatumDefWithCondition<StringFieldDef,Text>" %}

{:#description-value-def}

### Description Value Definition

In addition to the constant `value`, [value definitions](#value-def) of the `description` channel can include the `condition` property to specify conditional logic.

{% include table.html props="condition" source="ValueDefWithCondition<StringFieldDef,Text>" %}

{:#detail}

## Level of Detail Channel

Grouping data is another important operation in data visualization. For line and area marks, mapping a unaggregated data field (field without `aggregate` function) to any non-[position](#position) channel will group the lines and stacked areas by the field. For [aggregated plots](aggregate.html), all unaggregated fields encoded are used as grouping fields in the aggregation (similar to fields in `GROUP BY` in SQL).

`detail` channel specify an additional grouping field (or fields) for grouping data without mapping the field(s) to any visual properties.

{% include table.html props="detail" source="Encoding" %}

#### Examples

Here is a scatterplot showing average horsepower and displacement for cars from different origins. We map `Origin` to `detail` channel to use the field as a group-by field without mapping it to visual properties of the marks.

<div class="vl-example" data-name="point_aggregate_detail"></div>

Here is a line chart showing stock prices of 5 tech companies over time. We map `symbol` variable (stock market ticker symbol) to `detail` to use them to group lines.

<div class="vl-example" data-name="line_detail"></div>

Here is a ranged dot plot showing life expectancy change in the five largest countries between 1955 and 2000. We use `detail` here to group the lines such that they range only from one year to another within a country (as opposed to jumping between countries as well).

<div class="vl-example" data-name="layer_ranged_dot"></div>

<!-- TODO Need to decide if we want to keep the two examples above since they look bad with labels / tooltips -->

{:#key}

## Key Channel

The key channel can enable object constancy for transitions over dynamic data. When a visualization’s data is updated (via [Vega's View API](https://vega.github.io/vega/docs/api/view/#data)), the key value will be used to match data elements to existing mark instances.

{% include table.html props="key" source="Encoding" %}

{:#order}

## Order Channel

`order` channel can define a data field (or a ordered list of data fields) that are used to sorts stacking order for stacked charts (see [an example in the `stack` page](stack.html#order)), the order of data points in line marks for connected scatterplots (see [an example in the `line` page](line.html#connected-scatter-plot)), and which data points are plotted on top in a chart (the "zorder", see [an example in the gallery]({{ site.baseurl }}/examples/selection_type_point_zorder.html)).

{% include table.html props="order" source="Encoding" %}

### Order Field Definition

In addition to the general [field definition properties](#field-def), field definitions for the `order` channel can include `sort`.

{% include table.html props="sort" source="OrderFieldDef" %}

### Order Value Definition

In addition to the constant `value`, [value definitions](#value-def) of the `order` channel can include the `condition` property to specify conditional logic.

{% include table.html props="condition" source="OrderValueDef" %}

{:#facet}

## Facet Channels

`facet`, `row` and `column` are special encoding channels that facets single plots into [trellis plots (or small multiples)](https://en.wikipedia.org/wiki/Small_multiple).

{% include table.html props="facet,row,column" source="FacetedEncoding" %}

For more information, read the [facet documentation](facet.html).

```

```
