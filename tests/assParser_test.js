describe("ASM to Machine Code", () => {
  it("mov reg, reg", () => {
    const op = 'mov'; const operand1 = registerOperand('eax'); const operand2 = registerOperand('edx');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '10001001000000000000000000000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, mem", () => {
    const op = 'mov'; const operand1 = registerOperand('eax'); const operand2 = memoryOperand('-4');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '10001011000011110000111111111100';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, mem[reg+4*reg]", () => {
    const op = 'mov'; const operand1 = registerOperand('eax'); const operand2 = memoryOperand('rcx +4*rdx');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '10001011111100100000000000000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, imm", () => {
    const op = 'mov'; const operand1 = registerOperand('eax'); const operand2 = immediateOperand('15');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '11000110000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov mem, reg", () => {
    const op = 'mov'; const operand1 = memoryOperand('-8'); const operand2 = registerOperand('rcx');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '10001001111100001111111110000010';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov mem, imm", () => {
    const op = 'mov'; const operand1 = memoryOperand('-8'); const operand2 = immediateOperand('16');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '11111111111110000000000000010000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("add reg, reg", () => {
    const op = 'add'; const operand1 = registerOperand('eax'); const operand2 = registerOperand('edx');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '00000001000000000000000000000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("add reg, imm", () => {
    const op = 'add'; const operand1 = registerOperand('eax'); const operand2 = immediateOperand('15');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '00000101000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("sub reg, reg", () => {
    const op = 'sub'; const operand1 = registerOperand('eax'); const operand2 = registerOperand('edx');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '00101001000000000000000000000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("sub reg, imm", () => {
    const op = 'sub'; const operand1 = registerOperand('eax'); const operand2 = immediateOperand('15');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '00101101000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("cmp reg, reg", () => {
    const op = 'cmp'; const operand1 = registerOperand('eax'); const operand2 = registerOperand('edx');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '00111001000000000000000000000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("cmp reg, mem", () => {
    const op = 'cmp'; const operand1 = registerOperand('eax'); const operand2 = memoryOperand('-4');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '00111011000011110000111111111100';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("cmp reg, mem[reg+4*reg]", () => {
    const op = 'cmp'; const operand1 = registerOperand('eax'); const operand2 = memoryOperand('rcx +4*rdx');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '00111011111100100000000000000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("cmp reg, imm", () => {
    const op = 'cmp'; const operand1 = registerOperand('eax'); const operand2 = immediateOperand('15');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '00111101000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jmp label", () => {
    const op = 'jmp'; const operand1 = labelOperand(0);
    const result = new ASMInstruction(op, operand1);
    const expected = '11101001000000000000000000000000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jg label", () => {
    const op = 'jg'; const operand1 = labelOperand(15);
    const result = new ASMInstruction(op, operand1);
    const expected = '10001111000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jl label", () => {
    const op = 'jl'; const operand1 = labelOperand(15);
    const result = new ASMInstruction(op, operand1);
    const expected = '10001100000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("je label", () => {
    const op = 'je'; const operand1 = labelOperand(15);
    const result = new ASMInstruction(op, operand1);
    const expected = '10000100000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jge label", () => {
    const op = 'jge'; const operand1 = labelOperand(15);
    const result = new ASMInstruction(op, operand1);
    const expected = '10001101000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jle label", () => {
    const op = 'jle'; const operand1 = labelOperand(15);
    const result = new ASMInstruction(op, operand1);
    const expected = '10001110000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jne label", () => {
    const op = 'jne'; const operand1 = labelOperand(15);
    const result = new ASMInstruction(op, operand1);
    const expected = '10000101000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("push reg", () => {
    const op = 'push'; const operand1 = registerOperand('edx');
    const result = new ASMInstruction(op, operand1);
    const expected = '00000110000000110000000000000000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("pop reg", () => {
    const op = 'pop'; const operand1 = registerOperand('edx');
    const result = new ASMInstruction(op, operand1);
    const expected = '00000111000000110000000000000000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("lea reg, mem", () => {
    const op = 'lea'; const operand1 = registerOperand('eax'); const operand2 = memoryOperand('-4');
    const result = new ASMInstruction(op, operand1, operand2);
    const expected = '10001101000011110000111111111100';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("call label", () => {
    const op = 'call'; const operand1 = labelOperand(15);
    const result = new ASMInstruction(op, operand1);
    const expected = '11101000000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("ret", () => {
    const result = new ASMInstruction('ret');
    const expected = '11000010000000000000000000000000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it(".LABEL", () => {
    const op = 'label'; const operand1 = labelOperand(15);
    const result = new ASMInstruction(op, operand1);
    const expected = '00000000000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });
});
