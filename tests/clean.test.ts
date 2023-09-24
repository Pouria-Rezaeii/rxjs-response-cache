import {Observable, lastValueFrom} from "rxjs";
import {CacheService} from "../src/cache.service";
import {observableFunction} from "./utils/observable-function";
import {postsUrl} from "./server/urls";

describe("Cache service clean method", () => {
   let cacheService: CacheService;

   beforeEach(() => {
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
      });
   });

   it("Clears data, observable and clear timeout", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
         })
      );

      cacheService.clean(postsUrl);

      expect(cacheService.cachedData).toEqual({});
      expect(cacheService.observables).toEqual({});
      expect(cacheService.clearTimeouts).toEqual({});
   });

   it("Accepts params in url ", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?a=T"),
            observable: (url) => observableFunction(url),
         })
      );

      cacheService.clean(postsUrl.concat("?a=T"));
      expect(cacheService.cachedData).toEqual({});
   });

   it("Accepts params in queryParams object", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?a=T"),
            observable: (url) => observableFunction(url),
         })
      );

      cacheService.clean(postsUrl, {queryParams: {a: "T"}});

      expect(cacheService.cachedData).toEqual({});
   });

   it("Matches only one key if `exact=true` and query params are included in `url` parameter", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
         })
      );
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?a=T"),
            observable: (url) => observableFunction(url),
         })
      );
      cacheService.clean(postsUrl, {exact: true});

      expect(cacheService.cachedData[postsUrl]).toBeFalsy();
      expect(cacheService.cachedData[postsUrl.concat("?a=T")]).toBeTruthy();
   });

   it("Matches only one key if `exact=true` and query params are included in `query param` parameter", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
         })
      );
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
         })
      );
      cacheService.clean(postsUrl, {exact: true, queryParams: {a: "T"}});

      expect(cacheService.cachedData[postsUrl]).toBeTruthy();
      expect(cacheService.cachedData[postsUrl.concat("?a=T")]).toBeFalsy();
   });

   it("Matches as many as possible if `exact=false` and query params are included in `url` parameter", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?a=T"),
            observable: (url) => observableFunction(url),
         })
      );

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?a=T&b=T"),
            observable: (url) => observableFunction(url),
         })
      );

      cacheService.clean(postsUrl.concat("?a=T"));
      expect(cacheService.cachedData).toEqual({});
   });

   it("Matches as many as possible if `exact=false` and query params are included in `query param` parameter", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?a=T"),
            observable: (url) => observableFunction(url),
         })
      );

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?a=T&b=T"),
            observable: (url) => observableFunction(url),
         })
      );

      cacheService.clean(postsUrl, {queryParams: {a: "T"}});
      expect(cacheService.cachedData).toEqual({});
   });
});
