import {Observable, firstValueFrom, lastValueFrom} from "rxjs";
import {CacheService} from "../src/cache.service";
import {observableFunction} from "./utils/observable-function";
import {currentCounterUrl, firstPostUrl, resetCounterUrl} from "./server/urls";
import {posts} from "./server/posts";

describe("Cache service storing responses", () => {
   let cacheService: CacheService;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
      });
   });

   it("Fetches and stores the response and the observable correctly.", async () => {
      const response = await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: firstPostUrl,
            observable: (url) => observableFunction(url),
         })
      );

      expect(response).toEqual(posts[0]);
      expect(cacheService.cachedData).toEqual({
         [firstPostUrl]: posts[0],
      });
      expect(cacheService.observables[firstPostUrl]).toBeTruthy();
   });

   it("Uses the cache if data is already present and does not call the api again if `refresh=false`.", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
         })
      );

      const anotherCall = await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
         })
      );

      expect(anotherCall).toEqual({counter: 1});
      expect(cacheService.cachedData).toEqual({
         [currentCounterUrl]: {counter: 1},
      });
   });

   it("Uses the cache and refreshes the data correctly if `refresh=true`.", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
         })
      );

      // the cache is going to be used and the firstValueFrom will return counter = 1
      // the lastValueFrom would be 2 but there is no way to log it here
      await firstValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
            refresh: true,
         })
      );

      expect(cacheService.cachedData).toEqual({
         [currentCounterUrl]: {counter: 1},
      });

      // this is a brand new api call, the firstValueFrom would be equal to 2,
      // but there is no way to log it here
      // we expect the lastValueFrom to be 3
      const anotherCallLastResponse = await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
            refresh: true,
         })
      );

      expect(anotherCallLastResponse).toEqual({counter: 3});
      expect(cacheService.cachedData).toEqual({
         [currentCounterUrl]: {counter: 3},
      });
   });
});
