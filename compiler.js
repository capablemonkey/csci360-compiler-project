const INT_SIZE = 4;

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

class CallerArgument extends Node {
  constructor({value, type, order, dataType}) {
    /* value: the value of the argument
       type: variable || immediate || address
       order: number the parameter number this argument is for the function
       dataType: the dataType of the argument: int, int*, float etc
       dataType is not used here but it helps to have for FunctionCall class
    */
    super();
    this.value = value;
    this.type = type;
    this.order = order;
    this.dataType = dataType
  }

  toAssembly(symbolTable) {
    const argumentRegisters = ["edi", "esi", "edx", "ecx"];
    const argumentRegister = argumentRegisters[this.order];
    let address;
    switch (this.type) {
      case 'variable':
        address = symbolTable[this.value] * -1;
        return [`mov eax, DWORD PTR [rbp - ${address}]`, `mov ${argumentRegister}, eax`];
      case 'immediate':
        return `mov ${argumentRegister} ${this.value}`;
      case 'address': // handles references & pointers
        address = symbolTable[this.value] * -1;
        return [`lea rax, [rbp - ${address}]`, `mov ${argumentRegister}, rax`];
      default:
        throw `Invalid argument type: ${this.type}`;
    }
  }
}

class ArrayElement extends Node {
  constructor({name, index, foreign = false}) {
    super();
    this.name = name;
    this.index = index;
    this.foreign = foreign; // means the array is not in our stack frame as it was passed to our function (cannot compute from rbp)
  }

  toAssembly(symbolTable) {
    if (!this.foreign) {
      const address = (symbolTable[this.name] + this.index * INT_SIZE) * -1;
      return `DWORD PTR [rbp - ${address}]`;
    } else {
      // TODO: refactor me so that ArrayElement doesn't return either a list of instructions or an operand
      // TODO: refactor me so that this.index isn't either a number or a variable name
      const baseAddress = symbolTable[this.name] * -1;
      const indexAddress = symbolTable[this.index] * -1;
      return {
        preInstructions: [
          `mov rcx, DWORD PTR [rbp - ${baseAddress}]`,
          `mov rdx, DWORD PTR [rbp - ${indexAddress}]`,
          `mov rdx, DWORD PTR [rcx + 4*rdx]`
        ],
          resultOperand: 'rdx'
        }
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
    const d = new Assignment({
      destination: new Operand({type: "variable", value: this.variableName}),
      operand: new Operand({type: "register", value: argumentRegisters[this.order]})
    });
    return d.toAssembly(symbolTable);
  }
}

class Declaration extends Node {
  constructor({destination, operand}) {
    super();
    this.destination = destination;
    this.operand = operand;
  }

  toAssembly(symbolTable) {
    const a = new Assignment({
      destination: this.destination,
      operand: this.operand
    });
    return a.toAssembly(symbolTable);
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
      "<": "cmp",
      "==": "cmp",
      "<=": "cmp",
      ">=": "cmp"
    };

    if (!(this.operator in operatorToInstruction)) {
      throw `Operator ${this.operator} is not supported`
    }

    const op1 = this.operand1.toAssembly(symbolTable);
    const op2 = this.operand2.toAssembly(symbolTable);

    let instructions = [
      `mov eax, ${op1}`
    ];

    // TODO: refactor this preInstruction business
    if (op2.preInstructions) {
      instructions = instructions.concat(op2.preInstructions);
      instructions.push(`${operatorToInstruction[this.operator]} eax, ${op2.resultOperand}`)
    } else {
      instructions.push(`${operatorToInstruction[this.operator]} eax, ${op2}`)
    }

    return instructions;
  }
}

class Assignment extends Node {
  constructor({destination, operand}) {
    super();
    this.destination = destination;
    this.operand = operand; // TODO: rename this to something like expression
  }

