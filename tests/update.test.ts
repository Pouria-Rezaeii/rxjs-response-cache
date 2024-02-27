import {ResponseCache} from "../src/index";
import {lastValueFrom} from "rxjs";
import {firstPostUrl} from "./server/urls";
import {observableFunction} from "./utils/observable-function";
import {posts} from "./server/posts";

let cacheService: ResponseCache;

describe("Cache Service Update Method", () => {
   beforeEach(() => {
      cacheService = new ResponseCache({
         isDevMode: false,
      });
   });

   it("Replace individual key correctly.", async () => {
      await fetchFirstPost();

      cacheService.update({
         url: firstPostUrl,
         data: {test: "test"},
      });
      expect(cacheService.data[firstPostUrl]).toEqual({test: "test"});
   });

   it("Passes the old data correctly.", async () => {
      await fetchFirstPost();

      cacheService.update<(typeof posts)[0]>({
         url: firstPostUrl,
         data: (oldData) => ({...oldData, test: "test"}),
      });
      expect(cacheService.data[firstPostUrl]).toEqual({...posts[0], test: "test"});
   });

   it("Does not insert the data if key is not present in the cache.", async () => {
      cacheService.update({
         url: firstPostUrl,
         data: {test: "test"},
      });
      expect(cacheService.data[firstPostUrl]).toEqual(undefined);
   });
});

async function fetchFirstPost() {
   await lastValueFrom(
      cacheService.get({
         url: firstPostUrl,
         observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
      })
   );
}
