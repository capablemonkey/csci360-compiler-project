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

// displays the registers
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

// displays the cache
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

function fillStatistics(table, cache) {
  let text = "<tr><td> Miss Rate </td></tr>";
  text += "<tr><td> " + cache.getMissRate() + "</td></tr>";
  text += "<tr><td> Replacement Rate </td></tr>";
  text += "<tr><td> " + cache.getReplacementRate() + "</td></tr>";
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
  });
  $('.button-initialize').click(function(){ // initialize computer object here
    const cacheSpecs = {
      nway: $('#nway').first().val(),
      size: $('#cache-size').first().val(),
      blockSize: $('#block-size').first().val(),
    }
  });
  $('.button-step').click(function(){
    step();
    // This should be all be in a computer object
    //const cpu = new CPU();
    //const registers = cpu.registers;
    //const cache = new Cache();
    //fillStatistics(document.getElementById('statistics', cache))
    //fillRegisters(document.getElementById('registers'), registers);
    //fillCache(document.getElementById('cache'), cache.cache);
    //fillMemory(document.getElementById('memory'), );
  });
  
})
