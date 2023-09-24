import {Observable} from "rxjs";
import {CacheService} from "../src/cache.service";

describe("Cache service initialization", () => {
   let cacheService: CacheService;
   const config = {
      isDevMode: false,
      observableConstructor: Observable,
   };

   beforeEach(() => {
      cacheService = new CacheService(config);
   });

   it("Initializes the variables correctly.", () => {
      expect(cacheService.config).toEqual(config);
      expect(cacheService.cachedData).toEqual({});
      expect(cacheService.observables).toEqual({});
      expect(cacheService.clearTimeouts).toEqual({});
   });
});
