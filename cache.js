/* Cache object modeling 32 bit system */
class Cache {
    constructor(size, k, memory) {
        this.size = size;
        this.k = k;
        this.cache = Array(size).fill(Array.size(k));
        this.memory = memory;
    }

    read(address) {
        if (this.isCacheHit(address)) {
            let index = this.getIndex(address);
            let offset = this.getOffset(address);
            return this.cache[index][offset];
        } else { // pull from memory

        }
        
    }

    write(address) {
        let index = this.getIndex(address);
        let offset = this.getOffset(address);
        // insert write to memory code since write-through
    }

    isCacheHit(address) {
        const index = this.getIndex(address);
        const offset = this.getOffset(address);
        const indexBits = Math.log(this.size);
        const offsetBits = Math.log(this.k);
        const tagBits = address.length-indexBits-offsetBits;
        const tag = address.substring(0, tagBits);
        const cacheTag = this.cache[index][offset].substring(0, tagBits); 
        return tag == cacheTag;
    }

    writeToMemory() {

    }

    getOffset(address) {
        let offsetBinary = address.substring(address.length-Math.log(k));
        return this.toDecimal(address);
    }

    // Returns the block index of an address in cache //  
    getIndex(address) {
        return this.toDecimal(address) % size;
    }

    toDecimal(address) {
        let dec = 0;
        for (let i = address.length; i >= 0; i--) {
            let pow = 32 - i;
            dec += address[i].toInteger() * Math.pow(2, pow);
        } return dec;
    }

}
