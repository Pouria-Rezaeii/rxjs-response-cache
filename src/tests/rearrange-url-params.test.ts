import {CacheService} from "../cache.service";
import {lastValueFrom, firstValueFrom, Observable} from "rxjs";
import {posts} from "./server/posts";
import {observableFunction} from "./utils/observable-function";
import {resetCounterUrl, postsUrl} from "./server/urls";

describe("Cache service rearranging url parameters", () => {
   let cacheService: CacheService;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
      });
   });

   it("Sorts the url parameters and params field keys correctly.", async () => {
      const expectedUrl = postsUrl.concat("?a=T&b=T&g=T&v=T&z=T");

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?g=T&a=T&z=T&"),
            observable: (url) => {
               expect(url).toEqual(expectedUrl);
               return observableFunction(url);
            },
            params: {
               v: "T",
               b: "T",
            },
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Removes the null, undefined and empty strings and empty lists in query params.", async () => {
      const expectedUrl = postsUrl.concat("?a=T&f=T");

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat('?a=T&b=null&c=undefined&d=""&e=&f=T&'),
            observable: (url) => {
               expect(url).toEqual(expectedUrl);
               return observableFunction(url);
            },
            params: {
               g: "null",
               h: "undefined",
               i: "",
            },
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Overrides the params object fields with url query params fields.", async () => {
      const expectedUrl = postsUrl.concat("?page-size=20");

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?page-size=20"),
            observable: (url) => {
               expect(url).toEqual(expectedUrl);
               return observableFunction(url);
            },
            params: {"page-size": "10"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Overrides the url query params with params object if `paramsObjectIsPrior=true`.", async () => {
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
         paramsObjectIsPrior: true,
      });

      const expectedUrl = postsUrl.concat("?page-size=20");

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?page-size=10"),
            observable: (url) => {
               expect(url).toEqual(expectedUrl);
               return observableFunction(url);
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
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?z=T&g=T"),
            observable: (url) => observableFunction(url),
            params: {c: "T"},
         })
      );

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?m=null&z=T&k=&c=T&"),
            observable: (url) => observableFunction(url),
            params: {
               f: "undefined",
               g: "T",
            },
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });
});
