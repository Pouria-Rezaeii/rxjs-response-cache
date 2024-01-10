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
      });
   });

   it("Throws the error correctly if request fails.", async () => {
      try {
         await firstValueFrom(
            cacheService.get({
               url: "/not-exist-rul",
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            })
         );
      } catch (error) {
         expect(error).toEqual(notFoundException);
      }
   });

   it("Returns the cached date and throws the error correctly if refresh request fails.", async () => {
      await firstValueFrom(
         cacheService.get({
            url: currentCounterUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      const anotherCallFirstResponse = await firstValueFrom(
         cacheService.get({
            url: currentCounterUrl,
            refresh: true,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl, {throwError: true}),
         })
      );
      expect(anotherCallFirstResponse).toEqual({counter: 1});

      try {
         await lastValueFrom(
            cacheService.get({
               url: currentCounterUrl,
               refresh: true,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl, {throwError: true}),
            })
         );
      } catch (error) {
         expect(error).toEqual(internalServerErrorException);
      }
   });
});
