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


class PhysicalMemory {
  constructor(capacityBytes, pageSize) {
    // Stores a string of bits
    this.storage = "0".repeat(capacityBytes * 8);
    this.pageSize = pageSize; // number of dwords per page
    this.capacityPages = Math.floor(capacityBytes / (pageSize * 4));
    this.usedPageCount = 0;
  }

  // returns the 32 bits (dword) at address
  getDword(address) {
    const dwordStart = address * 32;
    this.checkBounds(dwordStart);

    return this.storage.slice(dwordStart, dwordStart + 32);
  }

  // sets the 32 bit string dword at the address
  setDword(address, dword) {
    const dwordStart = address * 32;
    this.checkBounds(dwordStart);

    this.storage = this.storage.split("").splice(dwordStart, 32, dword).join("");
  }

  checkBounds(dwordStart) {
    if (dwordStart + 32 >= this.storage.length) {
      throw new Error("Out of bounds physical memory access.");
    }
  }
}

// Physical memory size: 5000 dwords (4 bytes) (for the stack) + 1000 for the code
// Virtual memory: 5000 for the stack + 5000 for the code


class VirtualMemory {
  // add code area: memory address 0 and onwards
  // add data area: memory address max and grows downwards

  // BECAUSE WE DON'T HAVE SWAPPING, We cannot ever evict the stack from physical memory

  /*

  ===============     Highest Address (e.g. 0xFFFF)
  |             |
  |    STACK    |
  |             |
  |.............|  <- Old Stack Pointer (e.g. 0xEEEE)
  |             |
  | Newly       |
  | allocated   |
  |-------------|  <- New Stack Pointer (e.g. 0xAAAA)
  .     ...     .
  |             |
  |-------------|
  |             |
  |    CODE     |
  |             |
  ===============     Lowest Address    (e.g. 0x0000)
   */

  // virtual memory: [0-3584: code], [4096 -> 3584] stack
  constructor(physicalMemory, externalStorage, pageSize) {
    this.physicalMemory = physicalMemory;
    this.externalStorage = externalStorage;
    this.pageSize = pageSize; // number of dwords per page

    this.virtualAddressSpaceMax = 4096;
    this.stackLimit = 512; // bytes

    // this.pageTable[pid][address] = {"location": "physicalMemory", "pageIndex": 34, "valid": true}
    // this.pageTable[pid][address] = {"location": "external", "pageIndex": 200, "valid": false}
    // maps virtual page number to physical page number
    this.pageTable = {};
  }

  getDword(pid, virtualAddress) {
    // locate page
    // move page into memory if needed
    // get Dword from block from page

    const virtualPageIndex = this.getVirtualPageIndex(virtualAddress);
    const pageOffset = this.getVirtualPageOffset(virtualAddress);
    const hit = this.pageTable[pid][virtualPageIndex];

    if (hit && hit.location == "physicalMemory" && hit.valid == true) {
      const pageStart = hit.pageIndex * this.pageSize * 4; // 4 dwords
      return this.physicalMemory.getDword(pageStart + pageOffset);
    } else {
      // its on external storage, so load into physical memory
      const physicalPageIndex = this.loadPageToPhysicalMemory(hit.pageIndex);

      // update virtual page table
      this.pageTable[pid][virtualPageIndex] = {
        location: "physicalMemory",
        pageIndex: physicalPageIndex,
        valid: true
      };

     // read from physical memory
     return this.physicalMemory.getDword(physicalPageIndex * this.pageSize * 4 + pageOffset);
    }
  }

  loadPageToPhysicalMemory(externalStoragePageIndex) {
    // find a page to free up in physical memory
    // load all the dwords from the external page into the physical page
    const freePageIndex = this.freePage();
    const physicalMemoryPageStartAddress = freePageIndex * this.pageSize * 4;
    const externalStoragePageStartAddress = externalStoragePageIndex * this.pageSize * 4;

    for (let i = 0; i < this.pageSize; i++) {
      const dword = this.externalStorage.getDword(externalStoragePageStartAddress + i * 4);
      this.physicalMemory.setDword(physicalMemoryPageStartAddress + i * 4, dword);
    }

    return freePageIndex;
  }

  // finds a free page or chooses one to be replaced
  // returns physical page index
  freePage() {
    return 0;
  }

