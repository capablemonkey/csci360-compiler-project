// x = register
// y = memory
// z = immediate
// j = instruction
//
// lea register, memory
// [1000 1101][0000 1111][xxxx xxxx][yyyy yyyy]
// push register
// [0000 0110][xxxx xxxx][0000 0000][0000 0000]
// pop register
// [0000 0111][xxxx xxxx][0000 0000][0000 0000]
// ret
// [1100 0010][0000 0000 0000 0000 0000 0000]
// call instruction
// [1110 1000][jjjj jjjj jjjj jjjj jjjj jjjj]
//
// mov register, register
// [1000 1001][0000 0000][xxxx xxxx][xxxx xxxx]
// mov memory, register
// [1000 1001][1111 0000][yyyy yyyy][xxxx xxxx]
// mov register, memory
// [1000 1011][0000 1111][xxxx xxxx][yyyy yyyy]
// mov register, immediate
// [1100 0110][xxxx xxxx][zzzz zzzz zzzz zzzz]
// mov memory, immediate
// [1100 0111][yyyy yyyy][zzzz zzzz zzzz zzzz]
//
// add register, register
// [0000 0001][0000 0000][xxxx xxxx][xxxx xxxx]
// add register, immediate
// [0000 0101][xxxx xxxx][zzzz zzzz zzzz zzzz]
//
// sub register, register
// [0010 1001][0000 0000][xxxx xxxx][xxxx xxxx]
// sub register, immediate
// [0010 1101][xxxx xxxx][zzzz zzzz zzzz zzzz]
//
// cmp register, register
// [0011 1001][0000 0000][xxxx xxxx][xxxx xxxx]
// cmp register, memory
// [0011 1011][0000 1111][xxxx xxxx][yyyy yyyy]
// cmp register, immediate
// [0011 1101][xxxx xxxx][zzzz zzzz zzzz zzzz]
// cmp memory, register    //Not used
// [0011 1001][1111 0000][yyyy yyyy][xxxx xxxx]
//
// jmp instruction
// [1110 1001][jjjj jjjj jjjj jjjj jjjj jjjj]
// jg instruction
// [1000 1111][jjjj jjjj jjjj jjjj jjjj jjjj]
// jl instruction
// [1000 1100][jjjj jjjj jjjj jjjj jjjj jjjj]
// je instruction
// [1000 0100][jjjj jjjj jjjj jjjj jjjj jjjj]
// jge instruction
// [1000 1101][jjjj jjjj jjjj jjjj jjjj jjjj]
// jle instruction
// [1000 1110][jjjj jjjj jjjj jjjj jjjj jjjj]
// jne instruction
// [1000 0101][jjjj jjjj jjjj jjjj jjjj jjjj]
//
// Registers:
// 0000: eax
// 0001: ebx
// 0010: ecx
// 0011: edx
// 0100: esi
// 0101: edi
// 0110: rsp
// 0111: rbp
// 1000: pc


// Simple mapping of address => byte value for now until we have our
// fancier memory in place.
class Memory {
  constructor() {
    this.addressToByte = {};
  }

  // address is an integer
  // Dword is 4 bytes represented as a string of 1s and 0s
  getDword(address) {
    const word = [
      this.addressToByte[address],
      this.addressToByte[address + 1],
      this.addressToByte[address + 2],
      this.addressToByte[address + 3],
    ].join("");

    return word;
  }

  setDword(address, word) {
    this.addressToByte[address] = word.slice(0, 8);
    this.addressToByte[address + 1] = word.slice(8, 16);
    this.addressToByte[address + 2] = word.slice(16, 24);
    this.addressToByte[address + 3] = word.slice(24, 32);
  }
}

const BINARY_TO_REGISTER = {
  "0000": "eax",
  "0001": "ebx",
  "0010": "ecx",
  "0011": "edx",
  "0100": "esi",
  "0101": "edi",
  "0110": "rsp",
  "0111": "rbp",
  "1000": "pc"
}

// intToNBytes(1337, 2) => "0000010100111001"
function intToNBytes(integer, n) {
  return integer.toString(2).padStart(n * 8, "0");
}

class CPU {
  constructor() {
    // integer values:
    this.registers = {
      "eax": 0,
      "ebx": 0,
      "ecx": 0,
      "edx": 0,
      "esi": 0,
      "edi": 0,

      "pc": 0,
      "zf": 0,  //zero flag: set to 1 if cmp result equal, 1 if not equal
      "sf": 0,  //sign flag: set to 1 if cmp result is negative, 0 if positive
      // TODO: use ebp and esp because they are for 32 bit systems
      "rbp": 4096,
      "rsp": 4096,

      // TODO: r** registers are for x64... update compiler to use eax, ecx
      "rax": 0,
      "rcx": 0
    };
    this.startInstruction = 0;
    this.stack = [];
    this.memory = new Memory();
    this.currentInstruction = 'Program Start';
  }

