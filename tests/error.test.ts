import {ResponseCache as Cache} from "../src/index";
import {firstValueFrom, lastValueFrom} from "rxjs";
import {observableFunction} from "./utils/observable-function";
import {notFoundException, internalServerErrorException} from "./server/errors";
import {resetCounterUrl, currentCounterUrl} from "./server/urls";

describe("Cache service error handling", () => {
   let cache: Cache;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cache = new Cache({
         isDevMode: false,
      });
   });

   it("Throws the error correctly if request fails.", async () => {
      try {
         await firstValueFrom(
            cache.get({
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
         cache.get({
            url: currentCounterUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      const anotherCallFirstResponse = await firstValueFrom(
         cache.get({
            url: currentCounterUrl,
            refresh: true,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl, {throwError: true}),
         })
      );
      expect(anotherCallFirstResponse).toEqual({counter: 1});

      try {
         await lastValueFrom(
            cache.get({
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
