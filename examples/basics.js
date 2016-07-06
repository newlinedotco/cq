/**
 * Here are some queries to try:
 *
 * ```
 * # get the `bye()` function
 * cq '.bye' examples/basics.js
 *
 * # get the `bye()` function plus the line after
 * cq 'context(.bye, 0, 1)' examples/basics.js
 *
 * # get the `Farm` arrow function
 * cq '.Farm' examples/basics.js
 *
 * # get the `Barn` class
 * cq '.Barn' examples/basics.js
 *
 * # get the `calcArea` function on the `Barn` class
 * cq '.Barn .calcArea' examples/basics.js
 *
 * # get the range of `constructor` through `calcArea`, inclusive, of the `Barn` class
 * cq '.Barn .constructor-.calcArea' examples/basics.js
 * ```
 */

const bye = function() {
  return 'bye';
}
bye(); // -> 'bye'

let Farm = () => 'cow';

class Barn {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  
  calcArea() {
    return this.height * this.width;
  }
}
