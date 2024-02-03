import {ResponseCache as Cache} from "../src/index";
import {lastValueFrom} from "rxjs";
import {observableFunction} from "./utils/observable-function";
import {resetCounterUrl, postsUrl} from "./server/urls";

describe("Subscriber.next() trigger behaviour", () => {
   let cache: Cache;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cache = new Cache({
         isDevMode: false,
      });
   });

   it("Does not call the second .next() if data is equal to the cached version (by default).", async () => {
      const res = await lastValueFrom(
         cache.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      const res2 = await lastValueFrom(
         cache.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            refresh: true,
         })
      );

      // reference check equality
      expect(res).toBe(res2);
   });

   it("Calls the second .next() if data is equal to the cached version if `preventSecondCall=false`.", async () => {
      cache = new Cache({
         isDevMode: false,
         preventSecondCallIfDataIsUnchanged: false,
      });

      const res = await lastValueFrom(
         cache.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      const res2 = await lastValueFrom(
         cache.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            refresh: true,
         })
      );

      // reference check equality
      expect(res).not.toBe(res2);
   });
});
