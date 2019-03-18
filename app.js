function compile(parseTree) {
  // sample function:
  let loopId = 1; // id variables initialized outside all functions 
  let ifId = 1; // value incremented with each new function
  const sumFunction = new Function({
    args: [
      new Argument({variableName: "num", order: 0, type: "int"})
    ],
    statements: [
      new Declaration({
        destination: new Operand({type: "variable", value: "sum"}),
        value: new Operand({type: "immediate", value: 0})
      }),
      new ForLoop({
        id: loopId++,
        declaration: new Declaration({
          destination: new Operand({type: "variable", value: "i"}),
          value: new Operand({type: "immediate", value: 0})
        }),
        condition: new BinaryExpression({
          operator: "<",
          operand1: new Operand({type: "variable", value: "i"}),
          operand2: new Operand({type: "variable", value: "num"})
        }),
        update: new Assignment({
          destination: new Operand({type: "variable", value: "i"}),
          binaryExpression: new BinaryExpression({
            operator: "+",
            operand1: new Operand({type: "variable", value: "i"}),
            operand2: new Operand({type: "immediate", value: "1"})
          })
        }),
        statements: [
          new Assignment({
            destination: new Operand({type: "variable", value: "sum"}),
            binaryExpression: new BinaryExpression({
              operator: "+",
              operand1: new Operand({type: "variable", value: "sum"}),
              operand2: new Operand({type: "variable", value: "i"})
            })
          })
        ],
      }),
      new Return({operand: new Operand({type: "variable", value: "sum"})})
    ]
  });

  const symbolTable = {
    "num": -4,
    "sum": -8,
    "i": -12
  }

  const assembly = sumFunction.toAssembly(symbolTable);
  return assembly;
}

function parse(sourceCode) {
  const sourceLines = sourceCode.
    split("\n").
    map(l => $.trim(l));
  const analyzer = new SourceAnalyzer(sourceLines);
  const parseTree = analyzer.getAnalysis();
  return parseTree;
}

//Formats the data in an array of 1024 strings into an 8x128 table
//then inserts the HTML code into element
function fillTable(table, data){
  let text = "<tr>";
  for(let i=0; i<1024; i++){
    text += "<td>" + i + "</td>";
    text += "<td>" + data[i] + "</td>";
    if(i%8 === 7)
      text += "</tr><tr>";  //New row
  }
  text += "</tr>";
  table.innerHTML = text;
}

//Converts input to ASCII binary and populates
//the source code part of the External Storage
function toBinary(sourceCode, fillTable){
  const table = document.getElementById('external-source');
  const externalStorage = new Array(1024);
  for(let i=0; i<sourceCode.length; i++){
    binaryChar = sourceCode.charCodeAt(i).toString(2);
    externalStorage[i] = binaryChar.padStart(8,"0");
  }
  externalStorage.fill("00000000", sourceCode.length);
  fillTable(table, externalStorage);
}

$(document).ready(function() {
  $('.button-compile').click(function(){
    const input = $('.editor-textbox').first().val();
    const parseTree = parse(input);

    $('#parse-tree').text(JSON.stringify(parseTree, null, 2));

    const assembly = compile(parseTree);
    $('#assembly').text(assembly.join("\n"));

    toBinary(input,fillTable);
  })
})
