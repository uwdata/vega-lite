import {assert} from 'chai';
import {expression, isEqualFilter, isInFilter, isRangeFilter} from '../src/filter';
import {TimeUnit} from '../src/timeunit';

describe('filter', () => {
  const equalFilter = {field: 'color', equal: 'red'};
  const inFilter = {field: 'color', in: ['red', 'yellow']};
  const rangeFilter = {field: 'x', range: [0, 5]};
  const exprFilter = 'datum["x"]===5';

  describe('isEqualFilter', () => {
    it('should return true for an equal filter', () => {
      assert.isTrue(isEqualFilter(equalFilter));
    });

    it('should return false for other filters', () => {
      [inFilter, rangeFilter, exprFilter].forEach((filter) => {
        assert.isFalse(isEqualFilter(filter));
      });
    });
  });

  describe('isInFilter', () => {
    it('should return true for an in filter', () => {
      assert.isTrue(isInFilter(inFilter));
    });

    it('should return false for other filters', () => {
      [equalFilter, rangeFilter, exprFilter].forEach((filter) => {
        assert.isFalse(isInFilter(filter));
      });
    });
  });

  describe('isRangeFilter', () => {
    it('should return true for a range filter', () => {
      assert.isTrue(isRangeFilter(rangeFilter));
    });

    it('should return false for other filters', () => {
      [inFilter, equalFilter, exprFilter].forEach((filter) => {
        assert.isFalse(isRangeFilter(filter));
      });
    });
  });

  describe('expression', () => {
    it('should return a correct expression for an EqualFilter', () => {
      const expr = expression({field: 'color', equal: 'red'});
      assert.equal(expr, 'datum["color"]==="red"');
    });

    it('should return a correct expression for an EqualFilter with datetime object', () => {
      const expr = expression({
        field: 'date',
        equal: {
          month: 'January'
        }
      });
      assert.equal(expr, 'datum["date"]===time(datetime(0, 0, 1, 0, 0, 0, 0))');
    });

    it('should return a correct expression for an EqualFilter with time unit and datetime object', () => {
      const expr = expression({
        timeUnit: TimeUnit.MONTH,
        field: 'date',
        equal: {
          month: 'January'
        }
      });
      assert.equal(expr, 'time(datetime(0, month(datum["date"]), 1, 0, 0, 0, 0))===time(datetime(0, 0, 1, 0, 0, 0, 0))');
    });

    it('should return a correct expression for an EqualFilter with datetime ojbect', () => {
      const expr = expression({
        timeUnit: TimeUnit.MONTH,
        field: 'date',
        equal: 'January'
      });
      assert.equal(expr, 'time(datetime(0, month(datum["date"]), 1, 0, 0, 0, 0))===time(datetime(0, 0, 1, 0, 0, 0, 0))');
    });

    it('should return a correct expression for an InFilter', () => {
      const expr = expression({field: 'color', in: ['red', 'yellow']});
      assert.equal(expr, 'indexof(["red","yellow"], datum["color"]) !== -1');
    });

    it('should return a correct expression for a RangeFilter', () => {
      const expr = expression({field: 'x', range: [0, 5]});
      assert.equal(expr, 'inrange(datum["x"], 0, 5)');
    });

    it('should return a correct expression for a RangeFilter with no lower bound', () => {
      const expr = expression({field: 'x', range: [null, 5]});
      assert.equal(expr, 'datum["x"] <= 5');
    });

    it('should return a correct expression for a RangeFilter with no upper bound', () => {
      const expr = expression({field: 'x', range: [0, null]});
      assert.equal(expr, 'datum["x"] >= 0');
    });


    it('should return undefined for a RangeFilter with no bound', () => {
      const expr = expression({field: 'x', range: [null, null]});
      assert.equal(expr, undefined);
    });

    it('should return a correct expression for an expression filter', () => {
      const expr = expression('datum["x"]===5');
      assert.equal(expr, 'datum["x"]===5');
    });
  });
});
