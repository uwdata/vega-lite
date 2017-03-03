/* tslint:disable quotemark */
"use strict";
var chai_1 = require("chai");
var util_1 = require("../../util");
var rect_1 = require("../../../src/compile/mark/rect");
describe('Mark: Rect', function () {
    describe('simple vertical', function () {
        var model = util_1.parseUnitModel({
            "data": { "url": 'data/cars.json' },
            "mark": "rect",
            "encoding": {
                "x": { "field": "Origin", "type": "nominal" },
                "y": { "type": "quantitative", "field": 'Acceleration', "aggregate": "mean" }
            }
        });
        var props = rect_1.rect.encodeEntry(model);
        it('should draw bar, with y from zero to field value and x band', function () {
            chai_1.assert.deepEqual(props.x, { scale: 'x', field: 'Origin' });
            chai_1.assert.deepEqual(props.width, { scale: 'x', band: true });
            chai_1.assert.deepEqual(props.y, { scale: 'y', field: 'mean_Acceleration' });
            chai_1.assert.deepEqual(props.y2, { scale: 'y', value: 0 });
            chai_1.assert.isUndefined(props.height);
        });
    });
    describe('simple horizontal', function () {
        var model = util_1.parseUnitModel({
            "data": { "url": 'data/cars.json' },
            "mark": "rect",
            "encoding": {
                "y": { "field": "Origin", "type": "nominal" },
                "x": { "aggregate": "mean", "field": 'Acceleration', "type": "quantitative" }
            }
        });
        var props = rect_1.rect.encodeEntry(model);
        it('should draw bar from zero to field value and y band', function () {
            chai_1.assert.deepEqual(props.y, { scale: 'y', field: 'Origin' });
            chai_1.assert.deepEqual(props.height, { scale: 'y', band: true });
            chai_1.assert.deepEqual(props.x, { scale: 'x', field: 'mean_Acceleration' });
            chai_1.assert.deepEqual(props.x2, { scale: 'x', value: 0 });
            chai_1.assert.isUndefined(props.width);
        });
    });
    describe('horizontal binned', function () {
        var model = util_1.parseUnitModel({
            "data": { "url": 'data/cars.json' },
            "mark": "rect",
            "encoding": {
                "y": { "bin": true, "field": 'Horsepower', "type": "quantitative" },
                "x": { "aggregate": "mean", "field": 'Acceleration', "type": "quantitative" }
            }
        });
        var props = rect_1.rect.encodeEntry(model);
        it('should draw bar with y and y2', function () {
            chai_1.assert.deepEqual(props.y2, { scale: 'y', field: 'bin_Horsepower_start' });
            chai_1.assert.deepEqual(props.y, { scale: 'y', field: 'bin_Horsepower_end' });
            chai_1.assert.isUndefined(props.height);
        });
    });
    describe('vertical binned', function () {
        var model = util_1.parseUnitModel({
            "data": { "url": 'data/cars.json' },
            "mark": "rect",
            "encoding": {
                "x": { "bin": true, "field": 'Horsepower', "type": "quantitative" },
                "y": { "aggregate": "mean", "field": 'Acceleration', "type": "quantitative" }
            }
        });
        var props = rect_1.rect.encodeEntry(model);
        it('should draw bar with x and x2', function () {
            chai_1.assert.deepEqual(props.x2, { scale: 'x', field: 'bin_Horsepower_start' });
            chai_1.assert.deepEqual(props.x, { scale: 'x', field: 'bin_Horsepower_end' });
            chai_1.assert.isUndefined(props.width);
        });
    });
    describe('simple ranged', function () {
        var model = util_1.parseUnitModel({
            "data": { "url": 'data/cars.json' },
            "mark": "rect",
            "encoding": {
                "y": { "aggregate": "min", "field": 'Horsepower', "type": "quantitative" },
                "y2": { "aggregate": "max", "field": 'Horsepower', "type": "quantitative" },
                "x": { "aggregate": "min", "field": 'Acceleration', "type": "quantitative" },
                "x2": { "aggregate": "max", "field": 'Acceleration', "type": "quantitative" }
            }
        });
        var props = rect_1.rect.encodeEntry(model);
        it('should draw rectange with x, x2, y, y2', function () {
            chai_1.assert.deepEqual(props.x, { scale: 'x', field: 'min_Acceleration' });
            chai_1.assert.deepEqual(props.x2, { scale: 'x', field: 'max_Acceleration' });
            chai_1.assert.deepEqual(props.y, { scale: 'y', field: 'min_Horsepower' });
            chai_1.assert.deepEqual(props.y2, { scale: 'y', field: 'max_Horsepower' });
        });
    });
    describe('simple heatmap', function () {
        var model = util_1.parseUnitModel({
            "data": { "url": "data/cars.json" },
            "mark": "rect",
            "encoding": {
                "y": { "field": "Origin", "type": "ordinal" },
                "x": { "field": "Cylinders", "type": "ordinal" },
                "color": { "aggregate": "mean", "field": "Horsepower", "type": "quantitative" }
            }
        });
        var props = rect_1.rect.encodeEntry(model);
        it('should draw rect with x and y bands', function () {
            chai_1.assert.deepEqual(props.x, { scale: 'x', field: 'Cylinders' });
            chai_1.assert.deepEqual(props.width, { scale: 'x', band: true });
            chai_1.assert.deepEqual(props.y, { scale: 'y', field: 'Origin' });
            chai_1.assert.deepEqual(props.height, { scale: 'y', band: true });
        });
    });
});
//# sourceMappingURL=rect.test.js.map