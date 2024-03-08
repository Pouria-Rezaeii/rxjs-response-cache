import {ResponseCache as Cache} from "../src/index";
import {observableFunction} from "./utils/observable-function";
import {notFoundException, internalServerErrorException} from "./server/errors";
import {resetCounterUrl, currentCounterUrl} from "./server/urls";
import {getFirstFactory, getLastFactory} from "./utils/custom-get";

describe("Cache service error handling", () => {
   let cache: Cache;
   let getFirst: ReturnType<typeof getFirstFactory>;
   let getLast: ReturnType<typeof getLastFactory>;

   beforeEach(() => {
      observableFunction(resetCounterUrl).subscribe();
      cache = new Cache({isDevMode: false});
      getFirst = getFirstFactory(cache);
      getLast = getLastFactory(cache);
   });

   it("Throws the error correctly if request fails.", async () => {
      try {
         await getFirst({url: "/not-exist-rul"});
      } catch (error) {
         expect(error).toEqual(notFoundException);
      }
   });

   it("Returns the cached date and throws the error correctly if refresh request fails.", async () => {
      await getFirst({url: currentCounterUrl});

      const anotherCallFirstResponse = await getFirst({url: currentCounterUrl, refresh: true});

      expect(anotherCallFirstResponse).toEqual({counter: 1});

      try {
         await getLast({url: currentCounterUrl, refresh: true});
      } catch (error) {
         expect(error).toEqual(internalServerErrorException);
      }
   });
});
