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
    else if(sourceCode[i] != ' ' && sourceCode[i] != '\n')
        //It's a symbol
        tokensArray.push(sourceCode[i]);
  }
  return tokensArray;
}

class parser{
  constructor(sourceCode){
    this.declaration = 1;
    this.source = tokenize(sourceCode);
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
  // Reads the function head of a function
  readHead(source) {
    let words = [];
    words[0] = source.shift(); //returnType
    words[1] = source.shift(); //functionName
    if(source.shift() === '('){//(
      words[2] = source.shift();//type
      words[3] = source.shift();//name
    }
    if(source.shift() === ')') //)
      return words;
    //else syntaxError
  }

  readDeclaration(declarationLine){          //pass to declaration function
    if(declarationLine[2] === '='){
      this.declaration++;
      let obj = {
        "codeType": "declaration",
        "dataType": declarationLine[0],
        "dataName": declarationLine[1],
        "dataValue": declarationLine[3],
        "address": -(this.declaration*4)
      };
      return obj;
    }
    //else syntaxError
  }

  readLogic(logicLine){
    if(logicLine[1] === '=' && '+-*/'.includes(logicLine[3])){
      let obj = {
        "codeType": "logicOperation",
        "destination": logicLine[0],
        "operand1": logicLine[2],
        "operator": logicLine[3],
        "operand2": logicLine[4]
      };
      return obj;
    }
    //else syntaxError
  }

  readForLoop(header, content){
    let init = [];
    let term = [];
    let inc = [];
    let semicolonIndex;
    for(let i=0; i<header.length; i++){
      if(header[i] != ';')
        init.push(header[i]);
      else {
        semicolonIndex = i;
        break;
      }
    }
    header.splice(0, semicolonIndex+1);
    for(let i=0; i<header.length; i++){
      if(header[i] != ';')
        term.push(header[i]);
      else {
        semicolonIndex = i;
        break;
      }
    }
    header.splice(0, semicolonIndex+1);
    for(let i=0; i<header.length; i++)
      inc.push(header[i]);
    let obj = {
      "codeType": "for",
      "initialization": this.readDeclaration(init),
      "termination": term,
      "increment": this.readLogic(inc),
      "statement": []
    }
    obj.statement = this.readInstruction(content);
    return obj;
  }

  readInstruction (source) {
    let instruction = [];
    while (source.length > 0) {
        let keyword = source[0];
        switch(keyword){
          case 'int':
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
            instruction.push(this.readDeclaration(declarationLine));
            break;
          case 'for':
            let header = [];
            let content;
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
              let endBraceIndex;
              for(let i=1; i<source.length; i++){
                if(source[i] === '{'){
                  curlyBraces++;
                }
                else if(source[i] === '}'){
                  if(curlyBraces > 0)
                    curlyBraces--;
                  else{
                    endBraceIndex = i;
                    break;
                  }
                }
              }
              content = source.slice(1,endBraceIndex);
              source.splice(0,endBraceIndex+1);
            }
            //else syntaxError
            instruction.push(this.readForLoop(header,content));
            break;
          case 'return':
            let returnStatement = [];
            for(let i=0; i<source.length; i++){
              if(source[i] != ';')
                returnStatement.push(source[i]);
              else {
                source.splice(0,i+1);
                break;
              }
            }
            if(returnStatement.length === 2){
              instruction.push(`${returnStatement[0]} ${returnStatement[1]}`);
            }
            //else evaluate
            //instruction.push(returnStatement);
            break;

          default:
            let statement = [];
            for(let i=0; i<source.length; i++){
              if(source[i] != ';')
                statement.push(source[i]);
              else{
                source.splice(0,i+1);
                break;
              }
            }
            instruction.push(this.readLogic(statement));
            break;
      }
    }
    return instruction;
  }

  // Wrapper function called to generate analyzed code
  getAnalysis () {
      let head = this.readHead(this.source);
      this.functionClass.returnType = head[0];
      this.functionClass.functionName = head[1];
      this.functionClass.parameter = {
          "type": head[2],
          "name": head[3],
          "codeType": "declaration",
          "address": -(this.declaration*4)
      };
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
      console.log(functionCode);
      this.source.splice(0,endBraceIndex+1);
      }
      //else syntaxError
        this.functionClass.instruction = this.readInstruction(functionCode);
        return this.functionClass;
  }
}
