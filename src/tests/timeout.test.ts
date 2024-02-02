import {Cache} from "../index";
import {lastValueFrom} from "rxjs";
import {currentCounterUrl, postsUrl, resetCounterUrl} from "./server/urls";
import {observableFunction} from "./utils/observable-function";
import {pause} from "./utils/pause";

describe("Cache service timeouts", () => {
   let cache: Cache;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cache = new Cache({
         isDevMode: false,
      });
   });

   it("Clears the data, observable and clear timeout after provided time if refresh=false.", async () => {
      await lastValueFrom(
         cache.get({
            url: currentCounterUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            clearTimeout: 200,
         })
      );

      expect(cache.clearTimeouts[currentCounterUrl]).toBeTruthy();
      await pause(300);
      checkVariablesToBeEmpty(cache);
   });

   it("Clears the data, observable and clear timeout after provided time if refresh=false event if api is called several times.", async () => {
      await lastValueFrom(
         cache.get({
            url: currentCounterUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            clearTimeout: 200,
         })
      );

      await pause(150);
      await lastValueFrom(
         cache.get({
            url: currentCounterUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            clearTimeout: 200,
         })
      );

      await pause(100);
      checkVariablesToBeEmpty(cache);
   });

   it("Refreshes the data and clear timeout after provided time if refresh=true.", async () => {
      await lastValueFrom(
         cache.get({
            url: currentCounterUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            refresh: true,
            clearTimeout: 200,
         })
      );

      expect(cache.clearTimeouts[currentCounterUrl]).toBeTruthy();
      expect(cache.data).toEqual({
         [currentCounterUrl]: {counter: 1},
      });

      const oldTimeouts = cache.clearTimeouts;

      await lastValueFrom(
         cache.get({
            url: currentCounterUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            refresh: true,
            clearTimeout: 200,
         })
      );

      expect(cache.clearTimeouts[currentCounterUrl]).toBeTruthy();
      expect(cache.data).toEqual({
         [currentCounterUrl]: {counter: 2},
      });

      const newTimeouts = cache.clearTimeouts;
      expect(oldTimeouts).not.toEqual(newTimeouts);

      await pause(300);
      checkVariablesToBeEmpty(cache);
   });

   it("Clears the previous timeout if new timeout has been set.", async () => {
      await lastValueFrom(
         cache.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            refresh: true,
            clearTimeout: 300,
         })
      );
      await pause(200);

      await lastValueFrom(
         cache.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            refresh: true,
            clearTimeout: 300,
         })
      );
      await pause(200);

      expect(cache.data[postsUrl]).toBeTruthy();
   });
});

function checkVariablesToBeEmpty(cache: Cache) {
   expect(cache.data).toEqual({});
   expect(cache.observables).toEqual({});
   expect(cache.clearTimeouts).toEqual({});
}
