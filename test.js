const assert = function(condition, message) {
  if (!condition) throw Error(`Assertion failed: ${message}`);
};

const TESTS = {
  "declare variable with immediate value": function() {
    const d = new Declaration({
      destination: new Operand({type: "variable", value: "foo"}),
      operand: new Operand({type: "immediate", value: 5})
    });
    const symbolTable = {
      "foo": -4
    };
    const instructions = d.toAssembly(symbolTable);

    assert(instructions == ["mov DWORD PTR [rbp - 4], 5"], "unexpected output")

    return true;
  },
}

function runTests() {
  console.log("Test results: ");

  for (const [testName, fn] of Object.entries(TESTS)) {
    const result = fn();
    const message = result === true ? "pass" : "fail";
    console.log(`[${message}] ${testName}`);
  };
}

runTests();