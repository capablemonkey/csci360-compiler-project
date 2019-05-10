describe("virtual memory", () => {
  it("allocates stack correctly", () => {
    const pm = new PhysicalMemory(1024, 4);
    const es = new ExternalStorage(8192);
    const vm = new VirtualMemory(pm, es, 4);

    vm.allocateStack(0);

    // set last dword in physical memory directly
    pm.setDword(63, "10101111000000001010101000000001");

    // retrieve the last dword in virtual memory and it should be the same
    expect(vm.getDword(0, 4092), "10101111000000001010101000000001");
  });

  it("loads program correctly and can retrieve first page", () => {
    const pm = new PhysicalMemory(1024, 4);
    const es = new ExternalStorage(8192);
    const vm = new VirtualMemory(pm, es, 4);

    const machineCode = "10101010".repeat(4096);
    es.load("10000000000000000000000000000001" + machineCode);
    vm.loadProgram(0, 0, 4096);

    expect(vm.getDword(0, 0)).to.equal("10000000000000000000000000000001");
  });

  it("should load an entire page from external storage when requested page is not in physical memory", () => {
    const pm = new PhysicalMemory(1024, 4);
    const es = new ExternalStorage(8192);
    const vm = new VirtualMemory(pm, es, 4);

    const machineCode = "10101010".repeat(4096);
    es.load("10000000000000000000000000000001" + machineCode);
    vm.loadProgram(0, machineCode, 4096);

    // get dword at virtual address 0 to cause vm to load the first page from es into pm:
    vm.getDword(0, 0);

    // check contents of memory:
    expect(pm.getDword(0)).to.equal("10000000000000000000000000000001");
    expect(pm.getDword(1)).to.equal("10101010101010101010101010101010");
    expect(pm.getDword(2)).to.equal("10101010101010101010101010101010");
    expect(pm.getDword(3)).to.equal("10101010101010101010101010101010");

    // adjacent dword should be untouched at this point:
    expect(pm.getDword(4)).to.equal("00000000000000000000000000000000");
  });

  it("should write to the correct place in physical memory", () => {
    const pm = new PhysicalMemory(1024, 4);
    const es = new ExternalStorage(8192);
    const vm = new VirtualMemory(pm, es, 4);

    vm.allocateStack(0);

    // set last dword in virtual memory
    vm.setDword(0, 1023, "10101111000000001010101000000001");

    // retrieve the last dword in physical memory and it should be the same
    expect(pm.getDword(255), "10101111000000001010101000000001");

    // the last dword in virtual memory should also be the same
    expect(vm.getDword(0, 1023), "10101111000000001010101000000001");
  });

  it("should evict the correct code page in physical memory when out of space");

  it("should never evict a stack page");

  // TODO: test load code page
});