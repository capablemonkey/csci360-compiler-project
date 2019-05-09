class VirtualMemory {
  // add code area: memory address 0 and onwards
  // add data area: memory address max and grows downwards

  // BECAUSE WE DON'T HAVE SWAPPING, We cannot ever evict the stack from physical memory

  /*

  ===============     Highest Address (e.g. 0xFFFF)
  |             |
  |    STACK    |
  |             |
  |.............|  <- Old Stack Pointer (e.g. 0xEEEE)
  |             |
  | Newly       |
  | allocated   |
  |-------------|  <- New Stack Pointer (e.g. 0xAAAA)
  .     ...     .
  |             |
  |-------------|
  |             |
  |    CODE     |
  |             |
  ===============     Lowest Address    (e.g. 0x0000)
   */

  // virtual memory: [0-3584: code], [4096 -> 3584] stack
  constructor(physicalMemory, externalStorage, pageSize) {
    this.physicalMemory = physicalMemory;
    this.externalStorage = externalStorage;
    this.pageSize = pageSize; // number of dwords per page

    this.virtualAddressSpaceMax = 4096;
    this.stackLimit = 512; // bytes

    // this.pageTable[pid][address] = {"location": "physicalMemory", "pageIndex": 34, "valid": true}
    // this.pageTable[pid][address] = {"location": "external", "pageIndex": 200, "valid": false}
    // maps virtual page number to physical page number
    this.pageTable = {};
  }

  getDword(pid, virtualAddress) {
    // locate page
    // move page into memory if needed
    // get Dword from block from page

    const virtualPageIndex = this.getVirtualPageIndex(virtualAddress);
    const pageOffset = this.getVirtualPageOffset(virtualAddress);
    const hit = this.pageTable[pid][virtualPageIndex];

    if (hit && hit.location == "physicalMemory" && hit.valid == true) {
      const pageStart = hit.pageIndex * this.pageSize * 4; // 4 dwords
      return this.physicalMemory.getDword(pageStart + pageOffset);
    } else {
      // its on external storage, so load into physical memory
      const physicalPageIndex = this.loadPageToPhysicalMemory(hit.pageIndex);

      // update virtual page table
      this.pageTable[pid][virtualPageIndex] = {
        location: "physicalMemory",
        pageIndex: physicalPageIndex,
        valid: true
      };

     // read from physical memory
     return this.physicalMemory.getDword(physicalPageIndex * this.pageSize * 4 + pageOffset);
    }
  }

  loadPageToPhysicalMemory(externalStoragePageIndex) {
    // find a page to free up in physical memory
    // load all the dwords from the external page into the physical page
    const freePageIndex = this.freePage();
    const physicalMemoryPageStartAddress = freePageIndex * this.pageSize * 4;
    const externalStoragePageStartAddress = externalStoragePageIndex * this.pageSize * 4;

    for (let i = 0; i < this.pageSize; i++) {
      const dword = this.externalStorage.getDword(externalStoragePageStartAddress + i * 4);
      this.physicalMemory.setDword(physicalMemoryPageStartAddress + i * 4, dword);
    }

    return freePageIndex;
  }

  // finds a free page or chooses one to be replaced
  // returns physical page index
  freePage() {
    return 0;
  }

  // sets dword in physical memory where dword is a string of 32 bits
  setDword(pid, virtualAddress, dword) {
    // check pageTable to see if page is in physical memory
    // if in physical memory, then just update dword in physical memory
    // otherwise, load from disk into physical memory and then set dword in physical memory

    const virtualPageIndex = this.getVirtualPageIndex(virtualAddress);
    const pageOffset = this.getVirtualPageOffset(virtualAddress);
    const hit = this.pageTable[pid][virtualPageIndex];

    if (hit.location == "physicalMemory" && hit.valid == true) {
      const pageStart = hit.pageIndex * this.pageSize * 4; // 4 dwords
      return this.physicalMemory.setDword(pageStart + pageOffset, dword);
    } else {
      // its on external storage, so load into physical memory
      const physicalPageIndex = this.loadPageToPhysicalMemory(hit.pageIndex);

      // update virtual page table
      this.pageTable[pid][virtualPageIndex] = {
        location: "physicalMemory",
        pageIndex: physicalPageIndex,
        valid: true
      };

     // read from physical memory
     return this.physicalMemory.setDword(physicalPageIndex * this.pageSize * 4 + pageOffset, dword);
    }
  }

  allocateStack(pid) {
    // create pages in page table for stack
    // pageTable[255] = {location: "physicalMemory", pageIndex: 64}
    // pageTable[254] = {location: "physicalMemory", pageIndex: 63}
    // ...
    // pageTable[223] = {location: "physicalMemory", pageIndex: 32}
  }


  loadProgram(pid, externalStorageStartAddress, lengthDword) {
    // TODO: fill the page table with the pages in the externalStorage, but no pages need to be loaded
    // pageTable[0] => {location: externalStorage, pageIndex: 0}
    // pageTable[1] => {location: externalStorage, pageIndex: 1}
    //
    //
    // for (const i = 0; i < lengthDword; i++) {
    //   const dword = this.externalStorage.getDword(externalStorageStartAddress + i * 32);

    //   const virtualAddress = i * 4;
    //   this.setDword(pid, virtualAddress, dword);
    // }

    this.allocateStack(pid);
  }

  // virtual address:
  // 1000 1001 1011
  // \-------/ \--/
  //  vpage     offset
  //  
  // virtual page index: 1000 1001
  // offset: 1011
  // 
  // 1 page             = 4 dwords per page
  //                    = 4 instructions per page
  //                    = 16 bytes
  // 
  // total virtual address space = 2 ^ 12 = 4096 addresses
  // physical memory is 1024 bytes = 2^10
  // stack limit: 512 bytes (we always keep these pages around)
  // remaining for code pages = 512 bytes = 32 pages
  //
  // 10 pages = 160 bytes = 40 instructions * 4 bytes/instruction
  // to fill up all the code pages, we need at least 512 bytes = 128 instructions
  // 

  getVirtualPageIndex(virtualAddress) {
    return Math.floor(virtualAddress / (this.pageSize * 4));
  }

  getPageOffset(virtualAddress) {
    return virtualAddress % (this.pageSize * 4);
  }
}