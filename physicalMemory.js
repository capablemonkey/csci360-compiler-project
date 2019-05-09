class PhysicalMemory {
  constructor(capacityBytes, pageSize) {
    // Stores a string of bits
    this.storage = "0".repeat(capacityBytes * 8);
    this.pageSize = pageSize; // number of dwords per page
    this.capacityPages = Math.floor(capacityBytes / (pageSize * 4));
    this.usedPageCount = 0;
  }

  // returns the 32 bits (dword) at address
  getDword(address) {
    const dwordStart = address * 32;
    this.checkBounds(dwordStart);

    return this.storage.slice(dwordStart, dwordStart + 32);
  }

  // sets the 32 bit string dword at the address
  setDword(address, dword) {
    const dwordStart = address * 32;
    this.checkBounds(dwordStart);

    let k = this.storage.split("");
    k.splice(dwordStart, 32, dword);
    this.storage = k.join("");
  }

  checkBounds(dwordStart) {
    if (dwordStart + 32 > this.storage.length) {
      throw new Error("Out of bounds physical memory access.");
    }
  }
}