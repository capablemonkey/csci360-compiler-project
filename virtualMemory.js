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

    this.virtualAddressSpaceMax = 4096; // biggest virtual page number is 4096 / 16 - 1 = 255
    this.stackLimitBytes = 512; // bytes

    // this.pageTable[pid][address] = {"location": "physicalMemory", "pageIndex": 34, "valid": true}
    // this.pageTable[pid][address] = {"location": "external", "pageIndex": 200, "valid": false}
    // maps virtual page number to physical page number
    this.pageTable = {0: {}};

    // temporary, non-LRU way to decide which is the next page to allocate:
    this.lastAllocatedPage = 0;
  }

  getDword(pid, virtualAddress) {
    // locate page
    // move page into memory if needed
    // get Dword from block from page

    const virtualPageIndex = this.getVirtualPageIndex(virtualAddress);
    const pageOffset = this.getPageOffset(virtualAddress);
    const hit = this.pageTable[pid][virtualPageIndex];

    if (!hit) {
      throw new Error(`couldn't find the page for the virtual address ${virtualAddress}`)
    }

    if (hit.location == "physicalMemory" && hit.valid == true) {
      const pageStart = hit.pageIndex * this.pageSize * 4;
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
     return this.physicalMemory.getDword(physicalPageIndex * this.pageSize + pageOffset);
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

  // returns physical page index
  freePage() {
    // TODO: find a free page or choose one to be replaced
    // TODO: if page is being replaced, find the entry in the page table and delete it
    return this.lastAllocatedPage++;
  }

  // sets dword in physical memory where dword is a string of 32 bits
  setDword(pid, virtualAddress, dword) {
    // check pageTable to see if page is in physical memory
    // if in physical memory, then just update dword in physical memory
    // can only set dwords on the stack; not allowed to modify code portion

    const virtualPageIndex = this.getVirtualPageIndex(virtualAddress);
    const pageOffset = this.getPageOffset(virtualAddress);
    const hit = this.pageTable[pid][virtualPageIndex];

    if (!hit) {
      throw new Error(`couldn't find the page for the virtual address ${virtualAddress}`)
    }

    if (hit.location == "physicalMemory" && hit.valid == true) {
      const pageStart = hit.pageIndex * this.pageSize * 4;
      return this.physicalMemory.setDword(pageStart + pageOffset, dword);
    } else {
      throw new Error(`Could not find page for virtual address ${virtualAddress}`);
    }
  }

  allocateStack(pid) {
    // create pages in page table for stack
    // pageTable[255] = {location: "physicalMemory", pageIndex: 64}
    // pageTable[254] = {location: "physicalMemory", pageIndex: 63}

    const stackPageCount = this.stackLimitBytes / 16; // 4 dwords = 16 bytes per page
    for (let i = 0; i < stackPageCount; i++) {
      const virtualPageNumber = 255 - i;
      const physicalPageNumber = 63 - i;

      this.pageTable[pid][virtualPageNumber] = {location: "physicalMemory", pageIndex: physicalPageNumber, valid: true};
    }
  }

  loadProgram(pid, externalStorageStartAddress, lengthBytes) {
    // fill the page table with the pages in the externalStorage, but no pages need to be loaded
    // pageTable[0] => {location: externalStorage, pageIndex: 0}
    // pageTable[1] => {location: externalStorage, pageIndex: 1}

    const programPageCount = lengthBytes / 16; // 4 dwords = 16 bytes per page
    for (let i = 0; i < programPageCount; i++) {
      const virtualPageNumber = i;
      const physicalPageNumber = i;

      this.pageTable[pid][virtualPageNumber] = {location: "externalStorage", pageIndex: physicalPageNumber, valid: true};
    }

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
  // total virtual address space = 2 ^ 12 bytes = 4096 bytes = 1024 dwords
  // physical memory is 1024 bytes = 2^10
  // stack limit: 512 bytes (we always keep these pages around)
  // remaining for code pages = 512 bytes = 32 pages
  //
  // 10 pages = 160 bytes = 40 instructions * 4 bytes/instruction
  // to fill up all the code pages, we need at least 512 bytes = 128 instructions
  // 
  // total addressable code: 4096 bytes = 1024 dwords = 256 pages

  getVirtualPageIndex(virtualAddress) {
    return Math.floor(virtualAddress / 16);
  }

  getPageOffset(virtualAddress) {
    return virtualAddress % 16;
  }
}