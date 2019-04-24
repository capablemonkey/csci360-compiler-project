describe("cache", () => {
    describe("write", () => {
      it("should write through to cache and memory", () => {
        const memory = new Map();
        const cache = new Cache({ nway: 1, size: 8, k: 2, memory: memory, bits: 16 });
        cache.write({ address: '0000000000000000', data: '00000000000000000000000000000001', memwrite: true });
        expect(cache.read({address: '0000000000000000'})).to.equal("00000000000000000000000000000001");
      });
      /*it("should update access times", () => {
        const memory = new Map();
        const cache = new Cache({ nway: 1, size: 8, k: 2, memory: memory, bits: 16 });
        cache.write({ address: '0000000000000000', data: '00000000000000000000000000000001', memwrite: true });
        expect(cache.read({address: '0000000000000000'})).to.equal("00000000000000000000000000000001");
      });*/
    });
  });