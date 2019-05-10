class Cache {
    /* 
        nway: the degree of set association
        size: the size of each set (number of blocks)
        k: the size of a block
        bits: the number of bits in an address
    */
    constructor({nway, size, k, memory, bits}) {
        this.size = size;
        this.k = k;
        this.nway = nway;
        this.bits = bits;
        this.statistics = { accesses: 0, misses: 0, total: 0 };
        this.cache = Array.from({length: nway},
            () => Array.from({length: size},
                () => Array.from({length: k},
                    () => {
                        return {
                            data: '0'.repeat(bits+32), // bits for address + 32 bits for data
                            time: 0
                        }
                    }))); // 3D array for n-way set association
        //this.printSnapshot();
        this.memory = memory;
    }

    // getDword({address}) {
    //     console.log("trying to get address", address)
    //     return this.memory.getDword(0, address);
    // }

    getDword({ address }) {
        address = address.toString(2).padStart(this.bits, 0);
        let setIndex = this.isCacheHit(address);
        const { index, offset, tag } = this.extractBits(address);
        if (setIndex >= 0) { // if it was found
            // get the data minus the valid bit and the tags length
            const data = this.cache[setIndex][index][offset].data.substr(1+tag.length);
            this.updateTimes({ setIndex: setIndex, index: index, offset: offset });
            this.recordAccess();
            return data; // should return the data not the address
        }
        // pull from memory
        setIndex = this.lruReplacement({address: address}).setIndex
        
        const decimalAddress = this.toDecimal(address); // translate to decimal | WHAT PART OF THE ADDRESS 
        const blockStartAddress = decimalAddress - 4*offset; // go to start of block
        let returnData = '';
        console.log("address:", address);
        console.log("blockStartAddress:", blockStartAddress);
        console.log("decimalAddress:", decimalAddress);
        for (let b = 0; b < this.k; b++) { // iterate k forward
            const currentAddress = blockStartAddress + 4*b;
            const currentTag = this.extractBits(currentAddress.toString(2).padStart(this.bits, 0)).tag;
            const data = this.memory.getDword(0, currentAddress);
            if (b == offset) {
                returnData = data;
            }
            console.log("index", index)
            console.log("setIndex", setIndex)
            console.log("b", b)
            this.cache[setIndex][index][b].data = `${1}${currentTag}${data}`;// load all into blocks
            this.cache[setIndex][index][b].time = 0;
        }
        this.recordMiss();
        return returnData;
    }

    // writes a piece of data from an address to the cache
    setDword({  address, data, memwrite = true }) {
        address = address.toString(2).padStart(this.bits, 0);
        const { index, offset, tag } = this.extractBits(address);
        const setIndex = this.isCacheHit(address);
        const decimalAddress = this.toDecimal(address);

        if (setIndex >= 0) { // already in the cache, update it there
            this.cache[setIndex][index][offset].data = `${1}${tag}${data}`;
            this.recordAccess();
        } else { // not in the cache, we need to bring it into the cache 
            const {setIndex, offset} = this.lruReplacement({ address: address });
            this.cache[setIndex][index][offset].data = `${1}${tag}${data}`;
        }
        this.updateTimes({ setIndex: setIndex, index: index, offset: offset });
        if (memwrite) this.memory.setDword(0, decimalAddress, data); // write through //
    }

    // searches n-way cache and returns the i'th cache if data exists in cache, else returns -1
    isCacheHit(address) {
        const { index, offset, tag, tagBits } = this.extractBits(address);
        for (let i = 0; i < this.cache.length; i++) {
            // start substring @ 1 to skip the valid bit, tagBits+1 to get whole tag
            const data = this.cache[i][index][offset].data;
            const cacheTag = this.cache[i][index][offset].data.substring(1, tagBits+1);
            if (data[0] == '1' && tag == cacheTag) return i
        }
         return -1;
    }

    // Extracts info from bits given an address 
    extractBits(address) {
        const index = this.getIndex(address);
        const offset = this.getOffset(address);
        const indexBits = Math.log(this.size) / Math.log(2);
        const offsetBits = Math.log(this.k) / Math.log(2);
        const tagBits = address.length-indexBits-offsetBits;
        const tag = address.substring(0, tagBits);
        return { index: index, offset: offset, tag: tag, tagBits: tagBits };
    }

    getValidBit(address) {
        const index = this.getIndex(address);
        const offset = this.getOffset(address);
    }

    getOffset(address) {
        if (this.k == 1) {
            return 0;
        }
        const offsetBinary = address.substring(address.length - (Math.log(this.k) / Math.log(2)));
        return this.toDecimal(offsetBinary);
    }

    // Returns the block index of an address in cache //  
    getIndex(address) {
        return this.toDecimal(address) % this.size;
    }

    toDecimal(address) {
        return parseInt(address, 2);
    }

    // horizontally prints a snapshot of the entire cache
    printSnapshot() {
        console.log(JSON.stringify(this.cache));
    }

    // Finds the least recently used piece of cache, stores in on memory, and returns indices for replacing data
    lruReplacement({ address }) {
        let { index, offset } = this.extractBits(address);
        let maxIndices = { setIndex: 0, index: index, offset: offset };
        let maxTime = Number.MIN_VALUE;
        for (let i = 0; i < this.cache.length; i++) // for every set
            if (this.cache[i][index][offset].data[0] == 0) { // if valid bit == 0, nothing at this index
                maxIndices.setIndex = i;
                this.recordMiss();
                return maxIndices;
            } else if (maxTime < this.cache[i][index][offset].time) {
                maxTime = this.cache[i][index][offset].time;
                maxIndices.setIndex = i;
            }
        // if replacing write replaced one to memory
        this.recordReplacement();
        return maxIndices;
    }

    // increments all times in the cache, and resets the time at provided indices
    updateTimes({ setIndex, index, offset }) {
        for (let i = 0; i < this.cache.length; i++)
            for (let j = 0; j < this.cache[i].length; j++)
                for (let k = 0; k < this.cache[i][j].length; k++)
                    this.cache[i][j][k].time++;
        
        if (setIndex != -1)this.cache[setIndex][index][offset].time = 0;
    }

    recordReplacement() {
        this.statistics.replacements++;
        this.statistics.total++;
    }

    recordMiss() {
        this.statistics.misses++;
        this.statistics.total++;
    }

    recordAccess() {
        this.statistics.total++;
    }

    getReplacementRate() {
        return this.replacementData.replcements / this.replacementData.total;
    }

    // miss rate function, what is the rate in which we are misses / reads and -- writes replacing / writes  //
    getMissRate() {
        return this.missData.misses / this.missData.total; 
    }

    // initializes 3D array for n-way set association
    initializeCache() {
        this.cache = Array.from({length: nway},
            () => Array.from({length: size},
                () => Array.from({length: k},
                    () => {
                        return {
                            data: '0'.repeat(bits),
                            time: 0
                        }
                    }))); 
    }

}