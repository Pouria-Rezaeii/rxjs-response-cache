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

   it("Accepts query params in the url property.", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      expect(cacheService.cachedData).toEqual({
         [postsUrl.concat("?a=T")]: posts,
      });
   });

   it("Accepts query params defaultParams property", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            defaultParams: {a: "T"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [postsUrl.concat("?a=T")]: posts,
      });
   });

   it("Accepts query params in the params property.", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            params: {a: "T"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [postsUrl.concat("?a=T")]: posts,
      });
   });

   it("Sorts the default params, url parameters and params properties keys correctly.", async () => {
      const expectedUrl = postsUrl.concat("?a=true&b=T&c=0&d=T");

      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?d=T&a=true"),
            observable: ({arrangedUrl}) => {
               expect(arrangedUrl).toEqual(expectedUrl);
               return observableFunction(arrangedUrl);
            },
            defaultParams: {b: "T"},
            params: {c: "0"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Overwrites the defaultParams keys with url params and params property keys.", async () => {
      const expectedUrl = postsUrl.concat("?a=T&b=T&f=T");

      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T"),
            observable: ({arrangedUrl}) => {
               expect(arrangedUrl).toEqual(expectedUrl);
               return observableFunction(arrangedUrl);
            },
            defaultParams: {a: "a", b: "b", f: "T"},
            params: {b: "T"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Removes the undefined and empty strings and empty lists and nulls and NaN in query params.", async () => {
      const expectedUrl = postsUrl.concat("?a=T");

      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat('?a=T&c=""&d=&m=NaN&'),
            observable: ({arrangedUrl}) => {
               expect(arrangedUrl).toEqual(expectedUrl);
               return observableFunction(arrangedUrl);
            },
            defaultParams: {
               e: "undefined",
               f: "null",
               v: NaN as unknown as string,
               z: [] as unknown as string,
            },
            params: {g: undefined as unknown as string, h: "", i: null as unknown as string},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Does not remove the null values if `removeNullValues = false`.", async () => {
      cacheService = new CacheService({
         isDevMode: false,
         removeNullValues: false,
      });

      const expectedUrl = postsUrl.concat("?a=T&b=null&c=null");

      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T&b=null"),
            params: {c: null as unknown as string},
            observable: ({arrangedUrl}) => {
               expect(arrangedUrl).toEqual(expectedUrl);
               return observableFunction(arrangedUrl);
            },
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Does not remove important falsy values (null, 0, false)`.", async () => {
      cacheService = new CacheService({
         isDevMode: false,
         removeNullValues: false,
      });

      const expectedUrl = postsUrl.concat("?a=null&b=0&c=false");

      await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            params: {a: null as unknown as string, b: 0, c: false},
            observable: ({arrangedUrl}) => {
               expect(arrangedUrl).toEqual(expectedUrl);
               return observableFunction(arrangedUrl);
            },
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Overwrites the url query params with params object if `paramsObjectOverwritesUrlQueries = true`.", async () => {
      cacheService = new CacheService({
         isDevMode: false,
         paramsObjectOverwritesUrlQueries: true,
      });

      const expectedUrl = postsUrl.concat("?page-size=20");

      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?page-size=10"),
            observable: ({arrangedUrl}) => {
               expect(arrangedUrl).toEqual(expectedUrl);
               return observableFunction(arrangedUrl);
            },
            params: {"page-size": "20"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Does NOT overwrite the url query params with params object if `paramsObjectOverwritesUrlQueries = false`.", async () => {
      cacheService = new CacheService({
         isDevMode: false,
         paramsObjectOverwritesUrlQueries: false,
      });

      const expectedUrl = postsUrl.concat("?page-size=10");

      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?page-size=10"),
            observable: ({arrangedUrl}) => {
               expect(arrangedUrl).toEqual(expectedUrl);
               return observableFunction(arrangedUrl);
            },
            params: {"page-size": "20"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("it uses the sorted an truncated url to check the cached data", async () => {
      const expectedUrl = postsUrl.concat("?c=T&g=T&z=T");

      await firstValueFrom(
         cacheService.get({
            url: postsUrl.concat("?z=T&g=T"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            params: {c: "T"},
         })
      );

      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?z=T&k=&c=T&"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            params: {f: "undefined", g: "T"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });
});
