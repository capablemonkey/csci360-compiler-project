describe("computer", () => {
  it("runs a program", () => {
    const c = new Computer();

    const tokens = tokenize("int main() { int foo = 3; return foo; }");
    const {parseTree, output} = compile(tokens);
    const LabelTable = {}
    const allInstructions = parseAss(output,LabelTable);
    const machineCodeStorage = translateInstructions(allInstructions, LabelTable).join("");

    console.log(machineCodeStorage)
    c.loadProgram(machineCodeStorage);
    c.step();
    c.step();
    c.step();
    c.step();
    c.step();
    c.step();
    c.step();
    c.step();
    c.step();
    c.step();

    // console.log("stack", c.cache.memory.physicalMemory.storage);
    // console.log("stack", c.cache.memory.getDword(0, 4092));
  });
});

