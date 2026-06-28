/**
 * Generate Fibonacci numbers up to the Nth number.
 *
 * @param {number} n - The number of Fibonacci numbers to generate.
 * @returns {number[]} An array containing the Fibonacci sequence up to the nth number.
 */
function generateFibonacci(n) {
  if (typeof n !== 'number' || n < 1) {
    throw new Error('Input must be a positive integer');
  }

  const fib = [0, 1];
  if (n === 1) return [0];
  if (n === 2) return fib.slice(0, 2);

  for (let i = 2; i < n; i++) {
    fib[i] = fib[i - 1] + fib[i - 2];
  }
  return fib;
}

// Export the function for use in other modules or projects
if (typeof module !== 'undefined' && module.exports) {
  module.exports = generateFibonacci;
}

/**
 * Usage Example:
 *
 * const generateFibonacci = require('./fibonacci');
 * const sequence = generateFibonacci(10);
 * console.log(sequence); // Output: [0,1,1,2,3,5,8,13,21,34]
 */