  // sets dword in physical memory where dword is a string of 32 bits
  setDword(pid, virtualAddress, dword) {
    // check pageTable to see if page is in physical memory
    // if in physical memory, then just update dword in physical memory
    // otherwise, load from disk into physical memory and then set dword in physical memory

    const virtualPageIndex = this.getVirtualPageIndex(virtualAddress);
    const pageOffset = this.getVirtualPageOffset(virtualAddress);
    const hit = this.pageTable[pid][virtualPageIndex];

    if (hit.location == "physicalMemory" && hit.valid == true) {
      const pageStart = hit.pageIndex * this.pageSize * 4; // 4 dwords
      return this.physicalMemory.setDword(pageStart + pageOffset, dword);
    } else {
      // its on external storage, so load into physical memory
      const physicalPageIndex = this.loadPageToPhysicalMemory(hit.pageIndex);

      // update virtual page table
      this.pageTable[pid][virtualPageIndex] = {
        location: "physicalMemory",
        pageIndex: physicalPageIndex,
        valid: true
      };

     // read from physical memory
     return this.physicalMemory.setDword(physicalPageIndex * this.pageSize * 4 + pageOffset, dword);
    }
  }

  allocateStack(pid) {
    // create pages in page table for stack
    // pageTable[255] = {location: "physicalMemory", pageIndex: 64}
    // pageTable[254] = {location: "physicalMemory", pageIndex: 63}
    // ...
    // pageTable[223] = {location: "physicalMemory", pageIndex: 32}
  }


  loadProgram(pid, externalStorageStartAddress, lengthDword) {
    // TODO: fill the page table with the pages in the externalStorage, but no pages need to be loaded
    // pageTable[0] => {location: externalStorage, pageIndex: 0}
    // pageTable[1] => {location: externalStorage, pageIndex: 1}
    //
    //
    // for (const i = 0; i < lengthDword; i++) {
    //   const dword = this.externalStorage.getDword(externalStorageStartAddress + i * 32);

    //   const virtualAddress = i * 4;
    //   this.setDword(pid, virtualAddress, dword);
    // }

    this.allocateStack(pid);
  }

  // virtual address:
  // 1000 1001 1011
  // \-------/ \--/
  //  vpage     offset
  //  
  // virtual page index: 1000 1001
  // offset: 1011
  // 
  // 1 page             = 4 dwords per page
  //                    = 4 instructions per page
  //                    = 16 bytes
  // 
  // total virtual address space = 2 ^ 12 = 4096 addresses
  // physical memory is 1024 bytes = 2^10
  // stack limit: 512 bytes (we always keep these pages around)
  // remaining for code pages = 512 bytes = 32 pages
  //
  // 10 pages = 160 bytes = 40 instructions * 4 bytes/instruction
  // to fill up all the code pages, we need at least 512 bytes = 128 instructions
  // 

  getVirtualPageIndex(virtualAddress) {
    return Math.floor(virtualAddress / (this.pageSize * 4));
  }

  getPageOffset(virtualAddress) {
    return virtualAddress % (this.pageSize * 4);
  }
}

class ExternalStorage {
  constructor() {
    // Stores a string of bits
    this.storage = "";
  }

  load(data) {
    this.storage = data;
  }

  // returns the 32 bits (dword) at address
  getDword(address) {
    const dwordStart = address * 4 * 8;
    this.checkBounds(dwordStart);

    return this.storage.slice(dwordStart, dwordStart + 32);
  }

  // sets the 32 bit string dword at the address
  setDword(address, dword) {
    const dwordStart = address * 4 * 8;
    this.checkBounds(dwordStart);

    this.storage.splice(dwordStart, 32, dword);
  }

  checkBounds(dwordStart) {
    if (dwordStart + 32 >= this.storage.length) {
      throw new Error("Out of bounds external storage access.");
    }
  }
}

class Computer {
  /*
    CPU -> cache -> virtual memory -> physicalMemory
                       |                   ^
                       \> externalStorage -/
   */
  constructor() {
    const pageSize = 4;
    this.externalStorage = new ExternalStorage();
    this.physicalMemory = new PhysicalMemory(1024, pageSize);
    this.virtualMemory = new VirtualMemory(this.physicalMemory, this.externalStorage, pageSize);

    this.cache = new Cache({nway: 4, size: 2, k: 2, bits: 12, virtualMemory: this.virtualMemory});
    this.cpu = new CPU(this.cache);
  }

