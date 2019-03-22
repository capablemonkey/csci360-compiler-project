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
  describe("declarations", () => {
    it("should parse: int foo = 1;", () => {
      const input = "int main() { int foo = 1; }";
      const tokens = tokenize(input);
      const p = new Parser(tokens);
      const result = p.parse();

      expect(result.functions.length).to.equal(1);

      const main = result.functions[0];
      expect(main.statements.length).to.equal(1);

      const statement = main.statements[0];

      const expected = new Declaration({
        destination: new Operand({type: "variable", value: "foo"}),
        operand: new Operand({type: "immediate", value: "1"})
      });

      expect(statement).to.deep.equal(expected);
    });
  });
});
