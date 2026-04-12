const calculator = document.getElementById('calculator');
const currentElement = document.querySelector('[data-current]');
const historyElement = document.querySelector('[data-history]');
const keysElement = document.querySelector('.keys');

let currentOperand = '0';
let previousOperand = null;
let pendingOperator = null;
let justEvaluated = false;
let awaitingOperand = false;
let lastOperator = null;
let lastOperand = null;
let expression = '';
let lastExpression = null;
let errored = false;


function getSymbol(operator) {
    if (operator === '+') return '+';
    if (operator === '-') return '−';
    if (operator === '*') return '×';
    if (operator === '/') return '÷';
    return operator;
}


function formatNumber(value) {
    if (value === null || value === undefined) return '';
    const str = value.toString();
    if (str.includes('e')) return str;

    const parts = str.split('.');
    const intPart = Number(parts[0]).toLocaleString('en-US');

    if (parts[1] !== undefined) {
        return intPart + '.' + parts[1].slice(0, 8);
    }
    return intPart;
}

function updateDisplay() {
    if (errored) {
        currentElement.textContent = currentOperand;
        historyElement.textContent = '';
    } else if (justEvaluated && lastExpression) {
        currentElement.textContent = formatNumber(currentOperand);
        historyElement.textContent = lastExpression;
    } else if (expression) {
        if (awaitingOperand) {
            currentElement.textContent = expression;
        } else {
            currentElement.textContent = expression + formatNumber(currentOperand);
        }
        historyElement.textContent = '';
    } else {
        currentElement.textContent = formatNumber(currentOperand);
        historyElement.textContent = '';
    }

    const operatorButtons = document.querySelectorAll('.key--op');
    operatorButtons.forEach(function(btn) {
        if (awaitingOperand && btn.dataset.operator === pendingOperator) {
            btn.classList.add('is-active');
        } else {
            btn.classList.remove('is-active');
        }
    });
}

function flashDisplay() {
    currentElement.classList.add('flash');
    setTimeout(function() { currentElement.classList.remove('flash'); }, 150);
}

function shake() {
    calculator.classList.add('shake');
    setTimeout(function() { calculator.classList.remove('shake'); }, 350);
}

function appendNumber(input) {
    if (errored) clear();

    if (justEvaluated || awaitingOperand) {
        currentOperand = '0';
        justEvaluated = false;
        awaitingOperand = false;
    }

    if (input === '.') {
        if (currentOperand.includes('.')) return;
        currentOperand = currentOperand + '.';
    } else {
        if (currentOperand === '0') {
            currentOperand = input;
        } else {
            currentOperand = currentOperand + input;
        }
    }

    updateDisplay();
}

function chooseOperator(op) {
    if (errored) return;
    if (awaitingOperand) {
        pendingOperator = op;
        expression = expression.slice(0, -1) + getSymbol(op);
        updateDisplay();
        return;
    }

    const typedOperand = formatNumber(currentOperand);

    if (previousOperand !== null && !justEvaluated) {
        const result = compute(previousOperand, parseFloat(currentOperand), pendingOperator);
        if (result === null) return;
        previousOperand = result;
        currentOperand = result.toString();
    } else {
        previousOperand = parseFloat(currentOperand);
    }

    if (justEvaluated) expression = '';

    expression = expression + typedOperand + getSymbol(op);
    pendingOperator = op;
    justEvaluated = false;
    awaitingOperand = true;
    flashDisplay();
    updateDisplay();
}

function compute(a, b, op) {
    let result;

    if (op === '+') {
        result = a + b;
    } else if (op === '-') {
        result = a - b;
    } else if (op === '*') {
        result = a * b;
    } else if (op === '/') {
        if (b === 0) {
            errored = true;
            currentOperand = "Can't divide by zero";
            previousOperand = null;
            pendingOperator = null;
            shake();
            updateDisplay();
            return null;
        }
        result = a / b;
    } else {
        return b;
    }
    return parseFloat(result.toFixed(10));
}

function computeResult() {
    if (errored) return;

    let a, b, op;

    if (pendingOperator !== null && previousOperand !== null) {
        a = previousOperand;
        b = parseFloat(currentOperand);
        op = pendingOperator;
        lastOperator = op;
        lastOperand = b;
    } else if (justEvaluated && lastOperator !== null) {
        a = parseFloat(currentOperand);
        b = lastOperand;
        op = lastOperator;
    } else {
        return;
    }

    const result = compute(a, b, op);
    if (result === null) return;

    if (expression) {
        lastExpression = expression + formatNumber(currentOperand);
    } else {
        lastExpression = formatNumber(a) + getSymbol(op) + formatNumber(b);
    }

    expression = '';
    currentOperand = result.toString();
    previousOperand = null;
    pendingOperator = null;
    justEvaluated = true;
    awaitingOperand = false;
    flashDisplay();
    updateDisplay();
}

function clear() {
    currentOperand = '0';
    previousOperand = null;
    pendingOperator = null;
    justEvaluated = false;
    awaitingOperand = false;
    expression = '';
    lastExpression = null;
    lastOperator = null;
    lastOperand = null;
    errored = false;
    flashDisplay();
    updateDisplay();
}

function deleteLast() {
    if (errored) return clear();
    if (justEvaluated) return;

    if (currentOperand.length <= 1) {
        currentOperand = '0';
    } else if (currentOperand.length === 2 && currentOperand.startsWith('-')) {
        currentOperand = '0';
    } else {
        currentOperand = currentOperand.slice(0, -1);
    }

    updateDisplay();
}

function percent() {
    if (errored) return;
    currentOperand = (parseFloat(currentOperand) / 100).toString();
    updateDisplay();
}

function toggleSign() {
    if (errored) return;
    const value = parseFloat(currentOperand);
    if (value === 0) return;
    currentOperand = (value * -1).toString();
    updateDisplay();
}

keysElement.addEventListener('click', function(e) {
    const button = e.target.closest('button');
    if (!button) return;

    if (button.dataset.number !== undefined) {
        appendNumber(button.dataset.number);
    } else if (button.dataset.operator) {
        chooseOperator(button.dataset.operator);
    } else if (button.dataset.action === 'equals') {
        computeResult();
    } else if (button.dataset.action === 'clear') {
        clear();
    } else if (button.dataset.action === 'delete') {
        deleteLast();
    } else if (button.dataset.action === 'percent') {
        percent();
    } else if (button.dataset.action === 'toggle-sign') {
        toggleSign();
    }
});

document.addEventListener('keydown', function(e) {
    const key = e.key;

    if ((key >= '0' && key <= '9') || key === '.') {
        appendNumber(key);
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        chooseOperator(key);
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        computeResult();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === 'Escape') {
        clear();
    } else if (key === '%') {
        percent();
    }
});

updateDisplay();




