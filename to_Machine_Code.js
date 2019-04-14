const Registers = {
  eax: '00000001',
  ecx: '00000010',
  edx: '00000011',
  ebx: '00000100',
  rsp: '00000101',
  rbp: '00000110',
  esi: '00000111',
  edi: '00001000'
}

function immediateOperand(value) {
  return {
    type: 'immediate',
    value: value //Store as a string in form '-123'
  }
}

function registerOperand(value) {
  return {
    type: 'register',
    value: value
  }
}

function memoryOperand(value) {
  return {
    type: 'memory',
    value: value //Store as a string in form '-123'
  }
}

function labelOperand(value) {
  return {
    type: 'label',
    value: value
  }
}

function toBinaryOperand(operand) {
  let isNegative = false;
  let number = operand.value;
  if(number[0] === '-'){
    isNegative = true;
    number = number.substring(1);
  }
  number = Number(number);
  number = number.toString(2);
  if(operand.type === 'memory')
    number = number.padStart(8,'0');
  else if(operand.type === 'immediate')
    number = number.padStart(16,'0');
  else if(operand.type === 'label')
    number = number.padStart(24,'0');
  if(isNegative){//Flip the bits
    for(let i=0; i<number.length; i++){
      if(number[i] === '0')
        number[i] = '1';
      else {
        number[i] = '0';
      }
    }
  }
  return number;
}

class ASMInstruction {
  constructor(op, operand1 = null, operand2 = null) {
    this.op = op;
    this.operand1 = operand1;
    this.operand2 = operand2;
  }

  toMachineCode(LabelTable) {
    let machineCode = '';
    switch(this.op){
      case 'mov':{
        switch(this.operand1.type){
          case 'register':{
            const register1 = Registers[this.operand1.value];
            switch(this.operand2.type){
              //mov register, register
              case 'register':{
                const register2 = Registers[this.operand2.value];
                machineCode += '1000100100000000' + register1 + register2;
                break;
              }
              //mov register, memory
              case 'memory':{
                const memory = toBinaryOperand(this.operand2);
                machineCode += '1000101100001111' + register1 + memory;
                break;
              }
              //mov register, immediate
              case 'immediate':{
                const immediate = toBinaryOperand(this.operand2);
                machineCode += '11000110' + register1 + immediate;
                break;
              }
            }
            break;
          }
          case 'memory':{
            const memory1 = toBinaryOperand(this.operand1);
            switch(this.operand2.type){
              //mov memory, register
              case 'register':{
                const register = Registers[this.operand2.value];
                machineCode += '1000100111110000' + memory1 + register;
                break;
              }
              //mov memory, immediate
              case 'immediate':{
                const immediate = toBinaryOperand(this.operand2);
                machineCode += '11000111' + memory1 + immediate;
                break;
              }
            }
            break;
          }
        }
        break;
      }
      case 'add':{
        //operand1 should only be a register
        if(this.operand1.type != 'register')
          throw "add without register as first operand";
        const register1 = Registers[this.operand1.value];
        switch(this.operand2.type){
          //add register, register
          case 'register':{
            const register2 = Registers[this.operand2.value];
            machineCode += '0000000100000000' + register1 + register2;
            break;
          }
          case 'immediate':{
            const immediate = toBinaryOperand(this.operand2);
            machineCode += '00000101' + register1 + immediate;
            break;
          }
        }
        break;
      }
      case 'sub':{
        //operand1 should only be a register
        if(this.operand1.type != 'register')
          throw "sub without register as first operand";
        const register1 = Registers[this.operand1.value];
        switch(this.operand2.type){
          //sub register, register
          case 'register':{
            const register2 = Registers[this.operand2.value];
            machineCode += '0010100100000000' + register1 + register2;
            break;
          }
          case 'immediate':{
            const immediate = toBinaryOperand(this.operand2);
            machineCode += '00101101' + register1 + immediate;
            break;
          }
        }
        break;
      }
      case 'cmp':{
        //operand should only be a register
        if(this.operand1.type != 'register')
          throw "cmp without register as first operand";
        const register1 = Registers[this.operand1.value];
        switch(this.operand2.type){
          //cmp register, register
          case 'register':{
            const register2 = Registers[this.operand2.value];
            machineCode += '0011100100000000' + register1 + register2;
            break;
          }
          //cmp register, memory
          case 'memory':{
            const memory = toBinaryOperand(this.operand2);
            machineCode += '0011101100001111' + register1 + memory;
            break;
          }
          //cmp register, immediate
          case 'immediate':{
            const immediate = toBinaryOperand(this.operand2);
            machineCode += '00111101' + register1 + immediate;
            break;
          }
        }
        break;
      }
      case 'jmp':{
        const instAddress = toBinaryOperand(LabelTable[this.operand1]);
        machineCode += '11101001' + instAddress;
        break;
      }
      case 'jg':{
        const instAddress = toBinaryOperand(LabelTable[this.operand1]);
        machineCode += '10001111' + instAddress;
        break;
      }
      case 'jl':{
        const instAddress = toBinaryOperand(LabelTable[this.operand1]);
        machineCode += '10001100' + instAddress;
        break;
      }
      case 'je':{
        const instAddress = toBinaryOperand(LabelTable[this.operand1]);
        machineCode += '10000100' + instAddress;
        break;
      }
      case 'jge':{
        const instAddress = toBinaryOperand(LabelTable[this.operand1]);
        machineCode += '10001101' + instAddress;
        break;
      }
      case 'jle':{
        const instAddress = toBinaryOperand(LabelTable[this.operand1]);
        machineCode += '10001110' + instAddress;
        break;
      }
      case 'jne':{
        const instAddress = toBinaryOperand(LabelTable[this.operand1]);
        machineCode += '10000101' + instAddress;
        break;
      }
      case 'push':{
        const register = Registers[this.operand1.value];
        machineCode += '00000110' + register +'0000000000000000';
        break;
      }
      case 'pop':{
        const register = Registers[this.operand1.value];
        machineCode += '00000001' + register + '0000000000000000';
        break;
      }
      case 'lea':{
        const register = Registers[this.operand1.value];
        const memory = toBinaryOperand(this.operand2);
        machineCode += '1000110100001111' + register + memory;
        break;
      }
      case 'call':{
        const instAddress = toBinaryOperand(LabelTable[this.operand1]);
        machineCode += '11101000' + instAddress;
        break;
      }
      case 'ret':{
        machineCode += '11000010000000000000000000000000';
        break;
      }
      //Label
      default:{
        //Do nothing
        break;
      }
    }
    return machineCode;
  }
}

function translateInstructions(instArray) {
  let Labels = {};
  for(let i=0; i<instArray.length; i++) {
    if(instArray[i].op === 'label') {
      Labels[instArray[i].operand1] = instArray[i].operand2;
    }
  }
  let externalMachineCode = [];
  for(let i=0; i<instArray.length; i++) {
    let fullInstruction = instArray[i].toMachineCode(Labels);
    externalMachineCode.push(fullInstruction.slice(0,8));
    externalMachineCode.push(fullInstruction.slice(8,16));
    externalMachineCode.push(fullInstruction.slice(16,24));
    externalMachineCode.push(fullInstruction.slice(24,32));
  }
  while(externalMachineCode.length < 1024) {
    externalMachineCode.push('00000000');
  }
  return externalMachineCode;
}
