import {CacheService} from "../src/index";
import {postsUrl} from "./server/urls";
import {getLastFactory} from "./utils/custom-get";

describe("Cache service initialization", () => {
   // let be the deprecated version to be tested
   let cache: CacheService;
   let getLast: ReturnType<typeof getLastFactory>;

   beforeEach(() => {
      cache = new CacheService({isDevMode: false});
      getLast = getLastFactory(cache);
   });

   it("Resets the cache correctly.", async () => {
      await getLast({url: postsUrl});

      // let be the deprecated version to be tested
      cache.resetCache();

      // let be the deprecated version to be tested
      expect(cache.cachedData).toEqual({});
      expect(cache.observables).toEqual({});
      expect(cache.clearTimeouts).toEqual({});
   });
});
