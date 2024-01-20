import {CacheService} from "../cache.service";
import {lastValueFrom} from "rxjs";
import {observableFunction} from "./utils/observable-function";
import {resetCounterUrl, postsUrl} from "./server/urls";

describe("Subscriber.next() trigger behaviour", () => {
   let cacheService: CacheService;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cacheService = new CacheService({
         isDevMode: false,
      });
   });

   it("Does not call the second .next() if data is equal to the cached version (by default).", async () => {
      const res = await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      const res2 = await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            refresh: true,
         })
      );

      // reference check equality
      expect(res).toBe(res2);
   });

   it("Calls the second .next() if data is equal to the cached version if `preventSecondCall=false`.", async () => {
      cacheService = new CacheService({
         isDevMode: false,
         preventSecondCallIfDataIsUnchanged: false,
      });

      const res = await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      const res2 = await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            refresh: true,
         })
      );

      // reference check equality
      expect(res).not.toBe(res2);
   });
});
