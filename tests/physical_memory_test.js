describe("physical memory", () => {
  it("data is initialized to 0", () => {
    const pm = new PhysicalMemory(64, 4);
    expect(pm.getDword(5)).to.equal("00000000000000000000000000000000");
  });

  it("can set and get a dword", () => {
    const pm = new PhysicalMemory(64, 4);
    pm.setDword(3, "10101111000000001010101000000001");
    expect(pm.getDword(3)).to.equal("10101111000000001010101000000001");
  });

  it("should be able to get and set last dword", () => {
    const pm = new PhysicalMemory(64, 4);
    pm.setDword(60, "10101111000000001010101000000001");
    expect(pm.getDword(60)).to.equal("10101111000000001010101000000001");
  });

  it("should raise an error for out of bounds", () => {
    const pm = new PhysicalMemory(64, 4);
    expect(() => pm.getDword(64)).to.throw();
  });
});