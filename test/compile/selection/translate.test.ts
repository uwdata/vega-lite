/* tslint:disable quotemark */

import {assert} from 'chai';
import {selector as parseSelector} from 'vega-event-selector';
import * as selection from '../../../src/compile/selection/selection';
import translate from '../../../src/compile/selection/transforms/translate';
import {parseUnitModel} from '../../util';

describe('Translate Selection Transform', function() {
  const model = parseUnitModel({
    "mark": "circle",
    "encoding": {
      "x": {"field": "Horsepower","type": "quantitative"},
      "y": {"field": "Miles_per_Gallon","type": "quantitative"},
      "color": {"field": "Origin", "type": "N"}
    }
  });

  model.parseScale();
  const selCmpts = selection.parseUnitSelection(model, {
    "one": {
      "type": "single",
      "translate": true
    },
    "two": {
      "type": "multi",
      "translate": true
    },
    "three": {
      "type": "interval",
      "translate": false
    },
    "four": {
      "type": "interval"
    },
    "five": {
      "type": "interval",
      "translate": "[mousedown, mouseup] > mousemove, [keydown, keyup] > touchmove"
    },
    "six": {
      "type": "interval",
      "bind": "scales"
    }
  });

  it('identifies transform invocation', function() {
    assert.isFalse(translate.has(selCmpts['one']));
    assert.isFalse(translate.has(selCmpts['two']));
    assert.isFalse(translate.has(selCmpts['three']));
    assert.isTrue(translate.has(selCmpts['four']));
    assert.isTrue(translate.has(selCmpts['five']));
    assert.isTrue(translate.has(selCmpts['six']));
  });

  it('builds signals for default invocation', function() {
    model.component.selection = {four: selCmpts['four']};
    const signals = selection.assembleUnitSignals(model, []);
    assert.includeDeepMembers(signals, [
      {
        "name": "four_translate_anchor",
        "value": {},
        "on": [
          {
            "events": parseSelector('@four_brush:mousedown', 'scope'),
            "update": "{x: x(unit), y: y(unit), width: four_size.width, height: four_size.height, extent_x: slice(four_x), extent_y: slice(four_y), }"
          }
        ]
      },
      {
        "name": "four_translate_delta",
        "value": {},
        "on": [
          {
            "events": parseSelector('[@four_brush:mousedown, window:mouseup] > window:mousemove!', 'scope'),
            "update": "{x: x(unit) - four_translate_anchor.x, y: y(unit) - four_translate_anchor.y}"
          }
        ]
      }
    ]);

    assert.includeDeepMembers(signals.filter((s) => s.name === 'four_x')[0].on, [
      {
        "events": {"signal": "four_translate_delta"},
        "update": "clampRange([four_translate_anchor.extent_x[0] + abs(span(four_translate_anchor.extent_x)) * four_translate_delta.x / four_translate_anchor.width, four_translate_anchor.extent_x[1] + abs(span(four_translate_anchor.extent_x)) * four_translate_delta.x / four_translate_anchor.width], invert(\"x\", 0), invert(\"x\", unit.width))"
      }
    ]);

    assert.includeDeepMembers(signals.filter((s) => s.name === 'four_y')[0].on, [
      {
        "events": {"signal": "four_translate_delta"},
        "update": "clampRange([four_translate_anchor.extent_y[0] - abs(span(four_translate_anchor.extent_y)) * four_translate_delta.y / four_translate_anchor.height, four_translate_anchor.extent_y[1] - abs(span(four_translate_anchor.extent_y)) * four_translate_delta.y / four_translate_anchor.height], invert(\"y\", unit.height), invert(\"y\", 0))"
      }
    ]);
  });

  it('builds signals for custom events', function() {
    model.component.selection = {five: selCmpts['five']};
    const signals = selection.assembleUnitSignals(model, []);

    assert.includeDeepMembers(signals, [
      {
        "name": "five_translate_anchor",
        "value": {},
        "on": [
          {
            "events": parseSelector('@five_brush:mousedown, @five_brush:keydown', 'scope'),
            "update": "{x: x(unit), y: y(unit), width: five_size.width, height: five_size.height, extent_x: slice(five_x), extent_y: slice(five_y), }"
          }
        ]
      },
      {
        "name": "five_translate_delta",
        "value": {},
        "on": [
          {
            "events": parseSelector('[@five_brush:mousedown, mouseup] > mousemove, [@five_brush:keydown, keyup] > touchmove', 'scope'),
            "update": "{x: x(unit) - five_translate_anchor.x, y: y(unit) - five_translate_anchor.y}"
          }
        ]
      }
    ]);

    assert.includeDeepMembers(signals.filter((s) => s.name === 'five_x')[0].on, [
      {
        "events": {"signal": "five_translate_delta"},
        "update": "clampRange([five_translate_anchor.extent_x[0] + abs(span(five_translate_anchor.extent_x)) * five_translate_delta.x / five_translate_anchor.width, five_translate_anchor.extent_x[1] + abs(span(five_translate_anchor.extent_x)) * five_translate_delta.x / five_translate_anchor.width], invert(\"x\", 0), invert(\"x\", unit.width))"
      }
    ]);

    assert.includeDeepMembers(signals.filter((s) => s.name === 'five_y')[0].on, [
      {
        "events": {"signal": "five_translate_delta"},
        "update": "clampRange([five_translate_anchor.extent_y[0] - abs(span(five_translate_anchor.extent_y)) * five_translate_delta.y / five_translate_anchor.height, five_translate_anchor.extent_y[1] - abs(span(five_translate_anchor.extent_y)) * five_translate_delta.y / five_translate_anchor.height], invert(\"y\", unit.height), invert(\"y\", 0))"
      }
    ]);
  });

  it('builds signals for scale-bound translate', function() {
    model.component.selection = {six: selCmpts['six']};
    const signals = selection.assembleUnitSignals(model, []);
    assert.includeDeepMembers(signals, [
      {
        "name": "six_translate_anchor",
        "value": {},
        "on": [
          {
            "events": parseSelector('mousedown', 'scope'),
            "update": "{x: x(unit), y: y(unit), width: unit.width, height: unit.height, extent_x: domain(\"x\"), extent_y: domain(\"y\"), }"
          }
        ]
      },
      {
        "name": "six_translate_delta",
        "value": {},
        "on": [
          {
            "events": parseSelector('[mousedown, window:mouseup] > window:mousemove!', 'scope'),
            "update": "{x: x(unit) - six_translate_anchor.x, y: y(unit) - six_translate_anchor.y}"
          }
        ]
      }
    ]);

    assert.includeDeepMembers(signals.filter((s) => s.name === 'six_x')[0].on, [
      {
        "events": {"signal": "six_translate_delta"},
        "update": "[six_translate_anchor.extent_x[0] - abs(span(six_translate_anchor.extent_x)) * six_translate_delta.x / six_translate_anchor.width, six_translate_anchor.extent_x[1] - abs(span(six_translate_anchor.extent_x)) * six_translate_delta.x / six_translate_anchor.width]"
      }
    ]);

    assert.includeDeepMembers(signals.filter((s) => s.name === 'six_y')[0].on, [
      {
        "events": {"signal": "six_translate_delta"},
        "update": "[six_translate_anchor.extent_y[0] + abs(span(six_translate_anchor.extent_y)) * six_translate_delta.y / six_translate_anchor.height, six_translate_anchor.extent_y[1] + abs(span(six_translate_anchor.extent_y)) * six_translate_delta.y / six_translate_anchor.height]"
      }
    ]);
  });
});