  // instruction is a 32 bit instruction represented as a string of "1"s and "0"s
  // e.g. "01000000100000000010000000000000"
  execute(instruction, labelTable) {
    const operations = [
      this.lea,
      this.push,
      this.pop,
      this.call,
      this.ret,
      this.movRegisterToRegister,
      this.movImmediateToRegister,
      this.movMemoryToRegister,
      this.movArrayElementToRegister,
      this.movImmediateToMemory,
      this.movRegisterToMemory,
      this.addImmediate,
      this.addRegisters,
      this.subImmediate,
      this.subRegister,
      this.cmpRegister,
      this.cmpImmediate,
      this.cmpMemory,
      this.cmpArrayElement,
      this.jmp,
      this.jumpConditional
    ];

    // try all of the operations until one pattern is found:
    const found = operations.some((op) => op.apply(this, [instruction, labelTable]));

    if (!found) {
      throw new Error(`Encountered unknown instruction: ${instruction}`);
    }

    return true;
  }

  lea(instruction, labelTable){
    return this.checkMatch(/^1000110100001111(?<register>\d{4})(?<address>\d{12})$/, instruction, (values) => {
      const register = BINARY_TO_REGISTER[values["register"]];
      const address = this.registers['rbp'] + parseInt(values["address"], 2);

      this.currentInstruction = `lea ${register}, DWORD[rbp${parseInt(values["address"], 2)}]`;
      this.registers[registerNameA] = address;
    });
  }

  push(instruction labelTable){
    return this.checkMatch(/^000001100000(?<register>\d{4})0000000000000000$/, instruction, (values) => {
      const register = BINARY_TO_REGISTER[values["register"]];

      this.currentInstruction = `push ${register}`;
      this.stack.push(`${register}: ${this.registers[register]}`);
      this.registers['rsp'] -+ 4;
      setDword(this.registers['rsp'], intToBytes(this.registers[register], 32));
    });
  }

  pop(instruction, labelTable){
    return this.checkMatch(/^000001110000(?<register>\d{4})0000000000000000$/, instruction, (values) => {
      const register = BINARY_TO_REGISTER[values["register"]];

      this.currentInstruction = `pop ${register}`;
      this.stack.pop();
      this.registers[register] = getDword(this.registers['rsp']);
      this.registers['rsp'] += 4;
    });
  }

  call(instruction, labelTable){
    return this.checkMatch(/^11101000(?<instructionLocation>\d{24})$/, instruction, (values) => {
      const instructionLocation = parseInt(values["instructionLocation"], 2);
      const labelName = labelTable[instructionLocation];

      this.currentInstruction = `call ${labelName}`;
      this.stack.push(`Return Address: ${this.registers['pc']} \n ${labelName}`);
      this.registers['rsp'] -= 4;
      setDword(this.registers['rsp'], intToBytes(this.registers['pc'], 32));
      this.registers['pc'] = instructionLocation;
    });
  }

  ret(instruction, labelTable){
    return this.checkMatch(/^11000010000000000000000000000000$/, instruction, (values) => {

      this.currentInstruction = `ret`;
      this.stack.pop();
      this.registers['pc'] = getDword(this.registers['rsp']);
      this.registers['rsp'] += 4;
      if(this.stack.length === 0)
        //End of program
    });
  }

  movRegisterToRegister(instruction, labelTable) {
    return this.checkMatch(/^10001001000000000000(?<registerA>\d{4})0000(?<registerB>\d{4})$/, instruction, (values) => {
      const registerNameA = BINARY_TO_REGISTER[values["registerA"]];
      const registerNameB = BINARY_TO_REGISTER[values["registerB"]];

      this.currentInstruction = `mov ${registerNameA}, ${registerNameB}`;
      this.registers[registerNameA] = this.registers[registerNameB];
    });
  }

