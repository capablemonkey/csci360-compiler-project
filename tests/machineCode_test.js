describe("ASM to Machine Code", () => {
  it("mov reg, reg", () => {
    let LabelTable = {};
    const result = new ASMInstruction('mov', registerOperand('eax'), registerOperand('edx'));
    const expected = '10001001000000000000000100000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, mem", () => {
    let LabelTable = {};
    const result = new ASMInstruction('mov', registerOperand('eax'), memoryOperand('-4'));
    const expected = '10001011000011110000000111111100';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, mem[reg+4*reg]", () => {
    let LabelTable = {};
    const result = new ASMInstruction('mov', registerOperand('eax'), memoryOperand('rcx +4*rdx'));
    const expected = '10001011111100100000000100000011';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov reg, imm", () => {
    let LabelTable = {};
    const result = new ASMInstruction('mov', registerOperand('eax'), immediateOperand('15'));
    const expected = '11000110000000010000000000001111';
    expect(result.toMachineCode()).to.equal(expected);
  });

  it("mov mem, reg", () => {
    let LabelTable = {};
    const result = new ASMInstruction('mov', memoryOperand('-8'), registerOperand('rcx'));
    const expected = '10001001111100001111100000000010';
    expect(result.toMachineCode()).to.equal(expected);
  });
});
