import {firstValueFrom, lastValueFrom} from "rxjs";
import {Cache} from "../index";
import {observableFunction} from "./utils/observable-function";
import {currentCounterUrl, firstPostUrl, resetCounterUrl} from "./server/urls";
import {posts} from "./server/posts";
import {uidSeparator} from "../constants/uid-separator";

describe("Cache service storing responses", () => {
   let cache: Cache;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cache = new Cache({
         isDevMode: false,
      });
   });

   describe("Without any provided uid", () => {
      it("Fetches and stores the response and the observable correctly.", async () => {
         const response = await lastValueFrom(
            cache.get({
               url: firstPostUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            })
         );

         expect(response).toEqual(posts[0]);
         expect(cache.data).toEqual({
            [firstPostUrl]: posts[0],
         });
         expect(cache.observables[firstPostUrl]).toBeTruthy();
      });

      it("Uses the cache if data is already present and does not call the api again if `refresh=false`.", async () => {
         await lastValueFrom(
            cache.get({
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            })
         );

         const anotherCall = await lastValueFrom(
            cache.get({
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            })
         );

         expect(anotherCall).toEqual({counter: 1});
         expect(cache.data).toEqual({
            [currentCounterUrl]: {counter: 1},
         });
      });

      it("Uses the cache and refreshes the data correctly if `refresh=true`.", async () => {
         await lastValueFrom(
            cache.get({
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            })
         );

         // the cache is going to be used and the firstValueFrom will return counter = 1
         // the lastValueFrom would be 2 but there is no way to log it here
         await firstValueFrom(
            cache.get({
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
               refresh: true,
            })
         );

         expect(cache.data).toEqual({
            [currentCounterUrl]: {counter: 1},
         });

         // this is a brand new api call, the firstValueFrom would be equal to 2,
         // but there is no way to log it here
         // we expect the lastValueFrom to be 3
         const anotherCallLastResponse = await lastValueFrom(
            cache.get({
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
               refresh: true,
            })
         );

         expect(anotherCallLastResponse).toEqual({counter: 3});
         expect(cache.data).toEqual({
            [currentCounterUrl]: {counter: 3},
         });
      });
   });

   describe("Along with provided uid", () => {
      it("Fetches and stores the response and the observable correctly.", async () => {
         const response = await lastValueFrom(
            cache.get({
               uniqueIdentifier: "some_uid",
               url: firstPostUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            })
         );
         const expectedKey = "some_uid" + uidSeparator + firstPostUrl;

         expect(response).toEqual(posts[0]);
         expect(cache.data).toEqual({
            [expectedKey]: posts[0],
         });
         expect(cache.observables[expectedKey]).toBeTruthy();
      });

      it("Uses the cache if data is already present and does not call the api again if `refresh=false`.", async () => {
         await lastValueFrom(
            cache.get({
               uniqueIdentifier: "some_uid",
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            })
         );

         const anotherCall = await lastValueFrom(
            cache.get({
               uniqueIdentifier: "some_uid",
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            })
         );

         const expectedKey = "some_uid" + uidSeparator + currentCounterUrl;

         expect(anotherCall).toEqual({counter: 1});
         expect(cache.data).toEqual({
            [expectedKey]: {counter: 1},
         });
      });

      it("Uses the cache and refreshes the data correctly if `refresh=true`.", async () => {
         await lastValueFrom(
            cache.get({
               uniqueIdentifier: "some_uid",
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            })
         );

         // the cache is going to be used and the firstValueFrom will return counter = 1
         // the lastValueFrom would be 2 but there is no way to log it here
         await firstValueFrom(
            cache.get({
               uniqueIdentifier: "some_uid",
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
               refresh: true,
            })
         );

         const expectedKey = "some_uid" + uidSeparator + currentCounterUrl;

         expect(cache.data).toEqual({
            [expectedKey]: {counter: 1},
         });

         // this is a brand new api call, the firstValueFrom would be equal to 2,
         // but there is no way to log it here
         // we expect the lastValueFrom to be 3
         const anotherCallLastResponse = await lastValueFrom(
            cache.get({
               uniqueIdentifier: "some_uid",
               url: currentCounterUrl,
               observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
               refresh: true,
            })
         );

         expect(anotherCallLastResponse).toEqual({counter: 3});
         expect(cache.data).toEqual({
            [expectedKey]: {counter: 3},
         });
      });
   });
});
