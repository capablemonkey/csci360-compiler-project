// a node in the parse tree
class Node {
  constructor() {

  }

  toAssembly() {
    throw "to be implemented";
  }
}

class Declaration extends Node {
  constructor(variableName, value) {
    super();
    this.variableName = variableName;
    this.value = value;
  }

  toAssembly(symbolTable) {
    // TODO: should be able to support expression
    const address = symbolTable[this.variableName] * -1;
    return `mov DWORD PTR [rbp - ${address}], ${this.value}`;
  }
}

class BinaryExpression extends Node {
  constructor(operator, operand1, operand2) {
    super();
    this.operator = operator;
    this.operand1 = operand1;
    this.operand2 = operand2;
  }

  // stores the result in eax for use by parent node
  toAssembly(symbolTable) {
    const operatorToInstruction = {
      "+": "add",
      "-": "sub"
    };

    if (!(this.operator in operatorToInstruction)) {
      throw `Operator ${this.operator} is not supported`
    }

    // TODO: add private method to resolve operand and allow for immediate value
    // TODO: reuse operand resolver for Declaration
    const address1 = symbolTable[this.operand1] * -1;
    const address2 = symbolTable[this.operand2] * -1;
    const op1 = `DWORD PTR [rbp - ${address1}]`;
    const op2 = `DWORD PTR [rbp - ${address2}]`;

    const instructions = [
      `mov eax, ${op1}`,
      `${operatorToInstruction[this.operator]} eax, ${op2}`
    ];

    return instructions;
  }
}

class Assignment extends Node {
  // TODO: create an Expression which stores its result in eax
  // TODO: Assignment should take what is in eax and then move that into the given variable name
  constructor(variableName, binaryExpression) {
    super();
    this.variableName = variableName;
    this.binaryExpression = binaryExpression;
  }

  toAssembly(symbolTable) {
    // TODO: create a re-usable function that looks up address and generates DWORD PTR [rbp - addy]
    let address = symbolTable[this.variableName] * -1
    let instructions = [
      this.binaryExpression.toAssembly(symbolTable),
      `mov DWORD PTR [rbp - ${address}], eax`
    ].flat();
    return instructions;
  }
}

class ForLoop extends Node {
  // TODO
}

class Return extends Node {
  // can only return a variable at the moment; no expressions
  constructor(variableName) {
    super();
    this.variableName = variableName;
  }

  toAssembly(symbolTable) {
    const address = symbolTable[this.variableName] * -1;
    return `mov eax, DWORD PTR [rbp - ${address}]`
  }
}

class Function extends Node {
  constructor(args, statements) {
    // args: Array<Declaration> ?? will they be initialized?
    // statements: Array<Node>
    super();
    this.args = args;
    this.statements = statements;
  }

  toAssembly(symbolTable) {
    let instructions = [
      "push rbp",
      "mov rbp, rsp"
    ]

    // call each of the statements.toAssembly() and then append their instructions to instructions
    const bodyInstructions = this.statements.map(s => s.toAssembly(symbolTable)).flat()
    instructions = instructions.concat(bodyInstructions)

    instructions.push("pop rbp");
    instructions.push("ret");
    return instructions;
  }
}

/*
int someFunction() {
  int result;
  int foo = 5;
  int bar = 10;
  result = foo + bar;
  return result;
}
 */


const f = new Function([], [
  new Declaration("foo", 5),
  new Declaration("bar", 10),
  new Assignment("result", new BinaryExpression("+", "foo", "bar")),
  new Return("result")
]);

const symbolTable = {
  "foo": -4,
  "bar": -8,
  "result": -12
}

f.toAssembly(symbolTable);