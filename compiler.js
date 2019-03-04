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
      "-": "sub",
      ">": "cmp",
      "<": "cmp"
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
  // TODO: create label for instruction after end of for loop
  // TODO: create label for checking condition
  // TODO: check condition
  // TODO: just for now: return label within instruction list

  /*
  for (int i = 0; i < num; i = i + 1) becomes...

    mov     dword ptr [rbp - 12], 0

    .LABEL_LOOP_1_CONDITION:
    mov     eax, dword ptr [rbp - 12]
    cmp     eax, dword ptr [rbp - 4]  // num => [rbp - 4]
    jge     .LABEL_LOOP_1_END
    <statements inside loop>
    mov     eax, dword ptr [rbp - 12]
    add     eax, 1
    mov     dword ptr [rbp - 12], eax
    jmp     .LABEL_LOOP_1_CONDITION

    .LABEL_LOOP_1_END:
    <statements after loop>
   */

  constructor(declaration, condition, update, statements) {
    super();
    this.declaration = declaration;
    this.condition = condition;
    this.update = update;
    this.statements = statements;
  }

  toAssembly(symbolTable) {
    // TODO: refactor me into reusable method:
    const childInstructions = this.statements.map(s => s.toAssembly(symbolTable)).flat();

    let instructions = [
      this.declaration.toAssembly(symbolTable),
      ".LABEL_LOOP_1_CONDITION:",
      this.condition.toAssembly(symbolTable),
      "jge .LABEL_LOOP_1_END", // TODO: change based on condition
      childInstructions,
      this.update.toAssembly(symbolTable),
      "jmp .LABEL_LOOP_1_CONDITION"
    ].flat();

    return instructions;
  }
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
  // TOOD: use keyword arguments in all these constructors
  constructor(args, statements) {
    // args: Array<Declaration> ?? will they be initialized?
    // statements: Array<Node>
    super();
    this.args = args;
    this.statements = statements;
  }

  toAssembly(symbolTable) {
    if (!symbolTable) {
      throw "Symbol table missing"
    }

    let instructions = [
      "push rbp",
      "mov rbp, rsp"
    ]

    // handle arguments (load them from registers)
    const argumentInstructions = this.args.map(a => a.toAssembly(symbolTable)).flat();
    instructions = instructions.concat(argumentInstructions);

    // call each of the statements.toAssembly() and then append their instructions to instructions
    const childInstructions = this.statements.map(s => s.toAssembly(symbolTable)).flat();
    instructions = instructions.concat(childInstructions);

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


// const f = new Function([], [
//   new Declaration("foo", 5),
//   new Declaration("bar", 10),
//   new Assignment("result", new BinaryExpression("+", "foo", "bar")),
//   new Return("result")
// ]);

// const symbolTable = {
//   "foo": -4,
//   "bar": -8,
//   "result": -12
// }

// f.toAssembly(symbolTable);


const sumFunction = new Function(
  [new Declaration("num", "edi")],
  [
    new Declaration("sum", 0),
    new ForLoop(
      new Declaration("i", 0),
      new BinaryExpression("<", "i", "num"),
      new Assignment("i", new BinaryExpression("+", "i", 1)),
      [new Assignment("sum", new BinaryExpression("+", "sum", "i"))],
    ),
    new Return("sum")
  ]
)

const symbolTable = {
  "num": -4,
  "sum": -8,
  "i": -12
}

sumFunction.toAssembly(symbolTable);