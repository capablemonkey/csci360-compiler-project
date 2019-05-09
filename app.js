//Formats the data in an array of 1024 strings into an 8x128 table
//then inserts the HTML code into element
function fillTable(table, data){
  let text = "<tr>";
  for(let i=0; i<2048; i++){
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
function toASCII(sourceCode, externalStorage) {
  sourceCode.forEach(function(element){
    if(element === 'int' || element === 'return'){
      element += ' ';
    }
    for(let i=0; i<element.length; i++){
      binaryChar = element.charCodeAt(i).toString(2);
      externalStorage.push(binaryChar.padStart(8,"0"));
    }
  });
  while(externalStorage.length < 1024)
    externalStorage.push('00000000');
}

function compile(tokens) {
  const parser = new Parser(tokens);
  const parseTree = parser.parse();
  const functions = parseTree.functions;
  const tables = parseTree.tables;

  const assembly = functions.
    map((f, idx) => f.toAssembly(tables[idx])).
    flat();

  const output = assembly.join('\n');

  return {
    "parseTree": parseTree,
    "output": output,
    "tokens": tokens
  };
}

$(document).ready(function() {
  $('.button-compile').click(function(){
    const input = $('.editor-textbox').first().val();
    const tokens = tokenize(input);
    const asciiStorage = [];
    toASCII(tokens, asciiStorage);
    const {parseTree, output} = compile(tokens);
    const LabelTable = {};
    const allInstructions = parseAss(output,LabelTable);
    const machineCodeStorage = translateInstructions(allInstructions, LabelTable);
    const externalStorage = [].concat(asciiStorage, machineCodeStorage);
    fillTable(document.getElementById('external-source'), externalStorage);

    $('#parse-tree').text(JSON.stringify(parseTree, null, 2));
    $('#assembly').text(output);
  })
})
