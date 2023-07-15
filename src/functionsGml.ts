// GAME MAKING ESSENTIAL FUNCTIONS

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ### These functions all deal with using random numbers and values:

// The choose function takes a variable number of arguments and returns one of them randomly. 
// It can be used to choose between different values, such as sprite objects or numbers.
export function choose<T>(...args: T[]): T {
    const index = Math.floor(Math.random() * args.length);
    return args[index];
}

// This function generates a random integer within a specified range. The function takes one argument, which is the maximum value of the range (inclusive). 
// The minimum value is always 0. The function returns a random integer between 0 and the specified maximum value. 
// So, for example, to get a random number from 0 to 15 you can use irandom(15) and it will return a number from 0 to 15 inclusive.
export function irandom(max: number): number {
    return Math.floor(Math.random() * (max + 1));
}

// This function returns a random floating-point (decimal) number between 0.0 (inclusive) and the specified upper limit (inclusive).
// For example, random(100) will return a value from 0 to 100.00, but that value can be 22.56473! 
// You can also use real numbers and not integers in this function like this - random(0.5), which will return a value between 0 and 0.500.
export function random(max: number): number {
  return Math.random() * max;
}

// The random_range function in TypeScript generates a random floating-point number between the specified lower and upper limits (inclusive), 
// and returns the result. It can take real numbers as input arguments.
export function random_range(a: number, b: number): number {
    let min = Math.min(a, b);
    let max = Math.max(a, b);
    return Math.random() * (max - min) + min;
}

// The irandom_range function in TypeScript generates a random integer number within a specified range (inclusive). 
// It takes two parameters - the lower and upper bounds of the range - and returns a random integer value between those two bounds. 
// Real numbers can also be used as input, in which case they will be rounded down to the nearest integer before generating a random number.
export function irandom_range(a: number, b: number): number {
    let min = Math.min(a, b);
    let max = Math.max(a, b);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ### These are all functions that will round values in some way, or select a single value from various given values:

// Clamp number between two values
// With this function you can maintain an input value between a specified range.
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

// Description: The lerp function returns a value that equates to the position between two other values for a given percentage. 
// It takes three arguments: the start value, the end value, and the interpolation amount, which should be a value between 0 and 1. 
// The function returns the value that is the specified percentage of the way between the start and end values. 
// It can also extrapolate beyond the start and end values if a value outside the range of 0 to 1 is used as the interpolation amount.
export function lerp(a: number, b: number, amt: number): number {
    return (1 - amt) * a + amt * b;
}

// This function returns the minimum of the input values, of which it can have as many as you require (note that more arguments will mean 
// that the function will be slower to parse). For example min(12, 96, 32, 75) will return 12 as that is the lowest of all the input values.
export function min(...values: number[]): number {
    return Math.min(...values);
}

// This function returns the maximum of the input values, of which it can have up to 16. 
// For example max(12, 96, 32, 75) will return 96 as that is the highest of all the input values.
export function max(...values: number[]): number {
    return Math.max(...values);
}

// This function returns the median of the input values, that is, the middle value. 
// When the number of arguments is even, the smaller of the two middle values is returned and the function can have as many arguments as 
// required (note that more arguments will mean that the function will be slower to parse) which must all be real values. 
// This means that, for example, median(43, 12, 25, 19, 6) would return 19 as it is the middle value between all the rest, 
// median(2, 5, 7, 3) would return 3 as the smaller of the two middle values.
export function median(...values: number[]): number {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : Math.min(values[mid - 1], values[mid]);
}

// The 'mean' function in TypeScript calculates the average of a given set of numbers by adding them up and dividing by their count. 
// It can take any number of arguments and returns the resulting mean value.
// This function works by adding up all the input values and then dividing them by their own number. 
// You can have as many arguments as you require (note that more arguments will mean that the function will be slower to parse). 
// So, mean(2, 6, 9, 32) returns 12.25 as 2+6+9+32=49 and 49/4=12.25.
export function mean(...values: number[]): number {
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return sum / values.length;
}

// This function takes any real number and rounds it up to the nearest integer. 
export function ceil(num: number): number {
    return Math.ceil(num);
}

// Returns the floor of n, that is, n rounded down to an integer. This is similar to the round() function, but it only rounds down, no matter what the decimal value, so floor(5.99999) will return 5, as will floor(5.2), floor(5.6457) etc...
export function floor(num: number): number {
    return Math.floor(num);
}

// This function returns whether a number is positive, negative or neither and returns 1, -1, or 0, respectively.
export function sign(num: number): number {
    return Math.sign(num);
}

// This function returns the absolute value of the input argument, so if it's a positive value then it will remain the same, 
// but if it's negative it will be multiplied by -1 to make it positive.
export function abs(num: number): number {
    return Math.abs(num);
}

// This function returns the fractional part of n, that is, the part behind the decimal dot. 
// It will return only the decimals behind the dot of a value, so frac(3.125) will return 0.125, frac(6.921) will return 0.921, etc...
export function frac(n: number): number {
    return n - Math.floor(n);
}

export function round(num: number): number {
    return Math.round(num);
}



// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// ### Here is a number of vector-based functions, listed below:

// The point_direction function in TypeScript calculates the direction of a vector formed by two points in relation to the fixed x/y coordinates of the room. 
// It takes in four arguments: x1 and y1 which represent the starting point of the vector, and x2 and y2 which represent the end point of the vector.

// The function returns a real value that represents the direction of the vector in degrees, where 0 degrees is facing right and angles increase in a 
// counterclockwise direction. For example, if the vector points directly up, the function would return 90 degrees.

// This function is useful in game development for calculating the direction from one object to another or for determining the direction of movement for a projectile or character.
export function point_direction(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return (angle + 360) % 360; // ensure result is between 0 and 359 degrees
}

// This function takes in the x and y coordinates of two points and returns the distance between them, calculated as the length of the vector formed by the two points. 
// It calculates the distance using the Pythagorean theorem: the square of the distance between the two points is equal to the sum of the squares of the differences 
// in their x and y coordinates. The function then returns the square root of this value to get the actual distance.
export function point_distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}