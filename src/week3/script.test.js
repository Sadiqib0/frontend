const {getSum,subtract} = require('./script')();

const digitOne = 4; //Arrange
const digitTwo = 5; //Arrange

test("sum two numbers", ()=>{
    const result = getSum(digitOne, digitTwo); //Action
    expect(result).toBe(9);
})

test("subtract two numbers", ()=>{
    const result = subtract(digitOne, digitTwo); //Action
    expect(result).toBe(-1);
})