// a node in the parse tree
class Node {
  constructor() {

  }

  toAssembly() {
    throw "to be implemented";
  }
}

class Operand extends Node {
  constructor({type, value}) {
    super();
    this.type = type;
    this.value = value;
  }

  toAssembly(symbolTable) {
    switch (this.type) {
      case 'variable':
        const address = symbolTable[this.value] * -1;
        return `DWORD PTR [rbp - ${address}]`;
      case 'register':
        return this.value;
      case 'immediate':
        return this.value;
      default:
        throw `Invalid operand type: ${this.type}`;
    }
  }
}

class Argument extends Node {
  constructor({variableName, order = 0}) {
    super();
    this.variableName = variableName;
    this.order = order;
  }

  toAssembly(symbolTable) {
    // These are the registers where arguments are stored when a function is called,
    // in order that they are used; e.g. if there are 2 arguments, then edi and esi
    // are used
    const argumentRegisters = ["edi", "esi", "edx", "ecx"];
    const d = new Declaration({
      destination: new Operand({type: "variable", value: this.variableName}),
      value: new Operand({type: "register", value: argumentRegisters[this.order]})
    });
    return d.toAssembly(symbolTable);
  }
}

// takes a destination Operand and sets that equal to the value Operand
class Declaration extends Node {
  constructor({destination, value}) {
    super();
    this.destination = destination;
    this.value = value;
  }

  toAssembly(symbolTable) {
    // TODO: should be able to support expression
    const dest = this.destination.toAssembly(symbolTable);
    const val = this.value.toAssembly(symbolTable);
    return `mov ${dest}, ${val}`;
  }
}

class ArrayDeclaration extends Node {
  constructor({destination, values}) {
    super();
    this.destination = destination;
    this.values = values;
  }
  toAssembly(symbolTable){
    let arrayDeclarations = "";
    for(let i=0; i<this.values.length; i++){
      const dec = new Declaration({
        destination: new Operand({type: "variable", value: `${this.destination}[${i}]`}),
        value: new Operand({type: "immediate", value: this.values[i]})
      });
      arrayDeclarations += dec.toAssembly(symbolTable) + '\n';
    }
    return arrayDeclarations;
  }
}

class BinaryExpression extends Node {
  constructor({operator, operand1, operand2}) {
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

    const op1 = this.operand1.toAssembly(symbolTable);
    const op2 = this.operand2.toAssembly(symbolTable);

    const instructions = [
      `mov eax, ${op1}`,
      `${operatorToInstruction[this.operator]} eax, ${op2}`
    ];

    return instructions;
  }
}

class Assignment extends Node {
  constructor({destination, binaryExpression}) {
    super();
    this.destination = destination;
    this.binaryExpression = binaryExpression;
  }

  toAssembly(symbolTable) {
    const destination = this.destination.toAssembly(symbolTable);

    // binaryExpression stores result in eax; so move eax into destination variable
    let instructions = [
      this.binaryExpression.toAssembly(symbolTable),
      `mov ${destination}, eax`
    ].flat();
    return instructions;
  }
}

class ForLoop extends Node {
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

  constructor({declaration, condition, update, statements}) {
    super();
    this.declaration = declaration;
    this.condition = condition;
    this.update = update;
    this.statements = statements;
  }

  toAssembly(symbolTable) {
    // TODO: refactor me into reusable method:
    const childInstructions = this.statements.map(s => s.toAssembly(symbolTable)).flat();

    // determine which jump operation to use after the comparison is done
    const jumpOperations = {
      "<": "jge",
      ">": "jle",
      "==": "jne",
      "<=": "jg",
      ">=": "jl"
    };
    const operator = jumpOperations[this.condition.operator];

    // TODO: increment this loopId globally for each for loop (static variable on ForLoop?)
    const loopId = 1;

    // just for now: return label within instruction list
    let instructions = [
      this.declaration.toAssembly(symbolTable),
      `.LABEL_LOOP_${loopId}_CONDITION:`,
      this.condition.toAssembly(symbolTable),
      `${operator} .LABEL_LOOP_${loopId}_END`,
      childInstructions,
      this.update.toAssembly(symbolTable),
      `jmp .LABEL_LOOP_${loopId}_CONDITION`,
      `.LABEL_LOOP_${loopId}_END:`
    ].flat();

    return instructions;
  }
}

class Return extends Node {
  // can only return a variable at the moment; no expressions
  constructor({operand}) {
    super();
    this.operand = operand;
  }

  toAssembly(symbolTable) {
    const operand = this.operand.toAssembly(symbolTable);
    return `mov eax, ${operand}`
  }
}

class Function extends Node {
  constructor({args, statements}) {
    // args: Array<Argument>
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
