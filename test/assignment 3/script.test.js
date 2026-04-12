const createMockElement = () => ({
    textContent: '',
    classList: { add: jest.fn(), remove: jest.fn() },
    dataset: {},
    addEventListener: jest.fn(),
});

global.document = {
    getElementById:   jest.fn(() => createMockElement()),
    querySelector:    jest.fn(() => createMockElement()),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
};
global.setTimeout = jest.fn();

const createCalculator = require('../../src/assignment3/script');


const calculator = createCalculator();

beforeEach(() => {
    calculator.clear();
});


describe('getSymbol', () => {

    test('returns + for addition', () => {
        expect(calculator.getSymbol('+')).toBe('+');
    });

    test('returns − for subtraction', () => {
        expect(calculator.getSymbol('-')).toBe('−');
    });

    test('returns × for multiplication', () => {
        expect(calculator.getSymbol('*')).toBe('×');
    });

    test('returns ÷ for division', () => {
        expect(calculator.getSymbol('/')).toBe('÷');
    });

    test('returns original character for unknown operator', () => {
        expect(calculator.getSymbol('^')).toBe('^');
    });
});


describe('formatNumber', () => {
    test('returns empty string for null', () => {
        expect(calculator.formatNumber(null)).toBe('');
    });

    test('returns empty string for undefined', () => {
        expect(calculator.formatNumber(undefined)).toBe('');
    });

    test('returns scientific notation string as-is', () => {
        expect(calculator.formatNumber('1e+21')).toBe('1e+21');
    });

    test('formats integer with thousand separators', () => {
        expect(calculator.formatNumber(1000000)).toBe('1,000,000');
    });

    test('formats small integer without separator', () => {
        expect(calculator.formatNumber(5)).toBe('5');
    });

    test('preserves decimal part', () => {
        expect(calculator.formatNumber(3.14)).toBe('3.14');
    });

    test('truncates decimal to 8 places', () => {
        expect(calculator.formatNumber('1.123456789')).toBe('1.12345678');
    });

    test('formats number with trailing decimal dot', () => {
        expect(calculator.formatNumber('5.')).toBe('5.');
    });
});


describe('compute', () => {
    test('adds two numbers', () => {
        expect(calculator.compute(2, 3, '+')).toBe(5);
    });

    test('subtracts two numbers', () => {
        expect(calculator.compute(10, 4, '-')).toBe(6);
    });

    test('multiplies two numbers', () => {
        expect(calculator.compute(3, 7, '*')).toBe(21);
    });

    test('divides two numbers', () => {
        expect(calculator.compute(9, 3, '/')).toBe(3);
    });

    test('returns null and sets errored state on division by zero', () => {
        const result = calculator.compute(5, 0, '/');
        expect(result).toBeNull();
        expect(calculator.getState().errored).toBe(true);
    });

    test('returns b for unknown operator', () => {
        expect(calculator.compute(10, 7, '^')).toBe(7);
    });

    test('handles floating point correctly', () => {
        expect(calculator.compute(0.1, 0.2, '+')).toBeCloseTo(0.3);
    });
});

describe('appendNumber', () => {
    test('replaces leading zero when typing a digit', () => {
        calculator.appendNumber('5');
        expect(calculator.getState().currentOperand).toBe('5');
    });

    test('appends digit to existing number', () => {
        calculator.appendNumber('1');
        calculator.appendNumber('2');
        expect(calculator.getState().currentOperand).toBe('12');
    });

    test('appends decimal point', () => {
        calculator.appendNumber('3');
        calculator.appendNumber('.');
        expect(calculator.getState().currentOperand).toBe('3.');
    });

    test('ignores second decimal point', () => {
        calculator.appendNumber('3');
        calculator.appendNumber('.');
        calculator.appendNumber('1');
        calculator.appendNumber('.');
        expect(calculator.getState().currentOperand).toBe('3.1');
    });

    test('starts fresh after evaluation', () => {
        calculator.appendNumber('4');
        calculator.chooseOperator('+');
        calculator.appendNumber('6');
        calculator.computeResult();
        calculator.appendNumber('2');
        expect(calculator.getState().currentOperand).toBe('2');
    });

    test('clears error before appending', () => {
        calculator.compute(1, 0, '/');
        calculator.appendNumber('9');
        expect(calculator.getState().errored).toBe(false);
        expect(calculator.getState().currentOperand).toBe('9');
    });
});

describe('chooseOperator', () => {
    test('sets awaitingOperand flag after choosing operator', () => {
        calculator.appendNumber('5');
        calculator.chooseOperator('+');
        expect(calculator.getState().awaitingOperand).toBe(true);
        expect(calculator.getState().pendingOperator).toBe('+');
    });

    test('replaces operator when called consecutively', () => {
        calculator.appendNumber('5');
        calculator.chooseOperator('+');
        calculator.chooseOperator('-');
        expect(calculator.getState().pendingOperator).toBe('-');
    });

    test('chains operations: 3 + 2 * computes 3+2=5 first', () => {
        calculator.appendNumber('3');
        calculator.chooseOperator('+');
        calculator.appendNumber('2');
        calculator.chooseOperator('*');
        expect(calculator.getState().currentOperand).toBe('5');
        expect(calculator.getState().pendingOperator).toBe('*');
    });

    test('does nothing when errored', () => {
        calculator.compute(1, 0, '/');
        const prevOperator = calculator.getState().pendingOperator;
        calculator.chooseOperator('+');
        expect(calculator.getState().pendingOperator).toBe(prevOperator);
    });
});