  movImmediateToRegister(instruction, labelTable) {
    return this.checkMatch(/^110001100000(?<register>\d{4})(?<immediate>\d{16})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const immediateInt = parseInt(values["immediate"], 2);

      this.currentInstruction = `mov ${registerName}, ${immediateInt}`;
      this.registers[registerName] = immediateInt;
    });
  }

  movMemoryToRegister(instruction, labelTable) {
    return this.checkMatch(/^1000101100001111(?<register>\d{4})(?<memory>\d{12})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const address = this.registers["rbp"] + parseInt(values["address"], 2);

      this.currentInstruction = `mov ${registerName}, DWORD[rbp${parseInt(values["address"], 2)}]`;
      const value = parseInt(getDword(address));
      this.registers[registerName] = value;
    });
  }

  movArrayElementToRegister(instruction, labelTable) {
    return this.checkMatch(/^100010111111(?<baseAddrRegister>\d{4})0000(?<register>\d{4})0000(?<offsetRegister>\d{4})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const address = this.registers[BINARY_TO_REGISTER[values["baseAddrRegister"].padStart(8,'0')]]
                    + (4*this.registers[BINARY_TO_REGISTER[values["offsetRegister"]]]);

      this.currentInstruction = `mov ${registerName}, DWORD[${BINARY_TO_REGISTER[values["baseAddrRegister"].padStart(8,'0')]}+4*
                                                            ${BINARY_TO_REGISTER[values["offsetRegister"]]}]`;
      const value = parseInt(getDword(address));
      this.registers[registerName] = value;
    });
  }

  movImmediateToMemory(instruction, labelTable) {
    return this.checkMatch(/^1111(?<address>\d{12})(?<immediate>\d{16})$/, instruction, (values) => {
      const address = this.registers["rbp"] + parseInt(values["address"], 2);
      const immediateBinary = values["immediate"].padStart(32,0);

      this.currentInstruction = `mov DWORD[rbp${parseInt(values["address"], 2)}], ${parseInt(values["immediate"], 2)}`;
      this.memory.setWord(address, immediateBinary);
    });
  }

  movRegisterToMemory(instruction, labelTable) {
    return this.checkMatch(/^1000100111110000(?<address>\d{12})(?<register>\d{4})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const address = this.registers["rbp"] + parseInt(values["address"], 2);

      this.currentInstruction = `mov DWORD[rbp${parseInt(values["address"], 2)}], ${registerName}`;
      const value = this.registers[registerName];
      this.memory.setDword(address, intToNBytes(value, 4));
    });
  }

  addImmediate(instruction, labelTable) {
    return this.checkMatch(/^000001010000(?<register>\d{4})(?<immediate>\d{16})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const immediateInt = parseInt(values["immediate"], 2);

      this.currentInstruction = `add ${registerName}, ${immediateInt}`;
      this.registers[registerName] += immediateInt;
    });
  }

  addRegisters(instruction, labelTable) {
    return this.checkMatch(/^00000001000000000000(?<registerA>\d{4})0000(?<registerB>\d{4})$/, instruction, (values) => {
      const registerNameA = BINARY_TO_REGISTER[values["registerA"]];
      const registerNameB = BINARY_TO_REGISTER[values["registerB"]];

      this.currentInstruction = `add ${registerNameA}, ${registerNameB}`;
      this.registers[registerNameA] += this.registers[registerNameB];
    });
  }

  subImmediate(instruction, labelTable) {
    return this.checkMatch(/^001011010000(?<register>\d{4})(?<immediate>\d{16})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const immediateInt = parseInt(values["immediate"], 2);

      this.currentInstruction = `sub ${registerName}, ${immediateInt}`;
      this.registers[registerName] -= immediateInt;
    });
  }

  subRegister(instruction, labelTable) {
    return this.checkMatch(/^00101001000000000000(?<registerA>\d{4})0000(?<registerB>\d{4})$/, instruction, (values) => {
      const registerNameA = BINARY_TO_REGISTER[values["registerA"]];
      const registerNameB = BINARY_TO_REGISTER[values["registerB"]];

      this.currentInstruction = `sub ${registerNameA}, ${registerNameB}`;
      this.registers[registerNameA] -= this.registers[registerNameB];
    });
  }

  cmpRegister(instruction, labelTable) {
    return this.checkMatch(/^00111001000000000000(?<registerA>\d{4})0000(?<registerB>\d{4})$/, instruction, (values) => {
      const registerNameA = BINARY_TO_REGISTER[values["registerA"]];
      const registerNameB = BINARY_TO_REGISTER[values["registerB"]];

      this.currentInstruction = `cmp ${registerNameA}, ${registerNameB}`;

      if(this.registers[registerNameA] === this.registers[registerNameB])
        this.registers["zf"] = 1;
      else
        this.registers["zf"] = 0;
      if(this.registers[registerNameA] > this.registers[registerNameB])
        this.registers["sf"] = 0; //Positive
      else
        this.registers["sf"] = 1; //Negative
    });
  }

  cmpImmediate(instruction, labelTable) {
    return this.checkMatch(/^001111010000(?<register>\d{4})(?<immediate>\d{16})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const immediateInt = parseInt(values["immediate"], 2);

      this.currentInstruction = `cmp ${registerName}, ${immediateInt}`;

      if(this.registers[registerName] === immediateInt)
        this.registers["zf"] = 1;
      else
        this.registers["zf"] = 0;
      if(this.registers[registerName] > immediateInt)
        this.registers["sf"] = 0; //Positive
      else
        this.registers["sf"] = 1; //Negative
    });
  }

  cmpMemory(instruction, labelTable) {
    return this.checkMatch(/^0011101100001111(?<register>\d{4})(?<address>\d{12})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["registerA"]];
      const address = this.registers["rbp"] + parseInt(values["address"], 2);
      const value = parseInt(getDword(address));

      this.currentInstruction = `cmp ${registerName}, DWORD[rbp${parseInt(values["address"], 2)}]`;

      if(this.registers[registerName] === value)
        this.registers["zf"] = 1;
      else
        this.registers["zf"] = 0;
      if(this.registers[registerName] > value)
        this.registers["sf"] = 0; //Positive
      else
        this.registers["sf"] = 1; //Negative
    });
  }

  cmpArrayElement(instruction, labelTable) {
    return this.checkMatch(/^001110111111(?<baseAddrRegister>\d{4})0000(?<register>\d{4})0000(?<offsetRegister>\d{4})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const address = this.registers[BINARY_TO_REGISTER[values["baseAddrRegister"].padStart(8,'0')]]
                    + (4*this.registers[BINARY_TO_REGISTER[values["offsetRegister"]]]);
      const value = parseInt(getDword(address));
      this.currentInstruction = `cmp ${registerName}, DWORD[${BINARY_TO_REGISTER[values["baseAddrRegister"].padStart(8,'0')]}+4*
                                                            ${BINARY_TO_REGISTER[values["offsetRegister"]]}]`;

      if(this.registers[registerName] === value)
        this.registers["zf"] = 1;
      else
        this.registers["zf"] = 0;
      if(this.registers[registerName] > value)
        this.registers["sf"] = 0; //Positive
      else
        this.registers["sf"] = 1; //Negative
    });
  }

  jmp(instruction, labelTable) {
    return this.checkMatch(/^11101001(?<instructionLocation>\d{24})$/, instruction, (values) => {
      const instructionLocation = parseInt(values["instructionLocation"],2);
      labelName = labelTable[instructionLocation];
      this.currentInstruction = `jmp ${labelName}`;
      this.registers["pc"] = instructionLocation;
    });
  }

  jumpConditional(instruction, labelTable) { //First 4 bits same, next 4 are condition
    return this.checkMatch(/^1000(?<condition>\d{4})(?<instructionLocation>\d{24})$/, instruction, (values) => {
      const condition = values["condition"];
      const instructionLocation = parseInt(values["instructionLocation"],2);
      labelName = labelTable[instructionLocation];
      switch(condition){
        case '1111'://jg
          this.currentInstruction = `jg ${labelName}`;
          if(this.registers["zf"] === 0 && this.registers["sf"] === 0)
            this.registers["pc"] = instructionLocation;
          break;
        case '1101'://jge
          this.currentInstruction = `jge ${labelName}`;
          if(this.registers["zf"] === 1 || this.registers["sf"] === 0)
            this.registers["pc"] = instructionLocation;
          break;
        case '1100'://jl
          this.currentInstruction = `jl ${labelName}`;
          if(this.registers["zf"] === 0 && this.registers["sf"] === 1)
            this.registers["pc"] = instructionLocation;
          break;
        case '1110'://jle
          this.currentInstruction = `jle ${labelName}`;
          if(this.registers["zf"] === 1 || this.registers["sf"] === 1)
            this.registers["pc"] = instructionLocation;
          break;
        case '0100'://je
          this.currentInstruction = `je ${labelName}`;
          if(this.registers["zf"] === 1)
            this.registers["pc"] = instructionLocation;
          break;
        case '0101'://jne
          this.currentInstruction = `jne ${labelName}`;
          if(this.registers["zf"] === 0)
            this.registers["pc"] = instructionLocation;
          break;
      }
    });
  }
  // TODO: test me
  step() {
    this.registers["pc"] += 4;
    nextInstruction = this.memory.getDword(this.registers["pc"]);
    execute(nextInstruction, labelTable);
  }

  getState() {
    return {
      "registers": this.registers,
      "stack": this.stack
      "currentInstruction": this.currentInstruction;
    };
  }

  checkMatch(regex, instruction, fn) {
    let match = regex.exec(instruction);

    if (match) {
      fn.apply(this, [match["groups"]]);
      return true;
    }

    return false;
  }
}