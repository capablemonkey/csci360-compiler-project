//Removes unnecessary whitespaces and newlines
//Maybe makes parsing easier or more robust
function tokenize(sourceCode){
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
  const numbers = "1234567890";
  let tokensArray = [];
  let token = "";
  sourceCode.trimStart();
  sourceCode.trimEnd();
  for(let i=0; i<sourceCode.length; i++){
    if(alphabet.includes(sourceCode[i])){
      //It's a letter
      token += sourceCode[i];
      if(!alphabet.includes(sourceCode[i+1])){
        //The next char is not a letter
        tokensArray.push(token);
        token = "";
      }
    }
    else if(numbers.includes(sourceCode[i])){
      //It's a number
      token += sourceCode[i];
      if(!numbers.includes(sourceCode[i+1])){
        //The next char is not a number
        tokensArray.push(token);
        token = "";
      }
    }
    else if(sourceCode[i] != ' ' && sourceCode[i] != '\n' && sourceCode[i] != ',')
        //It's a symbol
        if(sourceCode[i+1] === '='){
          tokensArray.push(sourceCode[i] + '=');
          i++;
        }
        else
          tokensArray.push(sourceCode[i]);
  }
  return tokensArray;
}

function isNumber(string) {
  if (string.length == 0) { return false; }
  const nan = isNaN(Number(string))
  return !nan;
}

// group array components in an assignment line and return the modified assignment line 
function groupArray(assignmentLine) {
  let stk = [];
  // treat back of array like a stack
  // go from the front of the assignment line
  // if we see [ then push to the array
  // until we see ] we add elements of the line to between 
  let between = '';
  for (let i = 0; i < assignmentLine.length; i++) {
    let curr = assignmentLine[i];
    if (curr == ']') {
      stk[stk.length-1] += between + curr;
      stk[stk.length-2] = stk[stk.length-2] + stk[stk.length-1];
      stk.pop();
      between = '';
    } else if (curr == '[') {
      stk.push(curr);
    } else {
      if (stk.length && stk[stk.length-1] == '[')
        between += curr;
      else
        stk.push(curr);
    }
  } return stk;
}

// Splits an grouped array into its name and index
function splitArray(string) {
  let between = '';
  let stk = [];
  for (let i = 0; i < string.length; i++) {
    if (string[i] == '[') {
      stk.push(between);
      between = '';
    } else if (string[i] == ']')
      stk.push(between);
    else
      between += string[i];
  } return stk;
}

function parseOperand(string) {
  if (isNumber(string)) {
    return new Operand({type: "immediate", value: Number(string)});
  }
  let between = splitArray(string);
  if (between.length)// if is array, only supports 1 dimensional arrays
    return new ArrayElement({name: between[0], index: between[1], foreign: true});
  else
    return new Operand({type: "variable", value: string});
}

class Parser {
  constructor(sourceCode){
    this.declarations = 0;
    this.source = sourceCode;
    this.symbolTable = [];
    this.functions = [];
    this.tables = [];

    this.loopCount = 0;
    this.ifCount = 0;
  }

