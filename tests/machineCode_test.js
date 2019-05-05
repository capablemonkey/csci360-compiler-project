describe("ASM to Machine Code", () => {
  it("mov reg, reg", () => {
    const result = new ASMInstruction('mov', registerOperand('eax'), registerOperand('edx'));
    const expected = '10001001000000000000000100000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, mem", () => {
    const result = new ASMInstruction('mov', registerOperand('eax'), memoryOperand('-4'));
    const expected = '10001011000011110000000111111100';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, mem[reg+4*reg]", () => {
    const result = new ASMInstruction('mov', registerOperand('eax'), memoryOperand('rcx +4*rdx'));
    const expected = '10001011111100100000000100000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, imm", () => {
    const result = new ASMInstruction('mov', registerOperand('eax'), immediateOperand('15'));
    const expected = '11000110000000010000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov mem, reg", () => {
    const result = new ASMInstruction('mov', memoryOperand('-8'), registerOperand('rcx'));
    const expected = '10001001111100001111100000000010';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov mem, imm", () => {
    const result = new ASMInstruction('mov', memoryOperand('-8'), immediateOperand('16'));
    const expected = '11000111111110000000000000010000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("add reg, reg", () => {
    const result = new ASMInstruction('add', registerOperand('eax'), registerOperand('edx'));
    const expected = '00000001000000000000000100000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("add reg, imm", () => {
    const result = new ASMInstruction('add', registerOperand('eax'), immediateOperand('15'));
    const expected = '00000101000000010000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("sub reg, reg", () => {
    const result = new ASMInstruction('sub', registerOperand('eax'), registerOperand('edx'));
    const expected = '00101001000000000000000100000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("sub reg, imm", () => {
    const result = new ASMInstruction('sub', registerOperand('eax'), immediateOperand('15'));
    const expected = '00101101000000010000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("cmp reg, reg", () => {
    const result = new ASMInstruction('cmp', registerOperand('eax'), registerOperand('edx'));
    const expected = '00111001000000000000000100000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("cmp reg, mem", () => {
    const result = new ASMInstruction('cmp', registerOperand('eax'), memoryOperand('-4'));
    const expected = '00111011000011110000000111111100';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("cmp reg, mem[reg+4*reg]", () => {
    const result = new ASMInstruction('cmp', registerOperand('eax'), memoryOperand('rcx +4*rdx'));
    const expected = '00111011111100100000000100000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("cmp reg, imm", () => {
    const result = new ASMInstruction('cmp', registerOperand('eax'), immediateOperand('15'));
    const expected = '00111101000000010000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, mem", () => {
    const result = new ASMInstruction('mov', registerOperand('eax'), memoryOperand('-4'));
    const expected = '10001011000011110000000111111100';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jmp label", () => {
    const result = new ASMInstruction('jmp', labelOperand(0));
    const expected = '11101001000000000000000000000000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jg label", () => {
    const result = new ASMInstruction('jg', labelOperand(15));
    const expected = '10001111000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jl label", () => {
    const result = new ASMInstruction('jl', labelOperand(15));
    const expected = '10001100000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("je label", () => {
    const result = new ASMInstruction('je', labelOperand(15));
    const expected = '10000100000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jge label", () => {
    const result = new ASMInstruction('jge', labelOperand(15));
    const expected = '10001101000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jle label", () => {
    const result = new ASMInstruction('jle', labelOperand(15));
    const expected = '10001110000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("jne label", () => {
    const result = new ASMInstruction('jne', labelOperand(15));
    const expected = '10000101000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("push reg", () => {
    const result = new ASMInstruction('push', registerOperand('edx'));
    const expected = '00000110000000110000000000000000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("pop reg", () => {
    const result = new ASMInstruction('pop', registerOperand('edx'));
    const expected = '00000111000000110000000000000000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("lea reg, mem", () => {
    const result = new ASMInstruction('lea', registerOperand('eax'), memoryOperand('-4'));
    const expected = '10001101000011110000000111111100';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("call label", () => {
    const result = new ASMInstruction('call', labelOperand(15));
    const expected = '11101000000000000000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("ret", () => {
    const result = new ASMInstruction('ret');
    const expected = '11000010000000000000000000000000';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it(".LABEL", () => {
    const result = new ASMInstruction('label', labelOperand(15));
    const expected = '00000000000000000000000000000000';
    expect(result.toMachineCode()).to.equal(expected);
  });
});
