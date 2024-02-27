import {ResponseCache as Cache} from "../src/index";
import {CacheConfigType} from "../src/types/index.type";

describe("Cache service initialization", () => {
   let cache: Cache;
   const config: CacheConfigType = {
      isDevMode: false,
      paramsObjectOverwritesUrlQueries: false,
      preventSecondCallIfDataIsUnchanged: false,
      removeNullValues: false,
      devtool: {
         show: false,
         isOpenInitially: false,
         styles: {
            zIndex: 9999,
            toggleButtonPosition: {
               bottom: 32,
               right: 32,
            },
         },
      },
   };

   beforeAll(() => {
      cache = new Cache(config);
   });

   it("Initializes the config correctly.", () => {
      expect(cache.config).toEqual(config);
   });

   it("Initializes the variables correctly.", () => {
      expect(cache.data).toEqual({});
      expect(cache.observables).toEqual({});
      expect(cache.clearTimeouts).toEqual({});
   });
});
