/* tslint:disable quotemark */

import {assert} from 'chai';
import {selector as parseSelector} from 'vega-event-selector';
import * as selection from '../../../src/compile/selection/selection';
import {keys} from '../../../src/util';
import {parseUnitModel} from '../../util';

describe('Selection', function() {
  const model = parseUnitModel({
    "mark": "circle",
    "encoding": {
      "x": {"field": "Horsepower","type": "quantitative"},
      "y": {"field": "Miles_per_Gallon","type": "quantitative"},
      "color": {"field": "Origin", "type": "nominal"}
    }
  });

  it('parses default selection definitions', function() {
    const component = selection.parseUnitSelection(model, {
      "one": {"type": "single"},
      "two": {"type": "multi"},
      "three": {"type": "interval"}
    });

    assert.sameMembers(keys(component), ['one', 'two', 'three']);

    assert.equal(component.one.name, 'one');
    assert.equal(component.one.type, 'single');
    assert.sameDeepMembers(component['one'].project, [{field: '_id', channel: null}]);
    assert.sameDeepMembers(component['one'].events, parseSelector('click', 'scope'));

    assert.equal(component.two.name, 'two');
    assert.equal(component.two.type, 'multi');
    assert.equal(component.two.toggle, 'event.shiftKey');
    assert.sameDeepMembers(component['two'].project, [{field: '_id', channel: null}]);
    assert.sameDeepMembers(component['two'].events, parseSelector('click', 'scope'));

    assert.equal(component.three.name, 'three');
    assert.equal(component.three.type, 'interval');
    assert.equal(component.three.translate, '[mousedown, window:mouseup] > window:mousemove!');
    assert.equal(component.three.zoom, 'wheel');
    assert.sameDeepMembers<selection.ProjectComponent>(component['three'].project, [{field: 'Horsepower', channel: 'x'}, {field: 'Miles_per_Gallon', channel: 'y'}]);
    assert.sameDeepMembers(component['three'].events, parseSelector('[mousedown, window:mouseup] > window:mousemove!', 'scope'));
  });

  it('supports inline default overrides', function() {
    const component = selection.parseUnitSelection(model, {
      "one": {
        "type": "single",
        "on": "dblclick", "fields": ["Cylinders"]
      },
      "two": {
        "type": "multi",
        "on": "mouseover", "toggle": "event.ctrlKey", "encodings": ["color"]
      },
      "three": {
        "type": "interval",
        "on": "[mousedown[!event.shiftKey], mouseup] > mousemove",
        "encodings": ["y"], "translate": false, "zoom": "wheel[event.altKey]"
      }
    });

    assert.sameMembers(keys(component), ['one', 'two', 'three']);

    assert.equal(component.one.name, 'one');
    assert.equal(component.one.type, 'single');
    assert.sameDeepMembers(component['one'].project, [{field: 'Cylinders', channel: null}]);
    assert.sameDeepMembers(component['one'].events, parseSelector('dblclick', 'scope'));

    assert.equal(component.two.name, 'two');
    assert.equal(component.two.type, 'multi');
    assert.equal(component.two.toggle, 'event.ctrlKey');
    assert.sameDeepMembers<selection.ProjectComponent>(component['two'].project, [{field: 'Origin', channel: 'color'}]);
    assert.sameDeepMembers(component['two'].events, parseSelector('mouseover', 'scope'));

    assert.equal(component.three.name, 'three');
    assert.equal(component.three.type, 'interval');
    assert.equal(component.three.translate, false);
    assert.equal(component.three.zoom, 'wheel[event.altKey]');
    assert.sameDeepMembers<selection.ProjectComponent>(component['three'].project, [{field: 'Miles_per_Gallon', channel: 'y'}]);
    assert.sameDeepMembers(component['three'].events, parseSelector('[mousedown[!event.shiftKey], mouseup] > mousemove', 'scope'));
  });

  it('respects selection configs', function() {
    model.config.selection = {
      single: {on: 'dblclick', fields: ['Cylinders']},
      multi: {on: 'mouseover', encodings: ['color'], toggle: 'event.ctrlKey'},
      interval: {
        on: '[mousedown[!event.shiftKey], mouseup] > mousemove',
        encodings: ['y'],
        zoom: 'wheel[event.altKey]'
      }
    };

    const component = selection.parseUnitSelection(model, {
      "one": {"type": "single"},
      "two": {"type": "multi"},
      "three": {"type": "interval"}
    });

    assert.sameMembers(keys(component), ['one', 'two', 'three']);

    assert.equal(component.one.name, 'one');
    assert.equal(component.one.type, 'single');
    assert.sameDeepMembers(component['one'].project, [{field: 'Cylinders', channel: null}]);
    assert.sameDeepMembers(component['one'].events, parseSelector('dblclick', 'scope'));

    assert.equal(component.two.name, 'two');
    assert.equal(component.two.type, 'multi');
    assert.equal(component.two.toggle, 'event.ctrlKey');
    assert.sameDeepMembers<selection.ProjectComponent>(component['two'].project, [{field: 'Origin', channel: 'color'}]);
    assert.sameDeepMembers(component['two'].events, parseSelector('mouseover', 'scope'));

    assert.equal(component.three.name, 'three');
    assert.equal(component.three.type, 'interval');
    assert(!component.three.translate);
    assert.equal(component.three.zoom, 'wheel[event.altKey]');
    assert.sameDeepMembers<selection.ProjectComponent>(component['three'].project, [{field: 'Miles_per_Gallon', channel: 'y'}]);
    assert.sameDeepMembers(component['three'].events, parseSelector('[mousedown[!event.shiftKey], mouseup] > mousemove', 'scope'));
  });
});
