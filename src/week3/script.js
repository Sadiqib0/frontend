function calculate() {
    return {
        getSum:(firstNumber, secondNumber) => firstNumber + secondNumber,
        subtract:(firstNumber, secondNumber) => firstNumber - secondNumber,
    }
}
module.exports = calculate;