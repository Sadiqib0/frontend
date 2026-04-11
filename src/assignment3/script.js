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


function getSymbol(op) {
    if (op === '+') return '+';
    if (op === '-') return '−';
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
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

    const opButtons = document.querySelectorAll('.key--op');
    opButtons.forEach(function(btn) {
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