  loadProgram(bits) {
    const pid = 0;
    this.externalStorage.load(bits);

    const programSizeDwords = bits / 32;
    this.virtualMemory.loadProgram(pid, 0, programSizeDwords);
  }

  execute() {
    this.cpu.step();
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
  constructor(cache, LabelTable) {
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
    this.LabelTable = LabelTable;
    this.startInstruction = 0;
    this.stack = [];
    this.memory = cache;
    this.currentInstruction = 'Program Start';
  }

  // instruction is a 32 bit instruction represented as a string of "1"s and "0"s
  // e.g. "01000000100000000010000000000000"
  execute(instruction) {
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
    const found = operations.some((op) => op.apply(this, [instruction]));

    if (!found) {
      throw new Error(`Encountered unknown instruction: ${instruction}`);
    }

    return true;
  }

  lea(instruction){
    return this.checkMatch(/^1000110100001111(?<register>\d{4})(?<address>\d{12})$/, instruction, (values) => {
      const register = BINARY_TO_REGISTER[values["register"]];
      const address = this.registers['rbp'] + parseInt(values["address"], 2);

      this.currentInstruction = `lea ${register}, DWORD[rbp${parseInt(values["address"], 2)}]`;
      this.registers[registerNameA] = address;
    });
  }

  push(instruction){
    return this.checkMatch(/^000001100000(?<register>\d{4})0000000000000000$/, instruction, (values) => {
      const register = BINARY_TO_REGISTER[values["register"]];

      this.currentInstruction = `push ${register}`;
      this.stack.push(`${register}: ${this.registers[register]}`);
      this.registers['rsp'] -+ 4;
      setDword(this.registers['rsp'], intToBytes(this.registers[register], 32));
    });
  }

  pop(instruction){
    return this.checkMatch(/^000001110000(?<register>\d{4})0000000000000000$/, instruction, (values) => {
      const register = BINARY_TO_REGISTER[values["register"]];

      this.currentInstruction = `pop ${register}`;
      this.stack.pop();
      this.registers[register] = getDword(this.registers['rsp']);
      this.registers['rsp'] += 4;
    });
  }

  call(instruction){
    return this.checkMatch(/^11101000(?<instructionLocation>\d{24})$/, instruction, (values) => {
      const instructionLocation = parseInt(values["instructionLocation"], 2);
      const labelName = this.LabelTable[instructionLocation];

      this.currentInstruction = `call ${labelName}`;
      this.stack.push(`Return Address: ${this.registers['pc']} \n ${labelName}`);
      this.registers['rsp'] -= 4;
      setDword(this.registers['rsp'], intToBytes(this.registers['pc'], 32));
      this.registers['pc'] = instructionLocation;
    });
  }

  ret(instruction){
    return this.checkMatch(/^11000010000000000000000000000000$/, instruction, (values) => {

      this.currentInstruction = `ret`;
      this.stack.pop();
      this.registers['pc'] = getDword(this.registers['rsp']);
      this.registers['rsp'] += 4;
      if(this.stack.length === 0)
        //End of program
    });
  }

  movRegisterToRegister(instruction) {
    return this.checkMatch(/^10001001000000000000(?<registerA>\d{4})0000(?<registerB>\d{4})$/, instruction, (values) => {
      const registerNameA = BINARY_TO_REGISTER[values["registerA"]];
      const registerNameB = BINARY_TO_REGISTER[values["registerB"]];

      this.currentInstruction = `mov ${registerNameA}, ${registerNameB}`;
      this.registers[registerNameA] = this.registers[registerNameB];
      if(registerNameA === 'rbp' && registerNameB === 'rsp'){
        while(!this.stack[this.stack.length].include('rbp'))
          this.stack.pop();
      }
    });
  }

  movImmediateToRegister(instruction) {
    return this.checkMatch(/^110001100000(?<register>\d{4})(?<immediate>\d{16})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const immediateInt = parseInt(values["immediate"], 2);

      this.currentInstruction = `mov ${registerName}, ${immediateInt}`;
      this.registers[registerName] = immediateInt;
    });
  }

