import {ResponseCache as Cache} from "../src/index";
import {postsUrl} from "./server/urls";
import {posts} from "./server/posts";
import {uidSeparator} from "../src/constants/uid-separator";
import {getLastFactory} from "./utils/custom-get";

describe("Cache service clean method", () => {
   let cache: Cache;
   let getLast: ReturnType<typeof getLastFactory>;

   beforeEach(() => {
      cache = new Cache({isDevMode: false});
      getLast = getLastFactory(cache);
   });

   it("Clears data, observable and clear timeout correctly if is NOT provided uid in clean options", async () => {
      await getLast({url: postsUrl});

      await getLast({uniqueIdentifier: "some_uid", url: postsUrl, clearTimeout: 500});

      // let it be like this to test the deprecated version
      cache.clean(postsUrl);

      const expectedKey = "some_uid" + uidSeparator + postsUrl;
      expect(cache.data).toEqual({[expectedKey]: posts});
      expect(cache.observables[expectedKey]).toBeTruthy();
      expect(cache.clearTimeouts[expectedKey]).toBeTruthy();
   });

   it("Clears data, observable and clear timeout correctly if uid IS provided in clean options", async () => {
      await getLast({url: postsUrl, clearTimeout: 500});

      await getLast({uniqueIdentifier: "some_uid", url: postsUrl});

      cache.remove(postsUrl, {uniqueIdentifier: "some_uid"});

      expect(cache.data).toEqual({[postsUrl]: posts});
      expect(cache.observables[postsUrl]).toBeTruthy();
      expect(cache.clearTimeouts[postsUrl]).toBeTruthy();
   });

   it("Accepts params in url ", async () => {
      await getLast({url: postsUrl.concat("?a=T")});

      cache.remove(postsUrl.concat("?a=T"));
      expect(cache.data).toEqual({});
   });

   it("Accepts params in queryParams object", async () => {
      await getLast({url: postsUrl.concat("?a=T")});

      // let be the deprecated property
      cache.remove(postsUrl, {params: {a: "T"}});

      expect(cache.data).toEqual({});
   });

   it("Matches only one key if `exact=true` and query params are included in `url` parameter", async () => {
      await getLast({url: postsUrl});
      await getLast({url: postsUrl.concat("?a=T")});
      cache.remove(postsUrl, {exact: true});

      expect(cache.data[postsUrl]).toBeFalsy();
      expect(cache.data[postsUrl.concat("?a=T")]).toBeTruthy();
   });

   it("Matches only one key if `exact=true` and query params are included in `query param` parameter", async () => {
      await getLast({url: postsUrl});
      await getLast({url: postsUrl});
      cache.remove(postsUrl, {exact: true, params: {a: "T"}});

      expect(cache.data[postsUrl]).toBeTruthy();
      expect(cache.data[postsUrl.concat("?a=T")]).toBeFalsy();
   });

   it("Matches as many as possible if `exact=false` and query params are included in `url` parameter", async () => {
      await getLast({url: postsUrl.concat("?a=T")});

      await getLast({url: postsUrl.concat("?a=T&b=T")});

      cache.remove(postsUrl.concat("?a=T"));
      expect(cache.data).toEqual({});
   });

   it("Matches as many as possible if `exact=false` and query params are included in `query param` parameter", async () => {
      await getLast({url: postsUrl.concat("?a=T")});

      await getLast({url: postsUrl.concat("?a=T&b=T")});

      cache.remove(postsUrl, {params: {a: "T"}});
      expect(cache.data).toEqual({});
   });
});
