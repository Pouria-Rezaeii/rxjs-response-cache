import {ResponseCache as Cache} from "../src/index";
import {uidSeparator} from "../src/constants/uid-separator";

describe("Cache Service Insert Method", () => {
   let cacheService: Cache;

   beforeEach(() => {
      cacheService = new Cache({isDevMode: false});
   });

   it("Inserts new data correctly.", async () => {
      const fakeData = {id: 1};
      cacheService.insert({
         uniqueIdentifier: "uid",
         url: "fake-data",
         params: {"test-param": "test"},
         data: fakeData,
      });
      expect(cacheService.data[`uid${uidSeparator}fake-data?test-param=test`]).toEqual(fakeData);
   });

   it("It DOES NOT replace the old data if the key is already present in the cache.", async () => {
      const oldData = {id: 1};
      cacheService.insert({url: "fake-data", data: oldData});

      cacheService.insert({url: "fake-data", data: {id: 2}});

      expect(cacheService.data["fake-data"]).toEqual(oldData);
   });
});
