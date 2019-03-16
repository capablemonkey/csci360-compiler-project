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

class parser{
  constructor(sourceCode){
    this.declaration = 1;
    this.source = sourceCode;
    this.symbolTable = [];
    this.functionClass = {
        "returnType": "",
        "functionName": "",
        "parameter": {
            "type": "",
            "name": ""
        },
        "instruction":[]
  }
}
  makeDeclaration(declarationLine){
    //int i = 0
    if(declarationLine[2] === '='){
      if(Number(declarationLine[3]) != Number.NaN){
        this.declaration++;
        this.symbolTable[declarationLine[1]] = -(this.declaration*4);
        const obj = new Declaration({
          destination: new Operand({type: "variable", value: declarationLine[1]}),
          value: new Operand({type: "immediate", value: declarationLine[3]})
        });
        return obj;
      }
      //int i = x
      else{
        this.declaration++;
        this.symbolTable[declarationLine[1]] = -(this.declaration*4);
        const obj = new Declaration({
          destination: new Operand({type: "variable", value: declarationLine[1]}),
          value: new Operand({type: "variable", value: declarationLine[3]})
        });
        return obj;
      }
    }
    //int i[3] = {0,1,2}
    else if(declarationLine[2] === '['){
      let arrayValues = declarationLine.slice(7,declarationLine.length-1);
      while(arrayValues.length < Number(declarationLine[3])){
        arrayValues.push('0');
      }
      for(let i=0; i<arrayValues.length; i++){
        this.declaration++;
        let symbolName = `${declarationLine[1]}[${i}]`;;
        this.symbolTable[symbolName] = -(this.declaration*4);
      }
      const obj = new ArrayDeclaration({
        destination: declarationLine[1],
        values: arrayValues
      });
      obj.toAssembly(this.symbolTable);
      return obj;
    }
  }

  makeAssignment(assignmentLine){
    //i = 1 || i = x
    if(assignmentLine[1] === '='){
      if(assignmentLine.length === 3){
        let opType;
        if(Number(source[2]) === Number.NaN)
          opType = 'variable';
        else
          opType = 'immediate';
        if(assignmentLine[1] === '='){
          const obj = new Assignment({
            desination: new Operand({type: "variable", value: assignmentLine[0]}),
            operand: new Operand({type: opType, value: assignmentLine[3]})
          });
          return obj;
        }
      }
      //i = a + b || i = a + 1
      if('+-'.includes(assignmentLine[3])){
        let op1Type;
        if(Number(assignmentLine[2]) === Number.NaN)
          op1Type = 'variable';
        else
          op1Type = 'immediate';
        let op2Type;
        if(Number(assignmentLine[4]) === Number.NaN)
          op2Type = 'variable';
        else
          op2Type = 'immediate';
        const obj = new Assignment({
          destination: new Operand({type: 'variable', value: assignmentLine[0]}),
          operand: new BinaryExpression({
            operator: assignmentLine[3],
            operand1: new Operand({type: op1Type, value: assignmentLine[2]}),
            operand2: new Operand({type: op2Type, value: assignmentLine[4]}),
          }),
        });
        return obj;
      }
    }
    //i++ || i--
    else if(assignmentLine[1] == assignmentLine[2]){
      const obj = new Assignment({
        destination: assignmentLine[0],
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
    let op1Type;
    if(Number(condition[0]) === Number.NaN)
      op1Type = 'variable';
    else
      op1Type = 'immediate';
    let op2Type;
    if(Number(condition[2]) === Number.NaN)
      op2Type = 'variable';
    else
      op2Type = 'immediate';
    const obj = new If({
      condition: new BinaryExpression({
        operator: condition[1],
        operand1: new Operand({type: opType1, value: condition[0]}),
        operand2: new Operand({type: opType2, value: condition[2]})
      }),
      statements: this.readInstruction(statements)
    });
    return obj;
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
    for(let i=0; i<header.length; i++)
      inc.push(header[i]);
      let opType;
      if(Number(term[2]) === Number.NaN)
        opType = 'variable';
      else
        opType = 'immediate';
      const obj = new ForLoop({
      declaration: this.makeDeclaration(init),
      condition: new BinaryExpression({
        operator: term[1],
        operand1: new Operand({type: 'variable', value: term[0]}),
        operand2: new Operand({type: opType, value: term[2]})
      }),
      update: this.makeAssignment(inc),
      statements: this.readInstruction(statements)
    });
    return obj;
  }

  readInstruction (source) {
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
          let opType;
          if(Number(source[1]) === Number.NaN)
            opType = 'variable';
          else
            opType = 'immediate';
          instruction.push(
            new Return({
              operand: new Operand({
                type: opType,
                value: source[1]
              })
            })
          );
          source.splice(0,3);
          break;
        }
        default:{
          let statement = [];
          for(let i=0; i<source.length; i++){
            if(source[i] != ';')
              statement.push(source[i]);
            else{
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

  // Wrapper function called to generate analyzed code
  getAnalysis () {
      this.functionClass.returnType = this.source[0];
      this.functionClass.functionName = this.source[1];
      if(this.source[2] === '('){
        this.functionClass.parameter = {
          "type": this.source[3],
          "name": this.source[4],
          "codeType": "declaration",
          "address": -(this.declaration*4)
        };
        this.symbolTable[this.functionClass.parameter.name]
        = this.functionClass.parameter.address;
        this.source.splice(0,6);
      }
      let functionCode;
      if(this.source.shift() === '{'){
        let openBraces = 0;
        let endBraceIndex;
        for(let i=0; i < this.source.length; i++){
          if(this.source[i] === '{')
            openBraces++;
          else if(this.source[i] === '}'){
            if(openBraces > 0)
              openBraces--;
            else{
              endBraceIndex = i;
              break;
            }
          }
        }
      functionCode = this.source.slice(0,endBraceIndex);
      this.source.splice(0,endBraceIndex+1);
      }
      //else syntaxError;
      console.log(functionCode);
      this.functionClass.instruction = this.readInstruction(functionCode);
      console.log(this.symbolTable);
      return this;
  }
}
