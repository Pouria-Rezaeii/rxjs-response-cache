import {ResponseCache as Cache} from "../src/index";
import {currentCounterUrl, postsUrl, resetCounterUrl} from "./server/urls";
import {observableFunction} from "./utils/observable-function";
import {pause} from "./utils/pause";
import {getLastFactory} from "./utils/custom-get";

describe("Cache service timeouts", () => {
   let cache: Cache;
   let getLast: ReturnType<typeof getLastFactory>;

   beforeEach(() => {
      observableFunction(resetCounterUrl).subscribe();
      cache = new Cache({isDevMode: false});
      getLast = getLastFactory(cache);
   });

   it("Clears the data, observable and clear timeout after provided time if refresh=false.", async () => {
      await getLast({url: currentCounterUrl, clearTimeout: 200});

      expect(cache.clearTimeouts[currentCounterUrl]).toBeTruthy();
      await pause(300);
      checkVariablesToBeEmpty(cache);
   });

   it("Clears the data, observable and clear timeout after provided time if refresh=false event if api is called several times.", async () => {
      await getLast({url: currentCounterUrl, clearTimeout: 200});

      await pause(150);
      await getLast({url: currentCounterUrl, clearTimeout: 200});

      await pause(100);
      checkVariablesToBeEmpty(cache);
   });

   it("Refreshes the data and clear timeout after provided time if refresh=true.", async () => {
      await getLast({
         url: currentCounterUrl,
         refresh: true,
         clearTimeout: 200,
      });

      expect(cache.clearTimeouts[currentCounterUrl]).toBeTruthy();
      expect(cache.data).toEqual({[currentCounterUrl]: {counter: 1}});

      const oldTimeouts = cache.clearTimeouts;

      await getLast({
         url: currentCounterUrl,
         refresh: true,
         clearTimeout: 200,
      });

      expect(cache.clearTimeouts[currentCounterUrl]).toBeTruthy();
      expect(cache.data).toEqual({[currentCounterUrl]: {counter: 2}});

      const newTimeouts = cache.clearTimeouts;
      expect(oldTimeouts).not.toEqual(newTimeouts);

      await pause(300);
      checkVariablesToBeEmpty(cache);
   });

   it("Clears the previous timeout if new timeout has been set.", async () => {
      await getLast({
         url: postsUrl,
         refresh: true,
         clearTimeout: 300,
      });
      await pause(200);

      await getLast({
         url: postsUrl,
         refresh: true,
         clearTimeout: 300,
      });
      await pause(200);

      expect(cache.data[postsUrl]).toBeTruthy();
   });
});

function checkVariablesToBeEmpty(cache: Cache) {
   expect(cache.data).toEqual({});
   expect(cache.observables).toEqual({});
   expect(cache.clearTimeouts).toEqual({});
}
