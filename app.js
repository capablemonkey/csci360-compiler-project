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
  const externalStorage = [];
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
  fillTable(table, externalStorage);
}

function compile(string) {
  const tokens = tokenize(string);
  const parser = new Parser(tokens);
  const parseTree = parser.parse();
  const functions = parseTree.functions;
  const tables = parseTree.tables;

  const assembly = functions.
    map((f, idx) => f.toAssembly(tables[idx])).
    flat();

  const output = assembly.join('\n');

  // cache testing
  const cache = new Cache({nway: 2, size: 4, k: 2, memory: null});
  cache.cache[0][0][0] = '11101010';
  console.log(cache.isCacheHit('11101010'))
  cache.printSnapshot();


  return {
    "parseTree": parseTree,
    "output": output,
    "tokens": tokens
  };
}

$(document).ready(function() {
  $('.button-compile').click(function(){
    const input = $('.editor-textbox').first().val();
    const {parseTree, output, tokens} = compile(input);

    $('#parse-tree').text(JSON.stringify(parseTree, null, 2));
    $('#assembly').text(output);
    toBinary(tokens, fillTable);
  })
})