  makeDeclaration(declarationLine){
    //int i = 0
    if(declarationLine[2] === '='){
      if(Number(declarationLine[3]) != Number.NaN){
        this.declarations++;
        this.symbolTable[declarationLine[1]] = -(this.declarations*4);
        return new Declaration({
          destination: new Operand({type: "variable", value: declarationLine[1]}),
          operand: new Operand({type: "immediate", value: declarationLine[3]})
        });
      }
      // int i = f(a)
      if (declarationLine.includes('(')) {
        return new Declaration({
          destination: parseOperand(declarationLine[1]),
          operand: new FunctionCall({
            functionName: declarationLine[3],
            args: [
              new CallerArgument({
                value: declarationLine[5],
                type: "address",
                order: 0,
                dataType: "int *"
              })
            ]
          })
        })
      }
      //int i = x
      else{
        this.declarations++;
        this.symbolTable[declarationLine[1]] = -(this.declarations*4);
        return new Declaration({
          destination: new Operand({type: "variable", value: declarationLine[1]}),
          operand: new Operand({type: "variable", value: declarationLine[3]})
        });
      }
    }
    //int i[3] = {0,1,2}
    else if(declarationLine[2] === '['){
      let arrayValues = declarationLine.slice(7,declarationLine.length-1);
      const arrayName = declarationLine[1];
      const arraySize = Number(declarationLine[3]);

      while(arrayValues.length < arraySize){
        arrayValues.push('0');
      }

      this.declarations += arraySize;
      this.symbolTable[arrayName] = -((this.declarations)*4);

      return new ArrayDeclaration({
        destination: declarationLine[1],
        size: arraySize,
        values: arrayValues
      });
    }
  }

  makeAssignment(assignmentLine){
    assignmentLine = groupArray(assignmentLine); // if there is an array group it
    //i = 1 || i = x
    if(assignmentLine[1] === '='){
      if(assignmentLine.length === 3){
        return new Assignment({
          destination: parseOperand(assignmentLine[0]),
          operand: parseOperand(assignmentLine[2])
        });
      }
      //i = a + b || i = a + 1
      if ('+-'.includes(assignmentLine[3])){
        return new Assignment({
          destination: parseOperand(assignmentLine[0]),
          operand: new BinaryExpression({
            operator: assignmentLine[3],
            operand1: parseOperand(assignmentLine[2]),
            operand2: parseOperand(assignmentLine[4]),
          })
        });
      }

      // i = f(a)
      if (assignmentLine.includes('(')) {
        return new Assignment({
          destination: parseOperand(assignmentLine[0]),
          operand: new FunctionCall({
            functionName: assignmentLine[2],
            args: [
              new CallerArgument({
                value: assignmentLine[4],
                type: "address",
                order: 0,
                dataType: "int *"
              })
            ]
          })
        })
      }
    }
    //i++ || i--
    else if(assignmentLine[1] === assignmentLine[2]){
      return new Assignment({
        destination: new Operand({type: 'variable', value: assignmentLine[0]}),
        operand: new BinaryExpression({
          operator: assignmentLine[1],
          operand1: new Operand({type: 'variable', value: assignmentLine[0]}),
          operand2: new Operand({type: 'immediate', value: 1}),
        }),
      })
    }
    //else syntaxError
  }

  makeIfStatement(condition, statements){
    condition = groupArray(condition)
    return new If({
      condition: new BinaryExpression({
        operator: condition[1],
        operand1: parseOperand(condition[0]),
        operand2: parseOperand(condition[2])
      }),
      statements: this.readStatements(statements),
      id: this.ifCount++
    });
  }

  makeForLoop(header, statements){
    let init = [];
    let term = [];
    let inc = [];
    let semicolonIndex;
    for(let i=0; i<header.length; i++){
      if(header[i] != ';')
        init.push(header[i]);
      else {
        header.splice(0, i+1);
        break;
      }
    }
    for(let i=0; i<header.length; i++){
      if(header[i] != ';')
        term.push(header[i]);
      else {
        header.splice(0, i+1);
        break;
      }
    }
    for(let i=0; i<header.length; i++) {
      inc.push(header[i]);
    }

    return new ForLoop({
      declaration: this.makeDeclaration(init),
      condition: new BinaryExpression({
        operator: term[1],
        operand1: new Operand({type: 'variable', value: term[0]}),
        operand2: parseOperand(term[2])
      }),
      update: this.makeAssignment(inc),
      statements: this.readStatements(statements),
      id: this.loopCount++
    });
  }

