class ExternalStorage {
  constructor() {
    // Stores a string of bits
    this.storage = "";
  }

  load(data) {
    this.storage = data;
  }

  // returns the 32 bits (dword) at address
  getDword(address) {
    const dwordStart = address * 4 * 8;
    this.checkBounds(dwordStart);

    return this.storage.slice(dwordStart, dwordStart + 32);
  }

  // sets the 32 bit string dword at the address
  setDword(address, dword) {
    const dwordStart = address * 4 * 8;
    this.checkBounds(dwordStart);

    this.storage.splice(dwordStart, 32, dword);
  }

  checkBounds(dwordStart) {
    if (dwordStart + 32 >= this.storage.length) {
      throw new Error("Out of bounds external storage access.");
    }
  }
}