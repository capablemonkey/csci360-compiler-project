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

// displays the registers
function fillRegisters(table, registers) {
  let text = "<tr>";
  const keys = Object.keys(registers);
  for (let i = 0; i < keys.length; i++) {
    const reg = keys[i];
    text += "<td>" + reg + "</td><td>" + registers[reg] + "</td>";
    text += "</tr><tr>";
  }
  text += "</tr>";
  table.innerHTML = text;
}

// displays the cache
function fillCache(table, cache) {
  let text = "<tr>";
  const rows = cache[0].length;
  const sets = cache.length;
  const blocks = cache[0][0].length;
  for (let r = 0; r < rows; r++) { //  1 1    0 0
    for (let s = 0; s < sets; s++) {  //  1 1    0 0
      for (let b = 0; b < blocks; b++) {
        text += "<td>" + cache[s][r][b].data + "  </td>";
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
  let text = '<tr><th>address</th><th>binary</th><th>dec</th></tr>';
  for (let i = 0; i < memory.length; i+=32) {
    const address = i/8;
    const binary = memory.substring(i, i+32);
    const dec = parseInt(binary, 2);
    text += `<tr><td>${address}</td><td>${binary}</td><td>${dec}</td></tr>`
  }
  table.innerHTML = text;
}

// not sure how memory is structured so 
function fillStack(table, stack) {
  let text = '';
  for (let i = 0; i < stack.length; i++) {
    text += "<tr><td>" + stack[i] + "  </td></tr>";
  }
  table.innerHTML = text;
}

function fillStatistics(table, cache) {
  let text = "<tr><td> Miss Rate: </td>";
  text += "<td> " + cache.getMissRate() + "</td></tr>";
  text += "<tr><td> Replacement Rate: </td>";
  text += "<td> " + cache.getReplacementRate() + "</td></tr>";
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

let computer = new Computer({ labelTable: {}, nway: 1, size: 2, k: 2 });

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
    const labelTable = {};
    const allInstructions = parseAss(output,labelTable);
    const machineCodeStorage = translateInstructions(allInstructions, labelTable);
    const externalStorage = [].concat(asciiStorage, machineCodeStorage);
    fillTable(document.getElementById('external-source'), externalStorage);

    $('#parse-tree').text(JSON.stringify(parseTree, null, 2));
    $('#assembly').text(output);
  });
  $('.button-initialize').click(function(){ // initialize computer object here
    const cacheSpecs = {
      nway: Number.parseInt($('#nway').first().val().trim()),
      size: Number.parseInt($('#cache-size').first().val().trim()),
      blockSize: Number.parseInt($('#block-size').first().val().trim()),
    };
    const code = $('.editor-textbox').first().val();
    const tokens = tokenize(code);
    const {parseTree, output} = compile(tokens);
    const labelTable = {}
    const allInstructions = parseAss(output,labelTable);
    const machineCodeStorage = translateInstructions(allInstructions, labelTable).join("");
    computer = new Computer({ 
      labelTable: labelTable,
      nway: cacheSpecs.nway,
      size: cacheSpecs.size,
      k: cacheSpecs.blockSize,
    });
    computer.loadProgram(machineCodeStorage);
    computer.start();
  });
  $('.button-step').click(function(){
    step(computer);
    
    fillStatistics(document.getElementById('statistics'), computer.cpu.memory);
    fillRegisters(document.getElementById('registers'), computer.cpu.registers);
    fillCache(document.getElementById('cache'), computer.cpu.memory.cache);
    fillMemory(document.getElementById('memory'), computer.physicalMemory.storage);
    fillStack(document.getElementById('stack'), computer.cpu.stack);
    $("#current-instruction").text(computer.cpu.currentInstruction);
  });
})