  readStatements(source){
    let instruction = [];
    while (source.length > 0) {
      let keyword = source[0];
      switch(keyword){
        case 'int':{
          let declarationLine = [];
          let semicolonIndex;
          for(let i=0; i<source.length; i++){
            if(source[i] != ";")
              declarationLine.push(source[i]);
            else{
              semicolonIndex = i;
              break;
            }
          }
          source.splice(0,semicolonIndex+1);
          instruction.push(this.makeDeclaration(declarationLine));
          break;
        }
        case 'if':{
          let condition = [];
          let statements = [];
          if(source[1] === '('){
            for(let i=2; i<source.length; i++){
              if(source[i] != ')')
                condition.push(source[i]);
              else {
                source.splice(0,i+1);
                break;
              }
            }
          }
          //else syntaxError
          if(source[0] === '{'){
            let curlyBraces = 0;
            for(let i=1; i<source.length; i++){
              if(source[i] === '{')
                curylBraces++;
              else if(source[i] === '}'){
                if(curlyBraces > 0)
                  curlyBraces--;
                else{
                  statements = source.slice(1,i);
                  source.splice(0,i+1);
                  break;
                }
              }
            }
          }
          //else syntaxError
          instruction.push(this.makeIfStatement(condition, statements));
          break;
        }
        case 'for':{
          let header = [];
          let statements = [];
          if(source[1] === '('){
            for(let i=2; i<source.length; i++){
              if(source[i] != ')')
                header.push(source[i]);
              else {
                source.splice(0,i+1);
                break;
              }
            }
          }
          //else syntaxError
          if(source[0] === '{'){
            let curlyBraces = 0;
            for(let i=1; i<source.length; i++){
              if(source[i] === '{')
                curlyBraces++;
              else if(source[i] === '}')
                if(curlyBraces > 0)
                  curlyBraces--;
                else{
                  statements = source.slice(1,i);
                  source.splice(0,i+1);
                  break;
                }
              }
            }
          //else syntaxError
          instruction.push(this.makeForLoop(header,statements));
          break;
        }
        case 'return':{
          instruction.push(new Return({operand: parseOperand(source[1])}));
          source.splice(0,3);
          break;
        }
        default:{
          let statement = [];
          for(let i=0; i<source.length; i++){
            if (source[i] != ';') {
              statement.push(source[i]);
            } else {
              source.splice(0,i+1);
              break;
            }
          }
          instruction.push(this.makeAssignment(statement));
          break;
        }
      }
    }
    return instruction;
  }

  makeFunction() {
    //int funcName(int x, int a[5], int y, int z)
    const funcName = this.source[1];
    let funcArgs = [];
    let funcStatements = [];
    if(this.source[2] === '('){
      let currentOrder = 0;
      for(let i=3; i<this.source.length; i+=2){
        if(this.source[i] != ')'){
          this.declarations++;
          this.symbolTable[this.source[i+1]] = -(this.declarations*4);
          funcArgs.push(new Argument({
            variableName: this.source[i+1],
            order: currentOrder
          }));
          currentOrder++;
          if(this.source[i+2] === '[')
            i+=3;
        }
        else{
          this.source.splice(0,i+1);
          break;
        }
      }
    }
    let functionCode;
    if(this.source.shift() === '{'){
      let openBraces = 0;
      for(let i=0; i < this.source.length; i++){
        if(this.source[i] === '{')
          openBraces++;
        else if(this.source[i] === '}'){
          if(openBraces > 0)
            openBraces--;
          else{
            functionCode = this.source.slice(0,i);
            this.source.splice(0,i+1);
            break;
          }
        }
      }
    }
    //else syntaxError;
    funcStatements = this.readStatements(functionCode);
    const fn = new Function({
      name: funcName,
      args: funcArgs,
      statements: funcStatements
    });
    this.functions.push(fn);
    this.tables.push(this.symbolTable);
    this.symbolTable = [];
    this.declarations = 0;
  }

  parse() {
    while(this.source.length > 0){
      this.makeFunction();
    }
    return this;
  }
}
