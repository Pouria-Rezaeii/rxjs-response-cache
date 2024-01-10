import {Observable} from "rxjs";
import {CacheService} from "../cache.service";
import {CacheConfigType} from "../types/cache.type";

describe("Cache service initialization", () => {
   let cacheService: CacheService;
   const config: CacheConfigType = {
      isDevMode: false,
      paramsObjectOverwritesUrlQueries: false,
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
      cacheService = new CacheService(config);
   });

   it("Initializes the config correctly.", () => {
      expect(cacheService.config).toEqual(config);
   });

   it("Initializes the variables correctly.", () => {
      expect(cacheService.cachedData).toEqual({});
      expect(cacheService.observables).toEqual({});
      expect(cacheService.clearTimeouts).toEqual({});
   });
});
