describe("cpu", () => {
  describe("mov", () => {
    describe("movImmediate", () => {
      it("can move 1337 into ecx", () => {
        const opcode = "11000110";
        const register = "00000010";
        const immediate = "0000010100111001";
        const instruction = `${opcode}${register}${immediate}`;

        const cpu = new CPU();
        cpu.execute(instruction);

        expect(cpu.getState()["registers"]["ecx"]).to.equal(1337);
      });
    });

    describe("movRegisterToMemory", () => {
      it("can move eax to memory location 222", () => {
        const opcode = "1000100111110000";
        const register = "00000000";
        const memory = intToNBytes(222, 1);
        const instruction = `${opcode}${memory}${register}`

        const cpu = new CPU();
        cpu.registers["eax"] = 1337;
        cpu.execute(instruction);

        expect(cpu.memory.getDword(222)).to.equal("00000000000000000000010100111001")
      });
    });
  });

  describe("add", () => {
    describe("addImmediate", () => {
      it("can add 3 to ebx", () => {
        const opcode = "00000101";
        const register = "00000001";
        const immediate = intToNBytes(3, 2);
        const instruction = `${opcode}${register}${immediate}`;

        const cpu = new CPU();

        cpu.registers["ebx"] = 7;
        cpu.execute(instruction);

        expect(cpu.getState()["registers"]["ebx"]).to.equal(10);
      });
    });

    describe("addRegisters", () => {
      it("can add eax and ebx", () => {
        const opcode = "0000000100000000";
        const registerA = "00000000";
        const registerB = "00000001";
        const instruction = `${opcode}${registerA}${registerB}`;

        const cpu = new CPU();
        cpu.registers["eax"] = 100;
        cpu.registers["ebx"] = 36;
        cpu.execute(instruction);

        expect(cpu.getState()["registers"]["eax"]).to.equal(136);
      });
    })
  });
});
