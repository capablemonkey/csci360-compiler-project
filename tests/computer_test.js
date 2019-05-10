describe("computer", () => {
  it("runs a basic program", () => {
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

  it("runs the max finding program", () => {
    const code = `int max(int a[5]) {
          int max = 0;

          for (int i=0; i<5; i++) {
            if (max < a[i]) {
              max = a[i];
            }
          }

          return max;
        }

        int main() {
          int a[3] = {1, 2, 3};
          int m = 0;
          m = max(a);
        }`

    const tokens = tokenize(code);
    const {parseTree, output} = compile(tokens);
    const LabelTable = {}
    const allInstructions = parseAss(output, LabelTable);
    const machineCodeStorage = translateInstructions(allInstructions, LabelTable).join("");
    const c = new Computer(LabelTable);

    console.log(machineCodeStorage)
    c.loadProgram(machineCodeStorage);
    c.step();
    c.step();
    c.step();
    c.step();
    c.step();
    c.step();
  });
});

