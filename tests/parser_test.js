describe("tokenizer", () => {
  it("should tokenize a simple line", () => {
    const input = "foo = a + 12;";
    const tokens = tokenize(input);
    expect(tokens).to.eql(["foo", "=", "a", "+", "12", ";"]);
  });

  it("should tokenize a function", () => {
    const input = `
      int max(int foo) {
        int a = 1 + foo;
        return a;
      }`;
    const tokens = tokenize(input);
    expect(tokens).to.eql(["int", "max", "(", "int", "foo", ")", "{", "int", "a", "=", "1", "+", "foo", ";", "return", "a", ";", "}"]);
  });

  it("should tokenize array access", () => {
    const input = `int foo = array[i];`;
    const tokens = tokenize(input);
    expect(tokens).to.eql(["int", "foo", "=", "array", "[", "i", "]", ";"]);
  });
});

describe("parser", () => {
  function testSingleStatement(statement, expected) {
    const input = `int main() { ${statement} }`;
    const tokens = tokenize(input);
    const p = new Parser(tokens);
    const result = p.parse();

    expect(result.functions.length).to.equal(1);

    const main = result.functions[0];
    expect(main.statements.length).to.equal(1);

    const parsedStatement = main.statements[0];
    expect(parsedStatement).to.deep.equal(expected);
  }

  describe("declarations", () => {
    it("should parse immediate value: int foo = 1;", () => {
      const input = "int foo = 1;";
      const expected = new Declaration({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new Operand({type: "immediate", value: "1"})
      });

      testSingleStatement(input, expected);
    });

    it("should parse variable: int foo = bar;", () => {
      const input = "int foo = bar;";
      const expected = new Declaration({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new Operand({type: "variable", value: "bar"})
      });

      testSingleStatement(input, expected);
    });

    it("should parse function call: int foo = func(array);", () => {
      const input = "int foo = func(array);";
      const expected = new Declaration({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new FunctionCall({
          functionName: "func",
          args: [
            new CallerArgument({
              value: "array",
              type: "address",
              order: 0,
              dataType: "int*"
            })
          ]
        })
      });

      testSingleStatement(input, expected);
    });

    it("should parse array declaration: int foo[3] = {1, 2, 3};", () => {
      const input = "int foo[3] = {1, 2, 3};";
      const expected = new ArrayDeclaration({
        destination: "foo",
        size: 3,
        values: ["1", "2", "3"]
      });

      testSingleStatement(input, expected);
    });
  });

  describe("assignment", () => {
    it("should parse immediate value: foo = 1;", () => {
      const input = "foo = 1;";
      const expected = new Assignment({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new Operand({type: "immediate", value: 1})
      });

      testSingleStatement(input, expected);
    });

    it("should parse variable value: foo = bar;", () => {
      const input = "foo = bar;";
      const expected = new Assignment({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new Operand({type: "variable", value: "bar"})
      });

      testSingleStatement(input, expected);
    });

    it("should parse binary expression with immediate: foo = bar + 1;", () => {
      const input = "foo = bar + 1;";
      const expected = new Assignment({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new BinaryExpression({
          operator: "+",
          operand1: new Operand({type: "variable", value: "bar"}),
          operand2: new Operand({type: "immediate", value: 1})
        })
      });

      testSingleStatement(input, expected);
    });

    it("should parse binary expression with variable: foo = bar + qux;", () => {
      const input = "foo = bar + qux;";
      const expected = new Assignment({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new BinaryExpression({
          operator: "+",
          operand1: new Operand({type: "variable", value: "bar"}),
          operand2: new Operand({type: "variable", value: "qux"})
        })
      });

      testSingleStatement(input, expected);
    });

    it("should parse function call: foo = func(array);", () => {
      const input = "foo = func(array);";
      const expected = new Assignment({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new FunctionCall({
          functionName: "func",
          args: [
            new CallerArgument({
              value: "array",
              type: "address",
              order: 0,
              dataType: "int*"
            })
          ]
        })
      });

      testSingleStatement(input, expected);
    });

    it("should parse increment: i++", () => {
      const input = "foo++;";
      const expected = new Assignment({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new BinaryExpression({
          operator: "+",
          operand1: new Operand({type: "variable", value: "foo"}),
          operand2: new Operand({type: "immediate", value: 1})
        })
      });

      testSingleStatement(input, expected);
    });

    it("should parse decrement: i--", () => {
      const input = "foo--;";
      const expected = new Assignment({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new BinaryExpression({
          operator: "-",
          operand1: new Operand({type: "variable", value: "foo"}),
          operand2: new Operand({type: "immediate", value: 1})
        })
      });

      testSingleStatement(input, expected);
    });
  });

  describe("if", () => {
    it("should parse if statement", () => {
      const input = "if (a < b) { a = b; }";
      const expected = new If({
        id: 0,
        condition: new BinaryExpression({
          operator: "<",
          operand1: new Operand({type: "variable", value: "a"}),
          operand2: new Operand({type: "variable", value: "b"}),
        }),
        statements: [new Assignment({
          destination: new Operand({type: "variable", value: "a"}),
          operand: new Operand({type: "variable", value: "b"})
        })]
      });

      testSingleStatement(input, expected);
    });
  });

  describe("for", () => {
    // TODO
  });

  describe("function", () => {
    // TODO
  });
});
