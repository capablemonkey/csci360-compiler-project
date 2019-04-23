// Split apart data and instruction cache for xtra points
// use a system bus to bring blocks to CPU for extra points
/* Cache object modeling 32 bit system */
// 5/7 project 2 deadline
// final exam 5/14 deadline
// implement N way set association
// 
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
        this.cache = Array.from({length: nway},
            () => Array.from({length: size},
                () => Array.from({length: k},
                    () => {
                        return {
                            data: '0'.repeat(bits+32), // bits for address + 32 bits for data
                            time: 0
                        }
                    }))); // 3D array for n-way set association
        this.printSnapshot();
        this.memory = memory;
    }

    read({address: address}) {
        const setIndex = this.isCacheHit(address);
        if (setIndex >= 0) { // if it was found
            const { index, offset } = this.extractBits(address);
            const data = this.cache[setIndex][index][offset].data;
            this.updateTimes({ setIndex: setIndex, index: index, offset: offset });
            return data; // should return the data not the address
        }
        // pull from memory
        const data = this.memory.get(address);
        this.write({address: address, data: data, memwrite: false}); // no memwrite

        return data;
    }

    // writes a piece of data from an address to the cache
    write({address, data, memwrite }) {
        const { index, offset, tag } = this.extractBits(address);
        const setIndex = this.isCacheHit(address);
        
        if (setIndex >= 0) { // already in the cache, update it there
            this.cache[setIndex][index][offset].data = `${1}${tag}${data}`;
        } else { // not in the cache, we need to bring it into the cache 
            const {setIndex, offset} = this.lruReplacement({ index });
            this.cache[setIndex][index][offset].data = `${1}${tag}${data}`;
        }
        this.updateTimes({ setIndex: setIndex, index: index, offset: offset });
        if (memwrite) this.memory.set(address, data); // write through //
    }

    // searches n-way cache and returns the i'th cache if data exists in cache, else returns -1
    isCacheHit(address) {
        const { index, offset, tag, tagBits } = this.extractBits(address);
        for (let i = 0; i < this.cache.length; i++) {
            // start substring @ 1 to skip the valid bit, tagBits+1 to get whole tag
            const cacheTag = this.cache[i][index][offset].data.substring(1, tagBits+1);
            if (tag == cacheTag) return i
        } return -1;
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
        let offsetBinary = address.substring(address.length- (Math.log(this.k) / Math.log(2)));
        return this.toDecimal(offsetBinary);
    }

    // Returns the block index of an address in cache //  
    getIndex(address) {
        return this.toDecimal(address) % this.size;
    }

    toDecimal(address) {
        let dec = 0;
        for (let i = address.length-1; i >= 0; i--) {
            let pow = 32 - i;
            dec += Number(address[i]) * Math.pow(2, pow);
        } return dec;
    }

    // horizontally prints a snapshot of the entire cache
    printSnapshot() {
        console.log(JSON.stringify(this.cache));
    }

    // Finds the least recently used piece of cache, stores in on memory, and returns indices for replacing data
    lruReplacement({ index }) {
        let minIndices = { setIndex: 0, index: index, offset: 0 };
        let minTime = 9999999999;
        for (let i = 0; i < this.cache.length; i++) // for every set
            for (let k = 0; k < this.cache[i][index].length; k++) // for every block offset at this set and index
                if (this.cache[i][index][k].data[0] == 0) { // if valid bit == 0, nothing at this index
                    minIndices.setIndex = i;
                    minIndices.offset = k;
                    return minIndices;
                } else if (this.cache[i][index][k].time < minTime) {
                    minTime = this.cache[i][index][k].time;
                    minIndices.setIndex = i;
                    minIndices.offset = k;
                }
        // if replacing write replaced one to memory
        return minIndices;
    }

    // increments all times in the cache, and resets the time at provided indices
    updateTimes({ setIndex, index, offset}) {
        for (let i = 0; i < this.cache.length; i++)
            for (let j = 0; j < this.cache[i].length; j++)
                for (let k = 0; k < this.cache[i][j].length; k++)
                    this.cache[i][j][k].time++;
        
        if (setIndex != -1)this.cache[setIndex][index][offset].time = 0;
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
