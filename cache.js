// Split apart data and instruction cache for xtra points
// use a system bus to bring blocks to CPU for extra points
/* Cache object modeling 32 bit system */
// 5/7 project 2 deadline
// final exam 5/14 deadline
// implement N way set association
// 
class Cache {
    constructor({nway, size, k, memory}) {
        this.size = size;
        this.k = k;
        this.nway = nway;
        this.cache = new Array(nway).fill(new Array(size).fill(new Array(k).fill('0000'))); // 3D array for n-way set association
        this.printSnapshot();
        //this.assembleMockCache();
        this.memory = memory;
        //this.printSnapshot();
    }

    read(address) {
        const cacheIndex = this.isCacheHit(address);
        if (cacheIndex >= 0) {
            const index = this.getIndex(address);
            const offset = this.getOffset(address);
            return this.cache[cacheIndex][index][offset];
        } else {
            // pull from memory
            const data = this.memory.get(address);
            this.write(address, data); // allocate to cache
        }
        return data;
    }

    write(address, data) {
        let index = this.getIndex(address);
        let offset = this.getOffset(address);
        this.memory.set(address, data); // write through //
    }

    // searches n-way cache and returns the i'th cache if data exists in cache, else returns -1
    isCacheHit(address) {
        const index = this.getIndex(address);
        const offset = this.getOffset(address);
        const indexBits = Math.log(this.size);
        const offsetBits = Math.log(this.k);
        const tagBits = address.length-indexBits-offsetBits;
        const tag = address.substring(0, tagBits);
        for (let i = 0; i < this.cache.length; i++) {
            const cacheTag = this.cache[i][index][offset].substring(0, tagBits);
            if (tag == cacheTag)
                return i
        } return -1;
    }

    getOffset(address) {
        let offsetBinary = address.substring(address.length- (Math.log(this.k) / Math.log(2)));
        console.log(offsetBinary);
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
        //let i = 0;
        /*for (let j = 0; j < this.cache[i].length; j++) { 
            let line = '';
            for(let k = 0; k < this.cache[i][j].length; k++) {
                for (i = 0; i < this.cache.length; i++)
                    line += `${this.cache[i][j][k]}  `;
                i=0;
            }
        }*/
    }

    assembleMockCache() {
        const cache = this.cache;
        for (let i = 0; i < cache.length; i++) {
            for (let j = 0; j < cache[i].length; j++) {
                for (let k = 0; k < cache[i][j].length; k++) {
                    let data = '';
                    for (let l = 0; l < 8; l++)
                        data += (Math.round(1000*Math.random() % 10)).toString();
                    cache[i][j][k] = data;
                }
            }
        }
    }

}
