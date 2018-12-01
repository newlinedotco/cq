const basics = `const bye = function() {
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
}`;

const basicExamples = [
  { name: "Basics: Select a variable", code: basics, query: ".Farm" },
  { name: "Basics: Select a class", code: basics, query: ".Barn" },
  {
    name: "Basics: Select a method on a class",
    code: basics,
    query: ".Barn .calcArea"
  },
  {
    name: "Basics: Get a function plus the line after",
    code: basics,
    query: "context(.bye, 0, 1)"
  }
];

const examples = [...basicExamples];
export default examples;
