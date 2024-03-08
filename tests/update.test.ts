import {ResponseCache} from "../src/index";
import {lastValueFrom} from "rxjs";
import {firstPostUrl, postsUrl, postsWithPaginationUrl} from "./server/urls";
import {observableFunction} from "./utils/observable-function";
import {posts} from "./server/posts";
import {QueryParams} from "../src/types/index.type";

let cacheService: ResponseCache;

describe("Cache Service Update Method", () => {
   beforeEach(() => {
      cacheService = new ResponseCache({
         isDevMode: false,
      });
   });

   it("Replace individual key correctly.", async () => {
      await customFetch(firstPostUrl);

      cacheService.update({
         url: firstPostUrl,
         data: {test: "test"},
      });
      expect(cacheService.data[firstPostUrl]).toEqual({test: "test"});
   });

   it("Passes the old data correctly.", async () => {
      await customFetch(firstPostUrl);

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

   it("Updates the related key correctly if `exact=false`", async () => {
      await customFetch(firstPostUrl);
      await customFetch(postsUrl);
      await customFetch(postsUrl, {active: true});

      expect(cacheService.data[firstPostUrl]).toEqual(posts[0]);
      expect(cacheService.data[postsUrl]).toEqual(posts);

      const newData = {id: 1, testKey: "this data is new."};

      cacheService.update({
         url: firstPostUrl,
         data: newData,
         updateRelatedKeys: {
            entityUniqueField: "id",
            keysSelector: {url: postsUrl},
         },
      });

      expect(cacheService.data[firstPostUrl]).toEqual(newData);
      expect(cacheService.data[postsUrl][0]).toEqual(newData);
      expect(cacheService.data[postsUrl.concat("?active=true")][0]).toEqual(newData);
   });

   it("Updates the related key correctly if `exact=true`", async () => {
      await customFetch(firstPostUrl);
      await customFetch(postsUrl);
      await customFetch(postsUrl, {active: true});

      const newData = {id: 1, testKey: "this data is new."};

      cacheService.update({
         url: firstPostUrl,
         data: newData,
         updateRelatedKeys: {
            entityUniqueField: "id",
            keysSelector: {url: postsUrl, exact: true},
         },
      });

      expect(cacheService.data[postsUrl][0]).toEqual(newData);
      expect(cacheService.data[postsUrl.concat("?active=true")][0]).not.toEqual(newData);
   });

   it("Accepts the `pathToContainingField` param.", async () => {
      await customFetch(firstPostUrl);
      await customFetch(postsWithPaginationUrl);

      const newData = {id: 1, testKey: "this data is new."};

      cacheService.update({
         url: firstPostUrl,
         data: newData,
         updateRelatedKeys: {
            entityUniqueField: "id",
            keysSelector: {
               url: postsWithPaginationUrl,
               arrayFieldName: "results",
            },
         },
      });

      expect(cacheService.data[postsWithPaginationUrl]["results"][0]).toEqual(newData);
   });

   it("Accepts the `resolver` param.", async () => {
      await customFetch(firstPostUrl);
      await customFetch(postsWithPaginationUrl);

      const newData = {id: 1, testKey: "this data is new."};

      cacheService.update({
         url: firstPostUrl,
         data: newData,
         updateRelatedKeys: {
            entityUniqueField: "id",
            keysSelector: {
               url: postsWithPaginationUrl,
               resolver: ({oldData, updatedEntity}) => {
                  return {
                     ...oldData,
                     results: oldData.results.map((item: any) => {
                        return item.id === updatedEntity.id ? updatedEntity : item;
                     }),
                  };
               },
            },
         },
      });

      expect(cacheService.data[postsWithPaginationUrl]["results"][0]).toEqual(newData);
   });
});

function customFetch(url: string, params?: QueryParams) {
   return lastValueFrom(
      cacheService.get({
         url,
         params,
         observable: ({arrangedUrl}) => observableFunction(arrangedUrl),
      })
   );
}
