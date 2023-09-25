import {Observable, lastValueFrom} from "rxjs";
import {CacheService} from "../cache.service";
import {postsUrl} from "./server/urls";
import {observableFunction} from "./utils/observable-function";

describe("Cache service initialization", () => {
   let cacheService: CacheService;

   beforeEach(() => {
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
      });
   });

   it("Resets the cache correctly.", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
         })
      );

      cacheService.resetCache();

      expect(cacheService.cachedData).toEqual({});
      expect(cacheService.observables).toEqual({});
      expect(cacheService.clearTimeouts).toEqual({});
   });
});
