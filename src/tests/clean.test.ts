import {Observable, lastValueFrom} from "rxjs";
import {CacheService} from "../cache.service";
import {observableFunction} from "./utils/observable-function";
import {postsUrl} from "./server/urls";
import {posts} from "./server/posts";

describe("Cache service clean method", () => {
   let cacheService: CacheService;

   beforeEach(() => {
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
      });
   });

   it("Clears data, observable and clear timeout correctly if is NOT provided uid in clean options", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
         })
      );

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            uniqueIdentifier: "some_uid",
            url: postsUrl,
            observable: (url) => observableFunction(url),
            clearTimeout: 20000,
         })
      );

      cacheService.clean(postsUrl);

      const expectedKey = "some_uid__" + postsUrl;
      expect(cacheService.cachedData).toEqual({
         [expectedKey]: posts,
      });
      expect(cacheService.observables[expectedKey]).toBeTruthy();
      expect(cacheService.clearTimeouts[expectedKey]).toBeTruthy();
   });

   it("Clears data, observable and clear timeout correctly if uid IS provided in clean options", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
            clearTimeout: 20000,
         })
      );

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            uniqueIdentifier: "some_uid",
            url: postsUrl,
            observable: (url) => observableFunction(url),
         })
      );

      cacheService.clean(postsUrl, {uniqueIdentifier: "some_uid"});

      expect(cacheService.cachedData).toEqual({
         [postsUrl]: posts,
      });
      expect(cacheService.observables[postsUrl]).toBeTruthy();
      expect(cacheService.clearTimeouts[postsUrl]).toBeTruthy();
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