  movMemoryToRegister(instruction) {
    return this.checkMatch(/^1000101100001111(?<register>\d{4})(?<memory>\d{12})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const address = this.registers["rbp"] + parseInt(values["address"], 2);

      this.currentInstruction = `mov ${registerName}, DWORD[rbp${parseInt(values["address"], 2)}]`;
      const value = parseInt(getDword(address));
      this.registers[registerName] = value;
    });
  }

  movArrayElementToRegister(instruction) {
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

  movImmediateToMemory(instruction) {
    return this.checkMatch(/^1111(?<address>\d{12})(?<immediate>\d{16})$/, instruction, (values) => {
      const address = this.registers["rbp"] + parseInt(values["address"], 2);
      const immediateBinary = values["immediate"].padStart(32,0);

      this.currentInstruction = `mov DWORD[rbp${parseInt(values["address"], 2)}], ${parseInt(values["immediate"], 2)}`;
      this.memory.setWord(address, immediateBinary);
    });
  }

  movRegisterToMemory(instruction) {
    return this.checkMatch(/^1000100111110000(?<address>\d{12})(?<register>\d{4})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const address = this.registers["rbp"] + parseInt(values["address"], 2);

      this.currentInstruction = `mov DWORD[rbp${parseInt(values["address"], 2)}], ${registerName}`;
      const value = this.registers[registerName];
      this.memory.setDword(address, intToNBytes(value, 4));
    });
  }

  addImmediate(instruction) {
    return this.checkMatch(/^000001010000(?<register>\d{4})(?<immediate>\d{16})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      const immediateInt = parseInt(values["immediate"], 2);

      this.currentInstruction = `add ${registerName}, ${immediateInt}`;
      this.registers[registerName] += immediateInt;
    });
  }

  addRegisters(instruction) {
    return this.checkMatch(/^00000001000000000000(?<registerA>\d{4})0000(?<registerB>\d{4})$/, instruction, (values) => {
      const registerNameA = BINARY_TO_REGISTER[values["registerA"]];
      const registerNameB = BINARY_TO_REGISTER[values["registerB"]];

      this.currentInstruction = `add ${registerNameA}, ${registerNameB}`;
      this.registers[registerNameA] += this.registers[registerNameB];
    });
  }

  subImmediate(instruction) {
    return this.checkMatch(/^001011010000(?<register>\d{4})(?<immediate>\d{16})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["register"]];
      let immediateInt = parseInt(values["immediate"], 2);

      this.currentInstruction = `sub ${registerName}, ${immediateInt}`;
      this.registers[registerName] += immediateInt;
      if(registerName === 'rsp'){
        while(immediateInt != 0){
          this.stack.push(`DWORD[rbp${immediateInt}]`);
          immediateInt += 4;
        }
      }
    });
  }

  subRegister(instruction) {
    return this.checkMatch(/^00101001000000000000(?<registerA>\d{4})0000(?<registerB>\d{4})$/, instruction, (values) => {
      const registerNameA = BINARY_TO_REGISTER[values["registerA"]];
      const registerNameB = BINARY_TO_REGISTER[values["registerB"]];

      this.currentInstruction = `sub ${registerNameA}, ${registerNameB}`;
      this.registers[registerNameA] -= this.registers[registerNameB];
    });
  }

  cmpRegister(instruction) {
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

  cmpImmediate(instruction) {
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

  cmpMemory(instruction) {
    return this.checkMatch(/^0011101100001111(?<register>\d{4})(?<address>\d{12})$/, instruction, (values) => {
      const registerName = BINARY_TO_REGISTER[values["registerA"]];
      const address = this.registers["rbp"] + parseInt(values["address"], 2);
      const value = parseInt(this.memory.getDword(address));

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

  cmpArrayElement(instruction) {
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

  jmp(instruction) {
    return this.checkMatch(/^11101001(?<instructionLocation>\d{24})$/, instruction, (values) => {
      const instructionLocation = parseInt(values["instructionLocation"],2);
      labelName = this.LabelTable[instructionLocation];
      this.currentInstruction = `jmp ${labelName}`;
      this.registers["pc"] = instructionLocation;
    });
  }

  jumpConditional(instruction) { //First 4 bits same, next 4 are condition
    return this.checkMatch(/^1000(?<condition>\d{4})(?<instructionLocation>\d{24})$/, instruction, (values) => {
      const condition = values["condition"];
      const instructionLocation = parseInt(values["instructionLocation"],2);
      labelName = this.LabelTable[instructionLocation];
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
    nextInstruction = this.memory.getDword(this.registers["pc"]);
    execute(nextInstruction);
    this.registers["pc"] += 4;
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
