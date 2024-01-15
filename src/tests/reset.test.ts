import {lastValueFrom} from "rxjs";
import {CacheService} from "../cache.service";
import {postsUrl} from "./server/urls";
import {observableFunction} from "./utils/observable-function";

describe("Cache service initialization", () => {
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

      cacheService.resetCache();

      expect(cacheService.cachedData).toEqual({});
      expect(cacheService.observables).toEqual({});
      expect(cacheService.clearTimeouts).toEqual({});
   });
});
