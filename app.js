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

function fillRegisters(table, registers) {
  let text = "<tr>";
  const keys = Object.keys(registers);
  for (let i = 0; i < keys.length; i++) {
    const reg = keys[i];
    text += "<td>" + reg + " : " + registers[key] + "</td>";
    text += "</tr><tr>";
  }
  text += "</tr>";
  table.innerHTML = text;
}

function fillCache(table, cache) {
  let text = "<tr>";
  for (let r = 0; r < cache[0].length; r++) {
    for (let s = 0; s < cache.length; i++) {
      for (let b = 0; b < cache[s][r].length; b++) {
        text += "<td>" + cache[s][r][b] + "  </td>";
      }
      text += "<td>    </td>"; // gap between sets
    }
    text += "</tr><tr>";
  }
  text += "</tr>";
  table.innerHTML = text;
}

// not sure how memory is structured so 
function fillMemory(table, memory) {

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

function toTable(sourceCode, fillTable){
  const table = document.getElementById('external-source');
  fillTable(table, externalStorage);
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

function step(computer) {
  computer.cpu.step();
}

$(document).ready(function() {
  $('.button-compile').click(function(){
    const input = $('.editor-textbox').first().val();
    const tokens = tokenize(input);
    const externalStorage = [];
    toASCII(tokens, externalStorage);
    const {parseTree, output} = compile(tokens);
    fillTable(document.getElementById('external-source'), externalStorage);
    // This should be all be in a computer object
    //const cpu = new CPU();
    //const registers = cpu.registers;
    //fillRegisters(document.getElementById('registers'), registers);
    //const cache = new Cache();
    //fillCache(document.getElementById('cache'), cache.cache);
    //fillMemory(document.getElementById('memory'), );
    $('#parse-tree').text(JSON.stringify(parseTree, null, 2));
    $('#assembly').text(output);
  })
  $('.button-step').click(function(){
    step();
    // This should be all be in a computer object
    //const cpu = new CPU();
    //const registers = cpu.registers;
    //fillRegisters(document.getElementById('registers'), registers);
    //const cache = new Cache();
    //fillCache(document.getElementById('cache'), cache.cache);
    //fillMemory(document.getElementById('memory'), );
  })
})
