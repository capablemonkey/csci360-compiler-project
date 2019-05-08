const Registers = {
  eax: '0000', rax: '0000',
  ebx: '0001', rbx: '0001',
  ecx: '0010', rcx: '0010',
  edx: '0011', rdx: '0011',
  esi: '0100', rsi: '0100',
  edi: '0101', rdi: '0101',
  esp: '0110', rsp: '0110',
  ebp: '0111', rbp: '0111',
  pc: '1000'
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
  if(!isNaN(Number(value))){
    return {
      type: 'memory',
      value: value //Store as a string in form '-123' or obj with 2 regs
    }
  }
  else{
    const reg1 = value.substring(0,3);
    const reg2 = value.substring(value.length-3);
    return {
      type: 'memory',
      value: {
        first: reg1,
        second: reg2
      }
    }
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
  if(isNegative)
    number--;
  number = Number(number);
  number = number.toString(2);
  if(operand.type === 'memory')
    number = number.padStart(12,'0');
  else if(operand.type === 'immediate')
    number = number.padStart(16,'0');
  else if(operand.type === 'label')
    number = number.padStart(24,'0');
  if(isNegative){//Flip the bits
    let negNum = '';
    for(let i=0; i<number.length; i++){
      if(number[i] === '0')
        negNum += '1';
      else
        negNum += '0';
    }
    number = negNum;
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
                machineCode = `10001001000000000000${register1}0000${register2}`;
                break;
              }
              //mov register, memory
              case 'memory':{
                if(typeof this.operand2.value === 'string'){
                  const memory = toBinaryOperand(this.operand2);
                  machineCode = `1000101100001111${register1}${memory}`;
                  break;
                }
                else{
                  const regAddr1 = Registers[this.operand2.value.first];;
                  const regAddr2 = Registers[this.operand2.value.second];
                  machineCode = `100010111111${regAddr1}0000${register1}0000${regAddr2}`;
                  break;
                }
              }
              //mov register, immediate
              case 'immediate':{
                const immediate = toBinaryOperand(this.operand2);
                machineCode = `110001100000${register1}${immediate}`;
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
                machineCode = `1000100111110000${memory1}${register}`;
                break;
              }
              //mov memory, immediate
              case 'immediate':{
                const immediate = toBinaryOperand(this.operand2);
                machineCode = `1111${memory1}${immediate}`;
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
            machineCode = `00000001000000000000${register1}0000${register2}`;
            break;
          }
          case 'immediate':{
            const immediate = toBinaryOperand(this.operand2);
            machineCode = `000001010000${register1}${immediate}`;
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
            machineCode = `00101001000000000000${register1}0000${register2}`;
            break;
          }
          case 'immediate':{
            const immediate = toBinaryOperand(this.operand2);
            machineCode = `001011010000${register1}${immediate}`;
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
            machineCode = `00111001000000000000${register1}0000${register2}`;
            break;
          }
          //cmp register, memory
          case 'memory':{
            if(typeof this.operand2.value === 'string'){
              const memory = toBinaryOperand(this.operand2);
              machineCode = `0011101100001111${register1}${memory}`;
              break;
            }
            else{
              const regAddr1 = Registers[this.operand2.value.first];
              const regAddr2 = Registers[this.operand2.value.second];
              machineCode = `001110111111${regAddr1}0000${register1}0000${regAddr2}`;
              break;
            }
          }
          //cmp register, immediate
          case 'immediate':{
            const immediate = toBinaryOperand(this.operand2);
            machineCode = `001111010000${register1}${immediate}`;
            break;
          }
        }
        break;
      }
      case 'jmp':{
        const instAddress = toBinaryOperand(this.operand1);
        machineCode = `11101001${instAddress}`;
        break;
      }
      case 'jg':{
        const instAddress = toBinaryOperand(this.operand1);
        machineCode = `10001111${instAddress}`;
        break;
      }
      case 'jl':{
        const instAddress = toBinaryOperand(this.operand1);
        machineCode = `10001100${instAddress}`;
        break;
      }
      case 'je':{
        const instAddress = toBinaryOperand(this.operand1);
        machineCode = `10000100${instAddress}`;
        break;
      }
      case 'jge':{
        const instAddress = toBinaryOperand(this.operand1);
        machineCode = `10001101${instAddress}`;
        break;
      }
      case 'jle':{
        const instAddress = toBinaryOperand(this.operand1);
        machineCode = `10001110${instAddress}`;
        break;
      }
      case 'jne':{
        const instAddress = toBinaryOperand(this.operand1);
        machineCode = `10000101${instAddress}`;
        break;
      }
      case 'push':{
        const register = Registers[this.operand1.value];
        machineCode = `000001100000${register}0000000000000000`;
        break;
      }
      case 'pop':{
        const register = Registers[this.operand1.value];
        machineCode = `000001110000${register}0000000000000000`;
        break;
      }
      case 'lea':{
        const register = Registers[this.operand1.value];
        const memory = toBinaryOperand(this.operand2);
        machineCode = `1000110100001111${register}${memory}`;
        break;
      }
      case 'call':{
        const instAddress = toBinaryOperand(this.operand1);
        machineCode = `11101000${instAddress}`;
        break;
      }
      case 'ret':{
        machineCode = `11000010000000000000000000000000`;
        break;
      }
      //Label
      default:{
        //[0000 0000][jjjj jjjj jjjj jjjj jjjj jjjj]
        const labelLine = toBinaryOperand(this.operand1);
        machineCode = `00000000${labelLine}`;
        break;
      }
    }
    return machineCode;
  }
}

function translateInstructions(instArray, LabelTable) {
  let externalMachineCode = [];
  for(let i=0; i<instArray.length; i++) {
    let fullInstruction = instArray[i].toMachineCode(LabelTable);
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
