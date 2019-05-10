describe("virtual memory", () => {
  it("allocates stack correctly", () => {
    const pm = new PhysicalMemory(1024, 4);
    const es = new ExternalStorage(8192);
    const vm = new VirtualMemory(pm, es, 4);

    vm.allocateStack(0);

    // set last dword in physical memory directly
    pm.setDword(63, "10101111000000001010101000000001");

    // retrieve the last dword in virtual memory and it should be the same
    expect(vm.getDword(0, 4095), "10101111000000001010101000000001");
  });

  it("loads program correctly and can retrieve first page", () => {
    const pm = new PhysicalMemory(1024, 4);
    const es = new ExternalStorage(8192);
    const vm = new VirtualMemory(pm, es, 4);

    const machineCode = "10101010".repeat(15872);
    es.load(machineCode);
    vm.loadProgram(0, machineCode, 15872);

    expect(vm.getDword(0, 0)).to.equal("10101010101010101010101010101010");
  });

  // TODO: test load code page
});