class ExternalStorage {
  constructor(capacityBytes) {
    // Stores a string of bits
    this.storage = "0".repeat(capacityBytes * 8);
  }

  load(data) {
    this.storage = data;
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
      throw new Error("Out of bounds external storage access.");
    }
  }
}