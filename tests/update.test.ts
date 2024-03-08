import {ResponseCache as Cache} from "../src/index";
import {firstPostUrl, postsUrl, postsWithPaginationUrl} from "./server/urls";
import {posts} from "./server/posts";
import {getLastFactory} from "./utils/custom-get";

describe("Cache Service Update Method", () => {
   let cache: Cache;
   let getLast: ReturnType<typeof getLastFactory>;

   beforeEach(() => {
      cache = new Cache({isDevMode: false});
      getLast = getLastFactory(cache);
   });

   it("Replace individual key correctly.", async () => {
      await getLast({url: firstPostUrl});

      cache.update({
         url: firstPostUrl,
         data: {test: "test"},
      });
      expect(cache.data[firstPostUrl]).toEqual({test: "test"});
   });

   it("Passes the old data correctly.", async () => {
      await getLast({url: firstPostUrl});

      cache.update<(typeof posts)[0]>({
         url: firstPostUrl,
         data: (oldData) => ({...oldData, test: "test"}),
      });
      expect(cache.data[firstPostUrl]).toEqual({...posts[0], test: "test"});
   });

   it("Does not insert the data if key is not present in the cache.", async () => {
      cache.update({
         url: firstPostUrl,
         data: {test: "test"},
      });
      expect(cache.data[firstPostUrl]).toEqual(undefined);
   });

   it("Updates the related key correctly if `exact=false`", async () => {
      await getLast({url: firstPostUrl});
      await getLast({url: postsUrl});
      await getLast({url: postsUrl, params: {active: true}});

      expect(cache.data[firstPostUrl]).toEqual(posts[0]);
      expect(cache.data[postsUrl]).toEqual(posts);

      const newData = {id: 1, testKey: "this data is new."};

      cache.update({
         url: firstPostUrl,
         data: newData,
         updateRelatedKeys: {
            entityUniqueField: "id",
            keysSelector: {url: postsUrl},
         },
      });

      expect(cache.data[firstPostUrl]).toEqual(newData);
      expect(cache.data[postsUrl][0]).toEqual(newData);
      expect(cache.data[postsUrl.concat("?active=true")][0]).toEqual(newData);
   });

   it("Updates the related key correctly if `exact=true`", async () => {
      await getLast({url: firstPostUrl});
      await getLast({url: postsUrl});
      await getLast({url: postsUrl, params: {active: true}});

      const newData = {id: 1, testKey: "this data is new."};

      cache.update({
         url: firstPostUrl,
         data: newData,
         updateRelatedKeys: {
            entityUniqueField: "id",
            keysSelector: {url: postsUrl, exact: true},
         },
      });

      expect(cache.data[postsUrl][0]).toEqual(newData);
      expect(cache.data[postsUrl.concat("?active=true")][0]).not.toEqual(newData);
   });

   it("Accepts the `pathToContainingField` param.", async () => {
      await getLast({url: firstPostUrl});
      await getLast({url: postsWithPaginationUrl});

      const newData = {id: 1, testKey: "this data is new."};

      cache.update({
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

      expect(cache.data[postsWithPaginationUrl]["results"][0]).toEqual(newData);
   });

   it("Accepts the `updateHandler` param.", async () => {
      await getLast({url: firstPostUrl});
      await getLast({url: postsWithPaginationUrl});

      const newData = {id: 1, testKey: "this data is new."};

      cache.update({
         url: firstPostUrl,
         data: newData,
         updateRelatedKeys: {
            entityUniqueField: "id",
            keysSelector: {
               url: postsWithPaginationUrl,
               updateHandler: ({oldData, updatedEntity}) => {
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

      expect(cache.data[postsWithPaginationUrl]["results"][0]).toEqual(newData);
   });
});
