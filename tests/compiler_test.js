describe("compiler", () => {
  describe("declaration", () => {
    it("should declare variable with immediate value", () => {
      const d = new Declaration({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new Operand({type: "immediate", value: 5})
      });
      const symbolTable = {
        "foo": -4
      };

      const instruction = d.toAssembly(symbolTable);
      expect(instruction).to.equal("mov DWORD PTR [rbp-4], 5");
    });
  });
});