  toAssembly(symbolTable) {
    const destination = this.destination.toAssembly(symbolTable);

    if(this.operand instanceof BinaryExpression || this.operand instanceof FunctionCall){
      // binaryExpression stores result in eax; so move eax into destination variable
      let instructions = [
        this.operand.toAssembly(symbolTable),
        `mov ${destination}, eax`
      ].flat();
      return instructions;
    } else if (this.operand instanceof Operand) {
        if(this.operand.type === 'immediate' || this.operand.type === 'register') {
          return `mov ${destination}, ${this.operand.toAssembly(symbolTable)}`;
        }

        return [
          `mov eax, ${this.operand.toAssembly(symbolTable)}`,
          `mov ${destination}, eax`
        ];
    } else if (this.operand instanceof ArrayElement) {
      const arr = this.operand.toAssembly(symbolTable);
      return [
        arr.preInstructions,
        `mov ${destination}, ${arr.resultOperand}`
      ].flat();
    } else {
      throw `Invalid operand for assignment: ${this.operand}`;
    }
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

  constructor({declaration, condition, update, statements, id}) {
    super();
    this.declaration = declaration;
    this.condition = condition;
    this.update = update;
    this.statements = statements;
    this.id = id;
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
    const loopId = this.id;

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

class If extends Node {
  constructor({condition, statements, id}) {
    super();
    this.condition = condition;
    this.statements = statements;
    this.id = id;
  }
  toAssembly(symbolTable) {
    const childInstructions = this.statements.map(s => s.toAssembly(symbolTable)).flat();
    const jumpOperations = {
      "<": "jge",
      ">": "jle",
      "==": "jne",
      "<=": "jg",
      ">=": "jl"
    };
    const ifId = this.id;
    const operator = jumpOperations[this.condition.operator];
    let instructions = [
      this.condition.toAssembly(symbolTable),
      `${operator} .LABEL_IF_${ifId}_END`,
      childInstructions,
      `.LABEL_IF_${ifId}_END:`
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

class FunctionCall extends Node {
  constructor({functionName, args}) {
    // functionName: name of the function being called
    // args: Array<CallerArgument> // operand b/c can be variable, address, or immediate
    super();
    this.functionName = functionName;
    this.args = args;
  }
  toAssembly(symbolTable) {
    // load arguments from memory or immediate to registers
    const argumentInstructions = this.args.map(a => a.toAssembly(symbolTable)).flat();
    const argumentDataTypes = this.args.map(a => a.dataType);
    const types = argumentDataTypes.join(",");
    const instructions = [
      argumentInstructions,
      `call ${this.functionName}(${types})`
    ].flat();
    return instructions;
  }
}

class Function extends Node {
  constructor({name, args, statements}) {
    // args: Array<Argument>
    // statements: Array<Node>
    super();
    this.name = name;
    this.args = args;
    this.statements = statements;
  }

  toAssembly(symbolTable) {
    if (!symbolTable) {
      throw "Symbol table missing"
    }

    let instructions = [
      `${this.name}():`,
      "push rbp",
      "mov rbp, rsp",
      this.allocateMemory()
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

  allocateMemory() {
    const argBytes = this.args.length * 4; // number of args * 4 bytes per arg

    // recursively counts declarations in function statements
    const countDeclarations = (statements) => {
      let count = 0;
      statements.forEach((s) => {
        if (s instanceof Declaration) { count += 1; }
        if (s instanceof ArrayDeclaration) { count += s.size; }
        if (s instanceof ForLoop) {
          count += 1 // for its declaration
          count += countDeclarations(s.statements)
        }
        if (s instanceof If) {
          count += countDeclarations(s.statements)
        }
      });

      return count;
    }

    const declarationCount = countDeclarations(this.statements);
    const totalBytes = argBytes + declarationCount * 4;
    return `sub rsp, ${totalBytes}`;
  }
}

// Only supports array of integers
// int a[3] = {1, 2, 3};
// mov dword ptr [rbp - 12], 1
// mov dword ptr [rbp - 8], 2
// mov dword ptr [rbp - 4], 3
class ArrayDeclaration extends Node {
  constructor({destination, size, values}) {
    super();
    this.destination = destination;
    this.size = size;
    this.values = values;
  }

  toAssembly(symbolTable) {
    const baseAddress = symbolTable[this.destination];
    let instructions = this.values.map((value, index) => {
       const address = (baseAddress + index * INT_SIZE) * -1;
       const element = new ArrayElement({name: this.destination, "index": index, foreign: false}).toAssembly(symbolTable);
       return `mov ${element}, ${value}`
    });
    return instructions;
  }
}
