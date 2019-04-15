describe("cpu", () => {
  describe("mov", () => {
    describe("mov immediate", () => {
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
  });

  describe("add", () => {
    describe("add immediate", () => {
      it("can add 3 to ebx", () => {
        const opcode = "00000101";
        const register = "00000001";
        const immediate = integerToWord(3);
        const instruction = `${opcode}${register}${immediate}`;

        const cpu = new CPU();

        cpu.registers["ebx"] = 7;
        cpu.execute(instruction);

        expect(cpu.getState()["registers"]["ebx"]).to.equal(10);
      });
    });

    describe("add registers", () => {
      it("can add eax and ebx", () => {

      });
    })
  });
});
