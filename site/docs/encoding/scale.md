---
layout: docs
menu: docs
title: Scale
permalink: /docs/scale.html
---

Scales are functions that transform a domain of data values (numbers, dates, strings, etc.) to a range of visual values (pixels, colors, sizes). Internally, Vega-Lite uses [Vega scales](https://vega.github.io/vega/docs/scales/), which are derived from the [d3-scale](https://github.com/d3/d3-scale) library. For more background about scales, please see ["Introducing d3-scale"](https://medium.com/@mbostock/introducing-d3-scale-61980c51545f) by Mike Bostock.

Vega-Lite automatically creates scales for fields that are mapped to [position](encoding.html#position) and [mark property](encoding.html#mark-prop) channels. To customize the scale of a field, users can provide a `scale` object as a part of the [field definition](encoding.html#field) to customize scale properties (e.g., [type](#type), [domain](#domain), and [range](#range)).

```js
// A Single View or a Layer Specification
{
  ...,
  "mark/layer": ...,
  "encoding": {
    "x": {
      "field": ...,
      "type": ...,
      "scale": {                // scale
        "type": ...,
        ...
      },
      ...
    },
    "y": ...,
    ...
  },
  ...
}
```

Besides the `scale` property of each encoding channel, the top-level configuration object ([`config`](config.html)) also provides [scale config](#config) (`config: {scale: {...}}`) for setting default scale properties for all scales.

For more information about guides that visualize the scales, please see the [axes](axis.html) and [legends](legend.html) pages.

<!--prettier-ignore-start-->
## Documentation Overview
{:.no_toc}

- TOC
{:toc}

<!--prettier-ignore-end-->

{:#type}

## Scale Types

The `type` property can be specified to customize the scale type.

{% include table.html props="type" source="Scale" %}

By default, Vega-Lite use the following scale types for the following [data types](type.html) and [encoding channels](encoding.html#channel):

|  | Nominal / Ordinal | Quantitative | Bin-Quantitative<sup>1</sup> | Temporal |
| --: | :-: | :-: | :-: | :-: |
| **X, Y** | [Band](#band) / [Point](#point)<sup>2</sup> | [Linear](#linear) | [Linear](#linear) | [Time](#time) |
| **Size, Opacity** | [Point](#point) | [Linear](#linear) | [Linear](#linear) | [Time](#time) |
| **Color** | [Ordinal](#ordinal) | [Linear](#linear) | [Bin-Ordinal](#bin-ordinal) | [Linear](#linear) |
| **Shape** | [Ordinal](#ordinal) | N/A | N/A | N/A |

<span class="note-line">
<sup>1</sup> Quantitative fields with the [`bin`](bin.html) transform.
</span>
<span class="note-line">
<sup>2</sup> For positional (x and y) nominal and ordinal fields, `"band"` scale is the default scale type for
bar, image, rect, and rule marks while `"point"` is the default scales for all other marks.
</span>

{:#domain}

## Scale Domains

By default, a scale in Vega-Lite draws domain values directly from a channel's encoded field. Users can specify the `domain` property of a scale to customize its domain values. To sort the order of the domain of the encoded, the [`sort`](sort.html) property of a [field definition](encoding.html#field-def) can be specified.

{% include table.html props="domain,domainMax,domainMin,domainMid,domainRaw" source="Scale" %}

A common use case for the `domain` property is to limit, for example, the `x` range of values to include in a plot. However, setting the domain property alone is insufficient to achieve the desired effect.

### Example: Customizing Domain for a Time Scale

For a time scale, we can set scale domain to an array [datetime objects](types.html#datetime), as shown below.

<div class="vl-example" data-name="bar_custom_time_domain"></div>

### Example: Clipping or Removing Unwanted Data Points

For example, consider the line plot specification below in which the `x` domain is restricted to the range `[300, 450]`.

<div class="vl-example" data-name="line_outside_domain"></div>

There are two approaches to keep the mark from being plotted outside the desired `x` range of values.

- The first one is to set `clip: true` in mark definition.

  <div class="vl-example" data-name="line_inside_domain_using_clip"></div>

- The second approach is to use `transform`. Note that these two approaches have slightly different behaviors. Using `transform` removes unwanted data points, yet setting `clip` to `true` clips the mark to be the enclosing group's width and height.

<div class="vl-example" data-name="line_inside_domain_using_transform"></div>

### Example: Using `domainRaw` to bind domain interactively

<div class="vl-example" data-name="interactive_point_domainRaw_binding"></div>

<!--
#### Example: Custom Domain
TODO: Custom Domain for quantitative / discrete scales
-->

{:#range}

## Scale Ranges

The range of the scale represents the set of output visual values. Vega-Lite automatically determines the default range for each [encoding channel](encoding.html#channel) using the following rules:

| Channels | Default Range |
| :-- | :-- |
| `x` | The range is _by default_ `[0, width]`. |
| `y` | The range is _by default_ `[0, height]`. |
| `opacity` | Derived from the [scale config](#config)'s `min/maxOpacity`. |
| `color` | Derived from the following [named ranges](scale.html#range-config) based on the field's [`type`](type.html): <br/> • `"category"` for _nominal_ fields. <br/> • `"ordinal"` for _ordinal_ fields. <br/> • `"heatmap"` for _quantitative_ and _temporal_ fields with `"rect"` marks and `"ramp'` for other marks. <br/><br/> See the [color scheme](#scheme) section for examples. |
| `size` | Derived from the following [named ranges](#config) based on the `mark` type: <br/> • `min/maxBandSize` for bar and tick. <br/> • `min/maxStrokeWidth` for line and rule. <br/> • `min/maxSize` for point, square, and circle <br/> • `min/maxFontSize` for text |
| `shape` | Derived from the [pre-defined named range](#range-config) `"symbol"`. |

To customize range values, users can directly specify `range` or specify the special [`scheme`](#scheme) property for [ordinal](#ordinal) and [continuous](#continuous) color scales.

{% include table.html props="range,rangeMin,rangeMax" source="Scale" %}

### Example: Setting Color Range based on a Field

In this example, we create a scale that maps the field `"l"` to colors specified in the field `"c"`:

<div class="vl-example" data-name="point_scale_range_field"></div>

**Note:** This only works if there is a 1:1 mapping between the color domain field (`l`) and the range field (`c`).

### Example: Setting Range Min/Max

We may use `rangeMin` if we want to override just the minimum value of the range, while keeping the default maximum value of the range.

<div class="vl-example" data-name="arc_radial"></div>

Similarly, we may use `rangeMax` if we want to override just the maximum value of the range, while keeping the default minimum value of the range.

<div class="vl-example" data-name="circle_natural_disasters"></div>

{:#scheme}

### Color Schemes

Color schemes provide a set of named color palettes as a scale range for the `color` channel. Vega-Lite (via Vega) provides a collection of perceptually-motivated color schemes, many of which are drawn from the [d3-scale](https://github.com/d3/d3-scale), [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic), and [ColorBrewer](http://colorbrewer2.org/) projects.

By default, Vega-Lite assigns different [default color schemes](#range-config) based on the types of the encoded fields:

- _Nominal_ fields use the `"categorical"` [pre-defined named range](#range-config) (the [`"tableau10"`](https://vega.github.io/vega/docs/schemes/#tableau10) scheme by default).

<div class="vl-example" data-name="point_color"></div>

- _Ordinal_ fields use the `"ordinal"` [pre-defined named color range](#range-config) (the [`"blues"`](https://vega.github.io/vega/docs/schemes/#blues) color scheme by default).

<div class="vl-example" data-name="point_color_ordinal"></div>

- _Quantitative_ and _temporal_ fields use the [pre-defined named color range](#range-config) `"heatmap"` (the [`"viridis"`](https://vega.github.io/vega/docs/schemes/#viridis) scheme by default) for rect marks and `"ramp"` (the [`"blues"`](https://vega.github.io/vega/docs/schemes/#blues) scheme by default) for other marks.

<div class="vl-example" data-name="rect_heatmap"></div>

<div class="vl-example" data-name="point_color_quantitative"></div>

There are multiple ways to customize the scale range for the color encoding channel:

#### 1. Set a custom `scheme`.

{% include table.html props="scheme" source="Scale" %}

You can customize the scheme by referencing an [existing color scheme](https://vega.github.io/vega/docs/schemes/). For example, the following plot uses the `"category20b"` scheme.

<div class="vl-example" data-name="stacked_area"></div>

{:#scheme-params}

The `scheme` property can also be a **scheme parameter object**, which contain the following properties:

{% include table.html props="name,extent,count" source="SchemeParams" %}

#### 2. Setting the `range` property to an array of valid CSS color strings.

<div class="vl-example" data-name="point_color_custom"></div>

#### 3. Change the default color schemes using the range config.

See the [range config](#range-config) documentation for details.

{:#continuous}

## Common Scale Properties

In addition to `type`, `domain`, and `range`, all scales share the following properties:

{% include table.html props="reverse,round" source="Scale" %}

## Continuous Scales

Continuous scales map a continuous domain (numbers or dates) to a continuous output range (pixel locations, sizes, colors). Supported continuous scale types for _quantitative_ fields are [`"linear"`](#linear), [`"log"`](#log), [`"pow"`](#pow), [`"sqrt"`](#sqrt), and [`"symlog"`](#symlog). Meanwhile, supported continuous scale types for _temporal_ fields are [`"time"`](#time), [`"utc"`](#utc), and [`"symlog"`](#symlog).

By default, Vega-Lite uses `"linear"` scales for quantitative fields and uses `"time"` scales for temporal fields for all [encoding channels](encoding.html#channel).

In addition to [`type`](#type), [`domain`](#domain), and [`range`](#range), continuous scales support the following properties:

{% include table.html props="clamp,interpolate,nice,padding,zero" source="Scale" %}

{:#linear}

### Linear Scales

Linear scales (`"linear"`) are quantitative scales scales that preserve proportional differences. Each range value y can be expressed as a linear function of the domain value _x_: _y = mx + b_.

{:#pow}

### Power Scales

Power scales (`"pow"`) are quantitative scales scales that apply an exponential transform to the input domain value before the output range value is computed. Each range value y can be expressed as a polynomial function of the domain value _x_: _y = mx^k + b_, where _k_ is the `exponent` value. Power scales also support negative domain values, in which case the input value and the resulting output value are multiplied by -1.

{% include table.html props="exponent" source="Scale" %}

{:#sqrt}

### Square Root Scales

Square root (`"sqrt"`) scales are a convenient shorthand for power scales with an `exponent` of `0.5`, indicating a square root transform.

{:#log}

### Logarithmic Scales

Log scales (`"log"`) are quantitative scales in which a logarithmic transform is applied to the input domain value before the output range value is computed. Log scales are particularly useful for plotting data that varies over multiple orders of magnitude. The mapping to the range value y can be expressed as a logarithmic function of the domain value _x_: _y = m log<sub>a</sub>(x) + b_, where _a_ is the logarithmic `base`.

As _log(0) = -∞_, a log scale domain must be strictly-positive or strictly-negative; the domain must not include or cross zero. A log scale with a positive domain has a well-defined behavior for positive values, and a log scale with a negative domain has a well-defined behavior for negative values. (For a negative domain, input and output values are implicitly multiplied by -1.) The behavior of the scale is undefined if you run a negative value through a log scale with a positive domain or vice versa.

{% include table.html props="base" source="Scale" %}

**Example:** The following plot has a logarithmic y-scale.

<div class="vl-example" data-name="point_log"></div>

<!-- {% include table.html props="base" source="Scale" %} -->

<!--
- `quantize` scale maps continuous value to a discrete range by dividing the domain into uniform segments based on the number of values in (i.e., the cardinality of) the output range. Each range value _y_ can be expressed as a quantized linear function of the domain value _x_: _y = m round(x) + b_.
- `quantile` scale maps a sampled input domain to a discrete range by sorting the domain and compute the quantiles. The cardinality of the output range determines the number of quantiles that will be computed. -->

<!-- TODO: need to test if we support threshold scale correctly before writing about it-->

{:#symlog}

### Symlog Scales

Symmetric log scales (symlog) are quantitative scales scales that provide scaling similar to log scales, but supports non-positive numbers. Symlog scales are particularly useful for plotting data that varies over multiple orders of magnitude but includes negative- or zero-valued data. For more, see ["A bi-symmetric log transformation for wide-range data"](https://www.researchgate.net/profile/John_Webber4/publication/233967063_A_bi-symmetric_log_transformation_for_wide-range_data/links/0fcfd50d791c85082e000000.pdf) by Webber for more.

{% include table.html props="constant" source="Scale" %}

{:#time}

### Time and UTC Scales

Time and UTC scales (`"time"` and `"utc"`) are [continuous scales](#quantitative) with a temporal domain: values in the input domain are assumed to be [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) objects or timestamps. Time scales use the current local timezone setting. UTC scales instead use [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time).

{:#piecewise}

### Piecewise and Diverging Scales

We can use any types of continuous scales ([`"linear"`](scale.html#linear), [`"pow"`](scale.html#pow), [`"sqrt"`](scale.html#sqrt), [`"log"`](scale.html#log), [`"symlog"`](scale.html#symlog), [`"time"`](scale.html#time), [`"utc"`](scale.html#utc) to create a diverging color graph by specifying a custom `domain` with multiple elements.

If `range` is specified, the number of elements in `range` should match with the number of elements in `domain`. [Diverging color `scheme`s](https://vega.github.io/vega/docs/schemes/#diverging) are also useful as a range for a piecewise scale.

**Example**

<div class="vl-example" data-name="point_diverging_color"></div>

{:#discrete}

## Discrete Scales

Discrete scales map values from a discrete domain to a discrete or continuous range.

{:#ordinal}

### Ordinal Scales

Ordinal scales (`"ordinal"`) have a discrete domain and range. These scales function as a “lookup table” from a domain value to a range value.

By default, Vega-Lite automatically creates ordinal scales for `color` and `shape` channels. For example, the following plot implicitly has two ordinal scales, which map the values of the field `"Origin"` to a set of `color`s and a set of `shape`s.

<div class="vl-example" data-name="point_color_with_shape"></div>

The [`range`](#range) of an ordinal scale can be an array of desired output values, which are directly mapped to elements in the [`domain`](#domain). Both `domain` and `range` array can be re-ordered to specify the order and mapping between the domain and the output range. For ordinal color scales, a custom [`scheme`](#scheme) can be set as well.

<a id="point"></a><!-- point and band are in the same section -->

{:#band}

### Band and Point Scales

Band and point scales accept a discrete domain similar to [ordinal scales](#ordinal), but map this domain to a continuous, numeric output range such as pixels.

**Band scales** (`"band"`) compute the discrete output values by dividing the continuous range into uniform _bands_. Band scales are typically used for bar charts with an ordinal or categorical dimension.

In addition to a standard numerical _range_ value (such as `[0, 500]`), band scales can be given a fixed _step_ size for each band. The actual range is then determined by both the step size and the cardinality (element count) of the input domain.

This image from the [d3-scale documentation](https://github.com/d3/d3-scale#band-scales) illustrates how a band scale works:

<img src="https://raw.githubusercontent.com/d3/d3-scale/master/img/band.png"/>

**Point scales** (`"point"`) are a variant of [band scales](#band) where the internal band width is fixed to zero. Point scales are typically used for scatterplots with an ordinal or categorical dimension. Similar to band scales, point scale _range_ values may be specified using either a numerical extent (`[0, 500]`) or a step size (`{"step": 20}`).

This image from the [d3-scale documentation](https://github.com/d3/d3-scale#band-scales) illustrates how a point scale works:

<img src="https://raw.githubusercontent.com/d3/d3-scale/master/img/point.png"/>

By default, Vega-Lite uses band scales for nominal and ordinal fields on [position channels](encoding.html#position) (`x` and `y`) of [bar](bar.html) or [rect](rect.html) marks. For `x` and `y` of other marks and `size` and `opacity`, Vega-Lite uses point scales by default.

For example, the following bar chart has uses a band scale for its x-position.

<div class="vl-example" data-name="bar"></div>

{:#range-step}

To customize the step size of band scales for x/y-fields, we can set the step property of the view's `width`/`height`.

For example, we can either make a bar chart have a fixed width:

<span class="vl-example" data-name="bar_size_fit"></span>

or set the width per discrete step:

<span class="vl-example" data-name="bar_size_step_small"></span>

To customize the range of band and point scales, users can provide the following properties:

{% include table.html props="align,padding,paddingInner,paddingOuter" source="Scale" %}

{:#discretizing}

## Discretizing Scales

Discretizing scales break up a continuous domain into discrete segments, and then map values in each segment to a range value.

{:#bin-linear}

### Bin-Linear Scales

Binned linear scales (`"bin-linear"`) are a special type of linear scale for use with [binned](bin.html) fields to correctly create legend labels. Vega-Lite _always_ uses binned linear scales with binned quantitative fields on size and opacity channels.

For example, the following plot has a binned field on the `size` channel.

<span class="vl-example" data-name="point_binned_size"></span>

{:#bin-ordinal}

### Bin-Ordinal Scales

Binned ordinal scales (`"bin-ordinal"`) are a special type of ordinal scale for use with [binned](bin.html) fields to correctly create legend labels. Vega-Lite _always_ uses binned ordinal scales with binned quantitative fields on the color channel.

For example, the following plot has a binned field on the `color` channel.

<span class="vl-example" data-name="point_binned_color"></span>

Similar to [ordinal](#ordinal) color scales, a custom [`range`](#range) or [`scheme`](#scheme) can be specified for binned ordinal scales.

In addition, `bins` property can be used to specify bin boundaries over the scale domain.

{% include table.html props="bins" source="Scale" %}

{:#bins}

#### Bins Parameter

The bin specification object for the scale `bins` properties support the following properties:

{% include table.html props="bins" source="ScaleBinParams" %}

{:#quantile}

### Quantile Scales

Quantile scales (`"quantile"`) map a sample of input domain values to a discrete range based on computed [quantile](https://en.wikipedia.org/wiki/Quantile) boundaries. The domain is considered continuous and thus the scale will accept any reasonable input value; however, the domain is specified as a discrete set of sample values. The number of values in (i.e., the cardinality of) the output range determines the number of quantiles that will be computed from the domain. To compute the quantiles, the domain is sorted, and treated as a population of discrete values. The resulting quantile boundaries segment the domain into groups with roughly equals numbers of sample points per group. If the `range` is not specified, the domain will be segmented into 4 quantiles (quartiles) by default.

Quantile scales are particularly useful for creating color or size encodings with a fixed number of output values. Using a discrete set of encoding levels (typically between 5-9 colors or sizes) sometimes supports more accurate perceptual comparison than a continuous range. For related functionality see [quantize scales](scale.html#quantize), which partition the domain into uniform domain extents, rather than groups with equal element counts. Quantile scales have the benefit of evenly distributing data points to encoded values. In contrast, quantize scales uniformly segment the input domain and provide no guarantee on how data points will be distributed among the output visual values.

<span class="vl-example" data-name="circle_scale_quantile"></span>

{:#quantize}

### Quantize Scales

Quantize scales (`"quantize"`) are similar to [linear scales](scale.html#linear), except they use a discrete rather than continuous range. The `quantize` scale maps continuous value to a discrete range by dividing the domain into uniform segments based on the number of values in (i.e., the cardinality of) the output range. Each range value _y_ can be expressed as a quantized linear function of the domain value _x_: _y = m round(x) + b_. If the `range` property is not specified, the domain will be divided into 4 uniform segments by default.

Quantize scales are particularly useful for creating color or size encodings with a fixed number of output values. Using a discrete set of encoding levels (typically between 5-9 colors or sizes) sometimes supports more accurate perceptual comparison than a continuous range. For related functionality see [quantile scales](scale.html#quantile), which partition the domain into groups with equal element counts, rather than uniform domain extents.

{% include table.html props="nice,zero" source="Scale" %}

<span class="vl-example" data-name="circle_scale_quantize"></span>

{:#threshold}

### Threshold Scales

Threshold scales (`"threshold"`) are similar to [quantize scales](scale.html#quantize), except they allow mapping of arbitrary subsets of the domain (not uniform segments) to discrete values in the range. The input domain is still continuous, and divided into slices based on a set of threshold values provided to the _required_ `domain` property. The `range` property must have N+1 elements, where N is the number of threshold boundaries provided in the domain.

<span class="vl-example" data-name="circle_scale_threshold"></span>

{:#disable}

## Disabling Scale

To directly encode the data value, the `scale` property can be set to `null`.

For example, the follow bar chart directly encodes color names in the data.

<span class="vl-example" data-name="bar_color_disabled_scale"></span>

{:#config}

## Configuration

```js
// Top-level View Specification
{
  ...
  "config": {
    "scale": {
      ...                       // Scale Config
    },
    "range": {
      ...                       // Scale Range Config
    },
    ...
  }
  ...
}
```

### Scale Config

To provide themes for all scales, the scale config (`config: {scale: {...}}`) can contain the following properties:

#### Padding

{% include table.html props="bandPaddingInner,barBandPaddingInner,rectBandPaddingInner,bandWithNestedOffsetPaddingInner,offsetBandPaddingInner,bandPaddingOuter,bandWithNestedOffsetPaddingOuter,offsetBandPaddingOuter,continuousPadding,pointPadding" source="ScaleConfig" %}

#### Range

{% include table.html props="maxBandSize,minBandSize,maxFontSize,minFontSize,maxOpacity,minOpacity,maxSize,minSize,maxStrokeWidth,minStrokeWidth" source="ScaleConfig" %}

#### Scale Output for Invalid Values

{% include table.html props="invalid" source="ScaleConfig" %}

#### Animation

<!-- TODO(jzong): uncomment animationDuration when linear scales for animation are implemented -->
<!-- {% include table.html props="animationDuration,framesPerSecond" source="ScaleConfig" %} -->

{% include table.html props="framesPerSecond" source="ScaleConfig" %}

#### Other

{% include table.html props="clamp,round,xReverse,useUnaggregatedDomain,zero" source="ScaleConfig" %}

{:#range-config}

### Range Config

The scale range configuration (`config: {range: {...}}`) defines key-value mapping for named scale ranges: the keys represent the range names, while the values define valid [`range`](#range) or, for named color ranges, [Vega scheme definitions](https://vega.github.io/vega/docs/schemes/#scheme-properties).

By default, Vega-Lite (via Vega) includes the following pre-defined named ranges:

{% include table.html props="category,diverging,heatmap,ordinal,ramp,symbol" source="RangeConfig" %}

See [this file](https://github.com/vega/vega-parser/blob/master/src/config.js#L188) for the default values of named ranges.
