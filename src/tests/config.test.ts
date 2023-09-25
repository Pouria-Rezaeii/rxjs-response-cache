import {Observable, lastValueFrom} from "rxjs";
import {CacheService} from "../cache.service";
import {postsUrl} from "./server/urls";
import {observableFunction} from "./utils/observable-function";

describe("Cache service configuration", () => {
   let cacheService: CacheService;

   beforeEach(() => {
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
      });
   });

   // todo: write tests for configurations
   it("todo", async () => {});
});
