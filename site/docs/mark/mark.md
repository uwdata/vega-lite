---
layout: docs
menu: docs
title: Mark
permalink: /docs/mark.html
---

Marks are the basic visual building block of a visualization. They provide basic shapes whose properties (such as position, size, and color) can be used to visually encode data, either from a data field, or a constant value.

The supported `mark` types are
[`"area"`](area.html),
[`"bar"`](bar.html),
[`"circle"`](circle.html),
[`"line"`](line.html),
[`"point"`](point.html),
[`"rect"`](rectangle.html),
[`"rule"`](rule.html),
[`"square"`](square.html),
[`"text"`](text.html),
[`"tick"`](tick.html),
and [`"geoshape"`](geoshape.html).
In general, one mark instance is generated per input data element. However, line and area marks represent multiple data elements as a contiguous line or shape.

<!-- why mark-based approach over chart typology + but we support variety of chart types -->

{: .suppress-error}
```json
// Single View Specification
{
  "data": ... ,
  "mark": ... ,       // mark
  "encoding": ... ,
  ...
}
```

The `mark` property of a [single view specification](spec.html#single) can either be (1) a string describing a mark type or (2) a [mark definition object](#mark-def).

For example, a bar chart has `mark` as a simple string `"bar"`.

<span class="vl-example" data-name="bar"></span>

## Documentation Overview
{:.no_toc}

- TOC
{:toc}

## Mark Definition Object
{:#mark-def}


{: .suppress-error}
```json
// Single View Specification
{
  ...
  "mark": {
    "type": ...,       // mark
    ...
  },
  ...
}
```

To customize properties of a mark, users can set `mark` to be a mark definition object instead of a string describing mark type. The rest of this section lists all standard mark properties.  In addition, some marks may be special mark properties (listed in their documentation page).

Note: If [mark property encoding channels](encoding.html#mark-prop) are specified, these mark properties will be overridden.


### General Mark Properties

{% include table.html props="type,style,clip" source="MarkDef" %}

{:#color}
### Color Properties

{% include table.html props="filled,color,fill,stroke,opacity,fillOpacity,strokeOpacity" source="MarkDef" %}

{:#stroke}
### Stroke Style Properties

{% include table.html props="strokeWidth,strokeDash,strokeDashOffset" source="MarkDef" %}

{:#hyperlink}
### Hyperlink Properties

Marks can act as hyperlinks when the `href` property or [channel](encoding.html#href) is defined. A `cursor` property can also be provided to serve as affordance for the links.

{% include table.html props="href,cursor" source="MarkDef" %}

{:#config}
## Mark Config

{: .suppress-error}
```json
// Top-level View Specification
{
  ...
  "config": {
    "mark": ...,
    "area": ...,
    "bar": ...,
    "circle": ...,
    "line": ...,
    "point": ...,
    "rect": ...,
    "rule": ...,
    "geoshape": ...,
    "square": ...,
    "text": ...,
    "tick": ...
  }
}
```

The `mark` property of the [`config`](config.html) object sets the default properties for all marks. In addition, the `config` object also provides mark-specific config using its mark type as the property name (e.g., `config.area`) for defining default properties for each mark.

The global mark config (`config.mark`) supports all standard mark properties (except `type`, `style`, `clip`, and `orient`).  For mark-specific config, please see the documentation for each mark type.

Note: If [mark properties in mark definition](#mark-def) or [mark property encoding channels](encoding.html#mark-prop) are specified, these config values will be overridden.


{:#style-config}
## Mark Style Config

{: .suppress-error}
```json
{
  // Top Level Specification
  "config": {
    "style": {
      ...
    }
    ...
  }
}
```

In addition to the default mark properties above, default values can be further customized using named _styles_ defined under the `style` property in the config object.

{% include table.html props="style" source="Config" %}

For example, to set a default shape and stroke width for `point` marks with a style named `"triangle"`:

{: .suppress-error}
```json
{
  "style": {
    "triangle": {
      "shape": "triangle-up",
      "strokeWidth": 2
    }
  }
}
```

Styles can then be invoked by including a `style` property within a [mark definition object](#mark-def).

In addition to custom `style` names, Vega-Lite includes the following built-in style names:

- `"guide-label"`: style for axis, legend, and header labels
- `"guide-title"`: style for axis, legend, and header titles

### Example: Styling Labels

You can use [`text` marks](text.html) as labels for other marks by setting `style` for the marks and using [style config](mark.html#style-config) to configure offset (`dx` or `dy`), `align`, and `baseline`.

<span class="vl-example" data-name="layer_bar_labels_style"></span>

See also: [a similar example that uses mark definition to configure offset, align, and baseline](text.html#labels).
