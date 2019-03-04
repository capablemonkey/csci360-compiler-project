class SourceAnalyzer { // HOW TO IMPORT CLASSES???
    constructor(source) {
        this.declaration = 1;
        this.source = source;
        // this.source = [ // replace this with parameter to make class robust to input
        //     "int total(int num){",
        //     "int sum=0;",
        //     "for(int i=0;i<num;i=i+1){",
        //     "sum=sum+a;",
        //     "}",
        //     "return sum;",
        //     "}"
        // ];
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
    readHead(line) { 
      let words = ["", "", "", ""];
      let i = 0;
      for (let j =  0; j < line.length; j++) {
          let char = line[j];
          if (char != ' ' && char != '(' && char != ')')
              words[i] = words[i] + char.toString();
          else {
              i++;
              if (char == ')')
                  break;
          }
      } return words;
    }
  
    // Reads a declaration of a datatype and assigns a address to it
    readDeclaration (line) {
      let words = ["", "", ""];
      let i = 0;
      for (let j = 0; j < line.length; j++) {
          let char = line[j];
          if (char != ' ' && char != '=' && char != ';')
              words[i] = words[i] + char.toString();
          else
              i++;
          
      }
      this.declaration++;
      let obj = {
          "codeType": "declaration",
          "dataType": words[0],
          "dataName": words[1],
          "dataValue": words[2],
          "address": -(this.declaration*4)
      };
      return obj;
    }
  
    readLogic (line) {
      let words = ["","","",""];
      let i = 0;
      for (let j = 0; j < line.length; j++) {
          let char = line[j];
          if (char == '+' || char == '-' || char == '/') {
              i++;
              words[i] = char.toString();
              i++;
          } else if (char != '=' && char != ';')
              words[i] = words[i] + char.toString();
          else
              i++;
      }
      let obj = {
          "codeType": "logicOperation",
          "destination": words[0],
          "operand1": words[1],
          "operator": words[2],
          "operand2": words[3]
      };
      return obj;
    }
  
    readForLoop(i, segment) {
      let line = segment[i];
      let header = line.substr(4, line.length-6).split(';');
      let obj = {
          "codeType": "for",
          "initialization": this.readDeclaration(header[0]+";"),
          "termination": header[1],
          "increment": this.readLogic(header[2]+";"),
          "statement": []
      }
      i++;
      let result = this.readInstruction(i, segment);
      obj.statement = result.statement;
      return {"i": result.i, "for": obj};
    }
  
    readInstruction (i, segment) {
      let instruction = [];
      while (i < segment.length) {
          let line = segment[i];
          if (line == "}")
              break;
          if (line.startsWith("int")) {
              instruction.push (this.readDeclaration (line));
              i++;
          } else if (line.startsWith("for")) {
              let result = this.readForLoop(i, segment);
              instruction.push (result.for);
              i = result.i;
          } else if (line.startsWith("return")) {
              instruction.push (line);
              i++;
          } else {
              instruction.push (this.readLogic (line));
              i++;
          }
      }
      return {"i": i+1, "statement": instruction};
    }
  
    // Wrapper function called to generate analyzed code
    getAnalysis () {
        let head = this.readHead(this.source[0]);
        this.functionClass.returnType = head[0];
        this.functionClass.functionName = head[1];
        this.functionClass.parameter = {
            "type": head[2],
            "name": head[3],
            "codeType": "declaration",
            "address": -(this.declaration*4)
        };
        // ignore the first line
        this.functionClass.instruction = this.readInstruction(1, this.source).statement;
        return this.functionClass;
    }
  }