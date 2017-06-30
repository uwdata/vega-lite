---
layout: usage
menu: usage
title: Compiling Vega-Lite to Vega
permalink: /usage/compile.html
---

If you would rather compile your Vega-Lite specifications into Vega, you can use Vega-Lite's included [javascript compiler](#javascript) or one of several bundled [command line utilities](#cli).

First install Vega-Lite using npm (`npm install vega-lite`) or by [downloading the latest release](https://github.com/vega/vega-lite/releases/latest).
(For the latter, you will also have to download [Vega](https://github.com/vega/vega/releases/latest) and [D3](http://d3js.org).)


{:#javascript}
## Using Javascript

If you want access to the compiled Vega spec from a Javascript program, you can compile your Vega-Lite spec using the `vl.compile` function.

```js
var vgSpec = vl.compile(vlSpec).spec;
```

You could also pass in a customize logger as an optional parameter, which allow you configure your output messages.

```js
var vgSpec = vl.compile(vlSpec, logger).spec;
```

A custom logger implementation should implement the following interface:

```typescript
interface LoggerInterface {
  level: (_: number) => number | LoggerInterface;
  warn(...args: any[]): LoggerInterface;
  info(...args: any[]): LoggerInterface;
  debug(...args: any[]): LoggerInterface;
}
```

{:#cli}
## From the Command Line
If you want to compile your Vega-Lite specs from the command line, we provide a set of scripts which make it easy to go from Vega-Lite to Vega, SVG, or PNG. These scripts are `vl2vg`, `vl2svg`, and `vl2png` respectively.

Each script simply accepts your Vega-Lite specification as its first argument.

`vl2svg vlSpec`
