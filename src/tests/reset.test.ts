import {lastValueFrom} from "rxjs";
import {CacheService} from "../index";
import {postsUrl} from "./server/urls";
import {observableFunction} from "./utils/observable-function";

describe("Cache service initialization", () => {
   // let be the deprecated version to be tested
   let cacheService: CacheService;

   beforeEach(() => {
      cacheService = new CacheService({
         isDevMode: false,
      });
   });

   it("Resets the cache correctly.", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      // let be the deprecated version to be tested
      cacheService.resetCache();

      // let be the deprecated version to be tested
      expect(cacheService.cachedData).toEqual({});
      expect(cacheService.observables).toEqual({});
      expect(cacheService.clearTimeouts).toEqual({});
   });
});