describe('computeResult', () => {
    test('computes basic addition', () => {
        calculator.appendNumber('4');
        calculator.chooseOperator('+');
        calculator.appendNumber('6');
        calculator.computeResult();
        expect(calculator.getState().currentOperand).toBe('10');
    });

    test('computes subtraction', () => {
        calculator.appendNumber('9');
        calculator.chooseOperator('-');
        calculator.appendNumber('3');
        calculator.computeResult();
        expect(calculator.getState().currentOperand).toBe('6');
    });

    test('computes multiplication', () => {
        calculator.appendNumber('5');
        calculator.chooseOperator('*');
        calculator.appendNumber('3');
        calculator.computeResult();
        expect(calculator.getState().currentOperand).toBe('15');
    });

    test('computes division', () => {
        calculator.appendNumber('8');
        calculator.chooseOperator('/');
        calculator.appendNumber('2');
        calculator.computeResult();
        expect(calculator.getState().currentOperand).toBe('4');
    });

    test('sets justEvaluated flag after compute', () => {
        calculator.appendNumber('2');
        calculator.chooseOperator('+');
        calculator.appendNumber('3');
        calculator.computeResult();
        expect(calculator.getState().justEvaluated).toBe(true);
    });

    test('repeats last operation on consecutive equals (5+3=8, then =11)', () => {
        calculator.appendNumber('5');
        calculator.chooseOperator('+');
        calculator.appendNumber('3');
        calculator.computeResult();
        calculator.computeResult();
        expect(calculator.getState().currentOperand).toBe('11');
    });

    test('does nothing when errored', () => {
        calculator.compute(1, 0, '/');
        calculator.computeResult();
        expect(calculator.getState().errored).toBe(true);
    });

    test('does nothing when no operator is pending', () => {
        calculator.appendNumber('5');
        calculator.computeResult();
        expect(calculator.getState().currentOperand).toBe('5');
    });
});

describe('clear', () => {
    test('resets currentOperand to 0', () => {
        calculator.appendNumber('9');
        calculator.clear();
        expect(calculator.getState().currentOperand).toBe('0');
    });

    test('clears pendingOperator', () => {
        calculator.appendNumber('5');
        calculator.chooseOperator('+');
        calculator.clear();
        expect(calculator.getState().pendingOperator).toBeNull();
    });

    test('clears previousOperand', () => {
        calculator.appendNumber('5');
        calculator.chooseOperator('+');
        calculator.clear();
        expect(calculator.getState().previousOperand).toBeNull();
    });

    test('clears error state', () => {
        calculator.compute(1, 0, '/');
        calculator.clear();
        expect(calculator.getState().errored).toBe(false);
    });

    test('resets justEvaluated flag', () => {
        calculator.appendNumber('2');
        calculator.chooseOperator('+');
        calculator.appendNumber('3');
        calculator.computeResult();
        calculator.clear();
        expect(calculator.getState().justEvaluated).toBe(false);
    });

    test('resets awaitingOperand flag', () => {
        calculator.appendNumber('5');
        calculator.chooseOperator('+');
        calculator.clear();
        expect(calculator.getState().awaitingOperand).toBe(false);
    });
});

describe('deleteLast', () => {
    test('removes the last digit', () => {
        calculator.appendNumber('1');
        calculator.appendNumber('2');
        calculator.appendNumber('3');
        calculator.deleteLast();
        expect(calculator.getState().currentOperand).toBe('12');
    });

    test('sets to 0 when only one digit remains', () => {
        calculator.appendNumber('5');
        calculator.deleteLast();
        expect(calculator.getState().currentOperand).toBe('0');
    });

    test('sets to 0 when negative single digit (e.g. "-5")', () => {
        calculator.appendNumber('5');
        calculator.toggleSign();
        calculator.deleteLast();
        expect(calculator.getState().currentOperand).toBe('0');
    });

    test('does nothing when justEvaluated', () => {
        calculator.appendNumber('4');
        calculator.chooseOperator('+');
        calculator.appendNumber('6');
        calculator.computeResult();
        calculator.deleteLast();
        expect(calculator.getState().currentOperand).toBe('10');
    });

    test('clears error and resets when errored', () => {
        calculator.compute(1, 0, '/');
        calculator.deleteLast();
        expect(calculator.getState().errored).toBe(false);
        expect(calculator.getState().currentOperand).toBe('0');
    });
});

describe('percent', () => {
    test('divides current operand by 100', () => {
        calculator.appendNumber('5');
        calculator.appendNumber('0');
        calculator.percent();
        expect(calculator.getState().currentOperand).toBe('0.5');
    });

    test('handles 100% → 1', () => {
        calculator.appendNumber('1');
        calculator.appendNumber('0');
        calculator.appendNumber('0');
        calculator.percent();
        expect(calculator.getState().currentOperand).toBe('1');
    });

    test('does nothing when errored', () => {
        calculator.compute(1, 0, '/');
        calculator.percent();
        expect(calculator.getState().errored).toBe(true);
    });
});

describe('toggleSign', () => {
    test('negates a positive number', () => {
        calculator.appendNumber('7');
        calculator.toggleSign();
        expect(calculator.getState().currentOperand).toBe('-7');
    });

    test('negates a negative number back to positive', () => {
        calculator.appendNumber('7');
        calculator.toggleSign();
        calculator.toggleSign();
        expect(calculator.getState().currentOperand).toBe('7');
    });

    test('does nothing when value is 0', () => {
        calculator.toggleSign();
        expect(calculator.getState().currentOperand).toBe('0');
    });

    test('does nothing when errored', () => {
        calculator.compute(1, 0, '/');
        calculator.toggleSign();
        expect(calculator.getState().errored).toBe(true);
    });
});
