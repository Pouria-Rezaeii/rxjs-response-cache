import {ResponseCache as Cache} from "../src/index";
import {observableFunction} from "./utils/observable-function";
import {resetCounterUrl, postsUrl} from "./server/urls";
import {getLastFactory} from "./utils/custom-get";

describe("Subscriber.next() trigger behaviour", () => {
   let cache: Cache;
   let getLast: ReturnType<typeof getLastFactory>;

   beforeEach(() => {
      observableFunction(resetCounterUrl).subscribe();
      cache = new Cache({isDevMode: false});
      getLast = getLastFactory(cache);
   });

   it("Does not call the second .next() if data is equal to the cached version (by default).", async () => {
      const res = await getLast({url: postsUrl});
      const res2 = await getLast({url: postsUrl, refresh: true});

      // reference check equality
      expect(res).toBe(res2);
   });

   it("Calls the second .next() if data is equal to the cached version if `preventSecondCall=false`.", async () => {
      cache = new Cache({
         isDevMode: false,
         preventSecondCallIfDataIsUnchanged: false,
      });
      getLast = getLastFactory(cache);

      const res = await getLast({url: postsUrl});
      const res2 = await getLast({url: postsUrl, refresh: true});

      // reference check equality
      expect(res).not.toBe(res2);
   });
});
