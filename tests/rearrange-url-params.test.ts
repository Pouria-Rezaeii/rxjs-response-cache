import {ResponseCache as Cache} from "../src/index";
import {posts} from "./server/posts";
import {observableFunction} from "./utils/observable-function";
import {resetCounterUrl, postsUrl} from "./server/urls";
import {getFirstFactory, getLastFactory} from "./utils/custom-get";

describe("Cache service rearranging url parameters", () => {
   let cache: Cache;
   let getFirst: ReturnType<typeof getFirstFactory>;
   let getLast: ReturnType<typeof getLastFactory>;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cache = new Cache({isDevMode: false});
      getFirst = getFirstFactory(cache);
      getLast = getLastFactory(cache);
   });

   it("Accepts query params in the url property.", async () => {
      await getLast({url: postsUrl.concat("?a=T")});

      expect(cache.data).toEqual({[postsUrl.concat("?a=T")]: posts});
   });

   it("Accepts query params defaultParams property", async () => {
      await getLast({url: postsUrl, defaultParams: {a: "T"}});

      expect(cache.data).toEqual({
         [postsUrl.concat("?a=T")]: posts,
      });
   });

   it("Accepts query params in the params property.", async () => {
      await getLast({url: postsUrl, params: {a: "T"}});

      expect(cache.data).toEqual({[postsUrl.concat("?a=T")]: posts});
   });

   it("Sorts the default params, url parameters and params properties keys correctly.", async () => {
      const expectedUrl = postsUrl.concat("?a=true&b=T&c=0&d=T");

      await getLast({
         url: postsUrl.concat("?d=T&a=true"),
         observable: ({arrangedUrl}) => {
            expect(arrangedUrl).toEqual(expectedUrl);
            return observableFunction(arrangedUrl);
         },
         defaultParams: {b: "T"},
         params: {c: "0"},
      });

      expect(cache.data).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Overwrites the defaultParams keys with url params and params property keys.", async () => {
      const expectedUrl = postsUrl.concat("?a=T&b=T&f=T");

      await getLast({
         url: postsUrl.concat("?a=T"),
         observable: ({arrangedUrl}) => {
            expect(arrangedUrl).toEqual(expectedUrl);
            return observableFunction(arrangedUrl);
         },
         defaultParams: {a: "a", b: "b", f: "T"},
         params: {b: "T"},
      });

      expect(cache.data).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Removes the undefined and empty strings and empty lists and nulls and NaN in query params.", async () => {
      const expectedUrl = postsUrl.concat("?a=T");

      await getLast({
         url: postsUrl.concat('?a=T&c=""&d=&m=NaN&'),
         observable: ({arrangedUrl}) => {
            expect(arrangedUrl).toEqual(expectedUrl);
            return observableFunction(arrangedUrl);
         },
         defaultParams: {
            e: "undefined",
            f: "null",
            v: NaN,
            z: [] as unknown as string,
         },
         params: {g: undefined, h: "", i: null},
      });

      expect(cache.data).toEqual({[expectedUrl]: posts});
   });

   it("Does not remove the null values if `removeNullValues = false`.", async () => {
      cache = new Cache({
         isDevMode: false,
         removeNullValues: false,
      });
      getLast = getLastFactory(cache);

      const expectedUrl = postsUrl.concat("?a=T&b=null&c=null");

      await getLast({
         url: postsUrl.concat("?a=T&b=null"),
         params: {c: null},
         observable: ({arrangedUrl}) => {
            expect(arrangedUrl).toEqual(expectedUrl);
            return observableFunction(arrangedUrl);
         },
      });

      expect(cache.data).toEqual({[expectedUrl]: posts});
   });

   it("Does not remove important falsy values (null, 0, false).", async () => {
      cache = new Cache({
         isDevMode: false,
         removeNullValues: false,
      });
      getLast = getLastFactory(cache);

      const expectedUrl = postsUrl.concat("?a=null&b=0&c=false");

      await getLast({
         url: postsUrl,
         params: {a: null, b: 0, c: false},
         observable: ({arrangedUrl}) => {
            expect(arrangedUrl).toEqual(expectedUrl);
            return observableFunction(arrangedUrl);
         },
      });

      expect(cache.data).toEqual({[expectedUrl]: posts});
   });

   it("Does not overwrite query params if value is falsy", async () => {
      cache = new Cache({
         isDevMode: false,
         removeNullValues: false,
      });
      getLast = getLastFactory(cache);

      const expectedUrl = postsUrl.concat("?a=T&b=T&c=T");

      await getLast({
         url: postsUrl.concat("?a=null&&b=T"),
         defaultParams: {a: "T"},
         params: {b: null, c: "T"},
         observable: ({arrangedUrl}) => {
            expect(arrangedUrl).toEqual(expectedUrl);
            return observableFunction(arrangedUrl);
         },
      });

      expect(cache.data).toEqual({[expectedUrl]: posts});
   });

   it("Overwrites the url query params with params object if `paramsObjectOverwritesUrlQueries = true`.", async () => {
      cache = new Cache({
         isDevMode: false,
         paramsObjectOverwritesUrlQueries: true,
      });
      getLast = getLastFactory(cache);

      const expectedUrl = postsUrl.concat("?page-size=20");

      await getLast({
         url: postsUrl.concat("?page-size=10"),
         observable: ({arrangedUrl}) => {
            expect(arrangedUrl).toEqual(expectedUrl);
            return observableFunction(arrangedUrl);
         },
         params: {"page-size": "20"},
      });

      expect(cache.data).toEqual({[expectedUrl]: posts});
   });

   it("Does NOT overwrite the url query params with params object if `paramsObjectOverwritesUrlQueries = false`.", async () => {
      cache = new Cache({
         isDevMode: false,
         paramsObjectOverwritesUrlQueries: false,
      });
      getLast = getLastFactory(cache);

      const expectedUrl = postsUrl.concat("?page-size=10");

      await getLast({
         url: postsUrl.concat("?page-size=10"),
         observable: ({arrangedUrl}) => {
            expect(arrangedUrl).toEqual(expectedUrl);
            return observableFunction(arrangedUrl);
         },
         params: {"page-size": "20"},
      });

      expect(cache.data).toEqual({[expectedUrl]: posts});
   });

   it("it uses the sorted an truncated url to check the cached data", async () => {
      const expectedUrl = postsUrl.concat("?c=T&g=T&z=T");

      await getFirst({
         url: postsUrl.concat("?z=T&g=T"),
         params: {c: "T"},
      });

      await getLast({
         url: postsUrl.concat("?z=T&k=&c=T&"),
         params: {f: "undefined", g: "T"},
      });

      expect(cache.data).toEqual({[expectedUrl]: posts});
   });
});
