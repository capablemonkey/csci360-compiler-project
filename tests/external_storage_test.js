describe("external storage", () => {
  it("can load program", () => {
    const es = new ExternalStorage(8192); // 8 kb
    const machineCode = "10101010".repeat(8192);
    es.load(machineCode);
    expect(es.getDword(1)).to.equal("10101010101010101010101010101010");
  });

  it("initializes data to 0", () => {
    const es = new ExternalStorage(8192); // 8 kb
    expect(es.getDword(47)).to.equal("00000000000000000000000000000000");
  });

  it("can get and set last dword", () => {
    const es = new ExternalStorage(8192); // 8 kb
    es.setDword(8188, "10101111000000001010101000000001");
    expect(es.getDword(8188)).to.equal("10101111000000001010101000000001");
  });

  it("should raise an error for out of bounds", () => {
    const es = new ExternalStorage(8192); // 8 kb
    expect(() => es.getDword(8192)).to.throw();
  });
});