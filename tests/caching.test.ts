import {ResponseCache as Cache} from "../src/index";
import {observableFunction} from "./utils/observable-function";
import {currentCounterUrl, firstPostUrl, resetCounterUrl} from "./server/urls";
import {posts} from "./server/posts";
import {uidSeparator} from "../src/constants/uid-separator";
import {getFirstFactory, getLastFactory} from "./utils/custom-get";

describe("Cache service storing responses", () => {
   let cache: Cache;
   let getFirst: ReturnType<typeof getFirstFactory>;
   let getLast: ReturnType<typeof getLastFactory>;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cache = new Cache({isDevMode: false});
      getFirst = getFirstFactory(cache);
      getLast = getLastFactory(cache);
   });

   describe("Without any provided uid", () => {
      it("Fetches and stores the response and the observable correctly.", async () => {
         const response = await getLast({url: firstPostUrl});

         expect(response).toEqual(posts[0]);
         expect(cache.data).toEqual({[firstPostUrl]: posts[0]});
         expect(cache.observables[firstPostUrl]).toBeTruthy();
      });

      it("Uses the cache if data is already present and does not call the api again if `refresh=false`.", async () => {
         await getLast({url: currentCounterUrl});

         const anotherCall = await getLast({url: currentCounterUrl});

         expect(anotherCall).toEqual({counter: 1});
         expect(cache.data).toEqual({[currentCounterUrl]: {counter: 1}});
      });

      it("Uses the cache and refreshes the data correctly if `refresh=true`.", async () => {
         await getLast({url: currentCounterUrl});

         // the cache is going to be used and the firstValueFrom will return counter = 1
         // the lastValueFrom would be 2 but there is no way to log it here
         await getFirst({url: currentCounterUrl, refresh: true});

         expect(cache.data).toEqual({[currentCounterUrl]: {counter: 1}});

         // this is a brand new api call, the firstValueFrom would be equal to 2,
         // but there is no way to log it here
         // we expect the lastValueFrom to be 3
         const anotherCallLastResponse = await getLast({url: currentCounterUrl, refresh: true});

         expect(anotherCallLastResponse).toEqual({counter: 3});
         expect(cache.data).toEqual({[currentCounterUrl]: {counter: 3}});
      });
   });

   describe("Along with provided uid", () => {
      it("Fetches and stores the response and the observable correctly.", async () => {
         const response = await getLast({uniqueIdentifier: "some_uid", url: firstPostUrl});
         const expectedKey = "some_uid" + uidSeparator + firstPostUrl;

         expect(response).toEqual(posts[0]);
         expect(cache.data).toEqual({[expectedKey]: posts[0]});
         expect(cache.observables[expectedKey]).toBeTruthy();
      });

      it("Uses the cache if data is already present and does not call the api again if `refresh=false`.", async () => {
         await getLast({uniqueIdentifier: "some_uid", url: currentCounterUrl});

         const anotherCall = await getLast({
            uniqueIdentifier: "some_uid",
            url: currentCounterUrl,
         });

         const expectedKey = "some_uid" + uidSeparator + currentCounterUrl;

         expect(anotherCall).toEqual({counter: 1});
         expect(cache.data).toEqual({[expectedKey]: {counter: 1}});
      });

      it("Uses the cache and refreshes the data correctly if `refresh=true`.", async () => {
         await getLast({uniqueIdentifier: "some_uid", url: currentCounterUrl});

         // the cache is going to be used and the firstValueFrom will return counter = 1
         // the lastValueFrom would be 2 but there is no way to log it here
         await getFirst({
            uniqueIdentifier: "some_uid",
            url: currentCounterUrl,
            refresh: true,
         });

         const expectedKey = "some_uid" + uidSeparator + currentCounterUrl;

         expect(cache.data).toEqual({[expectedKey]: {counter: 1}});

         // this is a brand new api call, the firstValueFrom would be equal to 2,
         // but there is no way to log it here
         // we expect the lastValueFrom to be 3
         const anotherCallLastResponse = await getLast({
            uniqueIdentifier: "some_uid",
            url: currentCounterUrl,
            refresh: true,
         });

         expect(anotherCallLastResponse).toEqual({counter: 3});
         expect(cache.data).toEqual({[expectedKey]: {counter: 3}});
      });
   });
});
