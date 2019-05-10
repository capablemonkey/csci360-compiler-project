describe("end-to-end", () => {
  it("should compile basic function", () => {
    const tokens = tokenize("int main() { int foo = 3; return foo; }")
    const result = compile(tokens);
    const expected = `
main():
push rbp
mov rbp, rsp
sub rsp, 4
mov DWORD PTR [rbp - 4], 3
mov eax, DWORD PTR [rbp - 4]
pop rbp
ret
`;

    expect(result.output).to.equal(expected.trim());
  });

  it("should compile multiple functions", () => {
    // TODO
  });
});