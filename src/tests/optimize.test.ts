import {CacheService} from "../cache.service";
import {lastValueFrom, firstValueFrom} from "rxjs";
import {posts} from "./server/posts";
import {observableFunction} from "./utils/observable-function";
import {resetCounterUrl, postsUrl} from "./server/urls";

describe("Cache service rearranging url parameters", () => {
   let cacheService: CacheService;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cacheService = new CacheService({
         isDevMode: false,
      });
   });

   it("Does not call the second .next() if data is equal (by default).", async () => {
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

   it("Does not call the second .next() if data is equal (by default).", async () => {
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
