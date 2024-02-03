import {lastValueFrom} from "rxjs";
import {ResponseCache as Cache} from "../src/index";
import {observableFunction} from "./utils/observable-function";
import {postsUrl} from "./server/urls";
import {posts} from "./server/posts";
import {uidSeparator} from "../src/constants/uid-separator";

describe("Cache service clean method", () => {
   let cacheService: Cache;

   beforeEach(() => {
      cacheService = new Cache({
         isDevMode: false,
      });
   });

   it("Clears data, observable and clear timeout correctly if is NOT provided uid in clean options", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      await lastValueFrom(
         cacheService.get({
            uniqueIdentifier: "some_uid",
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            clearTimeout: 500,
         })
      );

      cacheService.clean(postsUrl);

      const expectedKey = "some_uid" + uidSeparator + postsUrl;
      expect(cacheService.data).toEqual({
         [expectedKey]: posts,
      });
      expect(cacheService.observables[expectedKey]).toBeTruthy();
      expect(cacheService.clearTimeouts[expectedKey]).toBeTruthy();
   });

   it("Clears data, observable and clear timeout correctly if uid IS provided in clean options", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
            clearTimeout: 500,
         })
      );

      await lastValueFrom(
         cacheService.get({
            uniqueIdentifier: "some_uid",
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      cacheService.clean(postsUrl, {uniqueIdentifier: "some_uid"});

      expect(cacheService.data).toEqual({
         [postsUrl]: posts,
      });
      expect(cacheService.observables[postsUrl]).toBeTruthy();
      expect(cacheService.clearTimeouts[postsUrl]).toBeTruthy();
   });

   it("Accepts params in url ", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      cacheService.clean(postsUrl.concat("?a=T"));
      expect(cacheService.data).toEqual({});
   });

   it("Accepts params in queryParams object", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      cacheService.clean(postsUrl, {queryParams: {a: "T"}});

      expect(cacheService.data).toEqual({});
   });

   it("Matches only one key if `exact=true` and query params are included in `url` parameter", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );
      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );
      cacheService.clean(postsUrl, {exact: true});

      expect(cacheService.data[postsUrl]).toBeFalsy();
      expect(cacheService.data[postsUrl.concat("?a=T")]).toBeTruthy();
   });

   it("Matches only one key if `exact=true` and query params are included in `query param` parameter", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );
      await lastValueFrom(
         cacheService.get({
            url: postsUrl,
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );
      cacheService.clean(postsUrl, {exact: true, queryParams: {a: "T"}});

      expect(cacheService.data[postsUrl]).toBeTruthy();
      expect(cacheService.data[postsUrl.concat("?a=T")]).toBeFalsy();
   });

   it("Matches as many as possible if `exact=false` and query params are included in `url` parameter", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T&b=T"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      cacheService.clean(postsUrl.concat("?a=T"));
      expect(cacheService.data).toEqual({});
   });

   it("Matches as many as possible if `exact=false` and query params are included in `query param` parameter", async () => {
      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      await lastValueFrom(
         cacheService.get({
            url: postsUrl.concat("?a=T&b=T"),
            observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
         })
      );

      cacheService.clean(postsUrl, {queryParams: {a: "T"}});
      expect(cacheService.data).toEqual({});
   });
});