import {CacheService} from "../src/cache.service";
import {Observable, lastValueFrom} from "rxjs";
import {currentCounterUrl, postsUrl, resetCounterUrl} from "./server/urls";
import {observableFunction} from "./utils/observable-function";
import {pause} from "./utils/pause";

describe("Cache service timeouts", () => {
   let cacheService: CacheService;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
      });
   });

   it("Clears the data, observable and clear timeout after provided time if refresh=false.", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
            clearTime: 200,
         })
      );

      expect(cacheService.clearTimeouts[currentCounterUrl]).toBeTruthy();
      await pause(300);
      checkVariablesToBeEmpty(cacheService);
   });

   it("Clears the data, observable and clear timeout after provided time if refresh=false event if api is called several times.", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
            clearTime: 200,
         })
      );

      await pause(150);
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
            clearTime: 200,
         })
      );

      await pause(100);
      checkVariablesToBeEmpty(cacheService);
   });

   it("Refreshes the data and clear timeout after provided time if refresh=true.", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
            refresh: true,
            clearTime: 200,
         })
      );

      expect(cacheService.clearTimeouts[currentCounterUrl]).toBeTruthy();
      expect(cacheService.cachedData).toEqual({
         [currentCounterUrl]: {counter: 1},
      });

      const oldTimeouts = cacheService.clearTimeouts;

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
            refresh: true,
            clearTime: 200,
         })
      );

      expect(cacheService.clearTimeouts[currentCounterUrl]).toBeTruthy();
      expect(cacheService.cachedData).toEqual({
         [currentCounterUrl]: {counter: 2},
      });

      const newTimeouts = cacheService.clearTimeouts;
      expect(oldTimeouts).not.toEqual(newTimeouts);

      await pause(300);
      checkVariablesToBeEmpty(cacheService);
   });

   it("Clears the previous timeout if new timeout has been set.", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
            refresh: true,
            clearTime: 300,
         })
      );
      await pause(200);

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
            refresh: true,
            clearTime: 300,
         })
      );
      await pause(200);

      expect(cacheService.cachedData[postsUrl]).toBeTruthy();
   });
});

function checkVariablesToBeEmpty(cacheService: CacheService) {
   expect(cacheService.cachedData).toEqual({});
   expect(cacheService.observables).toEqual({});
   expect(cacheService.clearTimeouts).toEqual({});
}
