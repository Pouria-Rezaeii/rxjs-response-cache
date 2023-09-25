import {CacheService} from "../cache.service";
import {Observable, firstValueFrom, lastValueFrom} from "rxjs";
import {observableFunction} from "./utils/observable-function";
import {notFoundException, internalServerErrorException} from "./server/errors";
import {resetCounterUrl, currentCounterUrl} from "./server/urls";

describe("Cache service error handling", () => {
   let cacheService: CacheService;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
      });
   });

   it("Throws the error correctly if request fails.", async () => {
      try {
         await firstValueFrom(
            cacheService.get<Observable<unknown>>({
               url: "/not-exist-rul",
               observable: (url) => observableFunction(url),
            })
         );
      } catch (error) {
         expect(error).toEqual(notFoundException);
      }
   });

   // TODO: maybe this behavior can be changed by user decision in configuration parameter
   it("Returns the cached date and throws the error correctly if refresh request fails.", async () => {
      await firstValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            observable: (url) => observableFunction(url),
         })
      );

      const anotherCallFirstResponse = await firstValueFrom(
         cacheService.get<Observable<unknown>>({
            url: currentCounterUrl,
            refresh: true,
            observable: (url) => observableFunction(url, {throwError: true}),
         })
      );
      expect(anotherCallFirstResponse).toEqual({counter: 1});

      try {
         await lastValueFrom(
            cacheService.get<Observable<unknown>>({
               url: currentCounterUrl,
               refresh: true,
               observable: (url) => observableFunction(url, {throwError: true}),
            })
         );
      } catch (error) {
         expect(error).toEqual(internalServerErrorException);
      }
   });
});
