import {
   CacheConfigType,
   ObservableConfig,
   InsertParams,
   RemoveQueryOptions,
} from "./types/cache.type";
import {Observable, Subscriber} from "rxjs";
import {rearrangeUrl as __rearrangeUrl, RearrangeUrlInput} from "./utils/rearrange-url";
import {getMatchedKeys} from "./utils/get-matched-keys";
import {
   addTimeoutToLocalStorage,
   clearAllTimeoutsInLocalStorage,
   removeTimeoutFromLocalStorage,
} from "./utils/timeout-utils";
import {defaults} from "./defaults";
import {mapToObject} from "./utils/map-to-object";
import {uidSeparator} from "./constants/uid-separator";

/**
 * @tutorial {@link https://github.com/Pouria-Rezaeii/rxjs-response-cache?tab=readme-ov-file#beginning}}
 *
 * @usageNote Multiple instances is supported, but the devtool SHOULD be used with one instance at a time
 *
 * @description Global caching service for RxRS GET responses.
 *
 * @description Instantiate the cache service at the root of your application or any other location within the components tree.
 * */
export class ResponseCache {
   private readonly _isDev: boolean;
   private readonly _showDevtool: boolean;
   private readonly _config: CacheConfigType;
   private _cachedData = new Map<string, any>();
   private _clearTimeouts = new Map<string, number>();
   private _observables = new Map<string, ObservableConfig<any>["observable"]>();

   /**
    * @description Global caching service for RxJS GET responses.
    *
    * @tutorial {@link https://github.com/Pouria-Rezaeii/rxjs-response-cache?tab=readme-ov-file#usage}
    *
    * @usageNote Multiple instances is supported, but the devtool SHOULD be used with one instance at a time
    *
    * @description Instantiate the cache service at the root of your application or any other location within the components tree.
    *
    * @description <br/>Use the service's <b>`get()</b> method to store RxJS GET responses in the cache before starting to work with them.
    * Access the cached data from any other place or at any other time.
    *
    * @param isDevMode --- In dev mode, clear timeout IDs will be stored in local storage to be cleared in possible hot-reloads.This ensures that the devtool does not display incorrect information from previous loads during development.<br/><br/><b>Additionally</b>, the devtool is available only in dev mode.
    *
    * @param paramsObjectOverwritesUrlQueries --- [ default=true ] Determines how the service should behave if a query parameter is accidentally present in both the url parameter and the params parameter.<br/><br/><b>Example</b>: `cacheService.get({url: "/posts?page=2", params: {page: 3}, observable:() => observable})` <b>by default will be resolved to</b> `"/post?page=3"`.
    *
    * @param removeNullValues --- [ default=true ] Determines whether null values should be removed from query parameters or not.
    *
    * @param preventSecondCallIfDataIsUnchanged --- [ default=true ] Determines whether the `observable.next()` should be invoked again when the refreshed data is identical to the stale data.<br/><br/>By default, the observable.next() is invoked only once in such cases, optimizing to prevent unnecessary rerenders in applications.<br/><br/>If desired, you can pass `false` and perform your own check within your application.
    *
    * @param devtool --- Developer tool configuration. See <a href="https://github.com/Pouria-Rezaeii/rxjs-response-cache?tab=readme-ov-file#devtool-params">Devtool Available  Parameters</a>.
    */
   constructor(config: CacheConfigType) {
      this._config = {
         ...config,
         removeNullValues: config.removeNullValues ?? defaults.removeNullValues,
         paramsObjectOverwritesUrlQueries:
            config.paramsObjectOverwritesUrlQueries ?? defaults.paramsObjectOverwrites,
         preventSecondCallIfDataIsUnchanged:
            config.preventSecondCallIfDataIsUnchanged ?? defaults.preventSecondCall,
      };
      this._isDev = config.isDevMode;
      this._showDevtool =
         config.isDevMode &&
         (config.devtool?.show !== undefined ? config.devtool.show : defaults.devtool.show);
      if (this._showDevtool) {
         import("./devtool").then((m) => {
            m.attachDevtool({
               devtoolConfig: config.devtool,
               onClickCacheStateButton: () => console.log(mapToObject(this._cachedData)),
            });
         });
      }
      // removing all possible saved timeouts ids from the last render (probably lost because of hot reload)
      this._isDev && clearAllTimeoutsInLocalStorage();
   }

   private _updateDevtool(url: string, status: string, data: any) {
      if (this._showDevtool) {
         import("./devtool").then((m) => {
            m.updateDevtool({
               url: url,
               status: status,
               data: data,
               cacheState: mapToObject(this._cachedData),
            });
         });
      }
   }

   private _rearrangeUrl(params: Pick<RearrangeUrlInput, "url" | "params" | "defaultParams">) {
      return __rearrangeUrl({
         ...params,
         paramsObjectOverwrites: this._config.paramsObjectOverwritesUrlQueries!,
         removeNullValues: this._config.removeNullValues!,
      });
   }

   /**
    * @tutorial {@link https://github.com/Pouria-Rezaeii/rxjs-response-cache?tab=readme-ov-file#usage}
    *
    * @usageNote the method combines params, defaultParams and query strings contained in the url, orders them alphabetically, removes the empty strings, and undefined values and uses them as the key to store the response.
    *
    * @description Fetches data and stores the expected result in the cache.
    *
    * @param url --- The endpoint address (may include query parameters or not).
    *
    * @param observable --- The callback function that returns an observable. It receives an object containing the `arrangedUrl` as input.<br/>See <a href="https://github.com/Pouria-Rezaeii/rxjs-response-cache?tab=readme-ov-file#structure"> Cache Structure and Auto-Generated Keys </a> for details.
    *
    * @param (uniqueIdentifier) --- This value, if present, will be added to the auto-generated key for storing the data.<br/>See <a href="https://github.com/Pouria-Rezaeii/rxjs-response-cache?tab=readme-ov-file#uid"> When to Use Unique Identifier </a>.
    *
    * @param defaultParams --- The API's default query parameters.<br/>To optimize cache results, ensure to include them if they can be altered by the end-user.
    *
    * @param params --- The queryParams will overwrite the defaultParams, and by default (configurable), any query strings in the url parameter will also be overwritten.
    *
    * @param refresh --- Determines if the data should be refreshed on the next calls or not.<br/>By default, the API will be called only once.
    *
    * @param clearTimeout --- The time in milliseconds used to remove the data from the cache.
    *
    * @returns a new brand observable --- check this <a href="https://github.com/Pouria-Rezaeii/rxjs-response-cache?tab=readme-ov-file#refresh"> Link </a> for more details.
    */
   public get<T = unknown>(config: ObservableConfig<T>): Observable<T> {
      const {uniqueIdentifier: uid, url: _rawUrl, refresh, clearTimeout} = config;
      const url = this._rearrangeUrl({
         url: _rawUrl,
         defaultParams: config.defaultParams,
         params: config.params,
      });
      const key = uid ? uid + uidSeparator + url : url;
      this._observables.set(key, config.observable);
      const isPresentInCache = this._cachedData.get(key);

      return new Observable<T>((subscriber) => {
         if (isPresentInCache && !refresh) {
            this._readFromCache(subscriber, key, clearTimeout);
         } else if (isPresentInCache && refresh) {
            this._readFromCacheAndRefresh(subscriber, key, url, clearTimeout);
         } else {
            this._fetch(subscriber, key, url, clearTimeout);
         }
      });
   }

   private _readFromCache<T>(subscriber: Subscriber<T>, key: string, clearTimeout?: number) {
      const shouldSetClearTimeout = !!clearTimeout && ![this._clearTimeouts.has(key)];
      subscriber.next(this._cachedData.get(key));
      subscriber.complete();
      shouldSetClearTimeout && this._setClearTimeout(key, clearTimeout, this._cachedData.get(key));

      // DEVTOOL UPDATE
      if (this._showDevtool) {
         let messageText = "❤️ Present in the cache";
         shouldSetClearTimeout && (messageText += this._getRemovalTimeoutMessage(clearTimeout));
         this._updateDevtool(key, messageText, this._cachedData.get(key));
      }
   }

   private _readFromCacheAndRefresh<T>(
      subscriber: Subscriber<T>,
      key: string,
      url: string,
      clearTimeout?: number
   ) {
      subscriber.next(this._cachedData.get(key));
      this._showDevtool &&
         this._updateDevtool(key, "❤️ Present in the cache", this._cachedData.get(key));
      this._observables.get(key)!({arrangedUrl: url}).subscribe({
         error: (err) => subscriber.error(err),
         next: (res) => {
            if (this._config.preventSecondCallIfDataIsUnchanged) {
               if (JSON.stringify(this._cachedData.get(key)) !== JSON.stringify(res)) {
                  this._cachedData.set(key, res);
                  subscriber.next(res);
               }
            } else {
               this._cachedData.set(key, res);
               subscriber.next(res);
            }
            subscriber.complete();
            clearTimeout && this._setClearTimeout(key, clearTimeout, res);

            // DEVTOOL UPDATE
            if (this._showDevtool) {
               let messageText = "🔁 Refreshed";
               clearTimeout && (messageText += this._getRemovalTimeoutMessage(clearTimeout));
               this._updateDevtool(key, messageText, res);
            }
         },
      });
   }

   private _fetch<T>(subscriber: Subscriber<T>, key: string, url: string, clearTimeout?: number) {
      this._observables.get(key)!({arrangedUrl: url}).subscribe({
         error: (err) => subscriber.error(err),
         next: (res) => {
            this._cachedData.set(key, res);
            subscriber.next(res);
            subscriber.complete();
            clearTimeout && this._setClearTimeout(key, clearTimeout, res);

            // DEVTOOL UPDATE
            if (this._showDevtool) {
               let messageText = "✅ Not present, fetched";
               clearTimeout && (messageText += this._getRemovalTimeoutMessage(clearTimeout));
               this._updateDevtool(key, messageText, res);
            }
         },
      });
   }

   private _setClearTimeout(key: string, timeout: number, data: any) {
      const oldTimeoutId = this._clearTimeouts.get(key);
      if (oldTimeoutId) {
         // deleting the old one
         clearTimeout(oldTimeoutId);
         this._isDev && removeTimeoutFromLocalStorage(oldTimeoutId);
      }

      const timeoutId = setTimeout(() => {
         // check if data is not already removed by resetting the cache
         // (to prevent the redundant devtool message)
         if (this._cachedData.has(key)) {
            this._cachedData.delete(key);
            this._observables.delete(key);
            this._clearTimeouts.delete(key);
            this._isDev && removeTimeoutFromLocalStorage(timeoutId as unknown as number);
            this._showDevtool && this._updateDevtool(key, "🗑 Removed by timeout", data);
         }
      }, timeout);
      // setting a new one
      this._clearTimeouts.set(key, timeoutId as unknown as number);
      this._isDev && addTimeoutToLocalStorage(timeoutId as unknown as number);
   }

   private _getRemovalTimeoutMessage(timeout: number) {
      const date = new Date();
      date.setMilliseconds(date.getMilliseconds() + timeout);
      return `; 🕓 Removal timeout set for ${date.toLocaleTimeString()}`;
   }

   /**
    * @tutorial {@link https://github.com/Pouria-Rezaeii/rxjs-response-cache?tab=readme-ov-file#clean}
    *
    * @usageNote Query params can be included in both the key argument or the `options.params` parameter. Before searching, query params will be sorted and possibly truncated.
    *
    * @description Allows you to remove specific data or multiple entries from the cache
    *
    * @param url ---  The endpoint address (may include query parameters or not).<br/><b>DO NOT</b> include the `uniqueIdentifier` part here.
    *
    * @param options ---  Extra options for cleaning.
    *
    * @param exact ---  [ <b>available on `options`</b> ] Determines if the query should be based on an exact match or not.
    *
    * @param uniqueIdentifier --- [ <b>available on `options`</b> ] Unique identifier.<br/><b>Note</b>: If the key includes a unique identifier, you should pass it here, even if the query is not based on an exact match.
    *
    * @param queryParams ---  [ <b>available on `options`</b> ] Query Parameters. They will be sorted and truncated if they contain an empty string, undefined, or null (null is configurable).
    *
    */
   public remove(url: string, options?: RemoveQueryOptions) {
      const matches = getMatchedKeys({
         source: this._cachedData,
         uniqueIdentifier: options?.uniqueIdentifier,
         url,
         options: options,
         paramsObjectOverwrites: this._config.paramsObjectOverwritesUrlQueries!,
         removeNullValues: this._config.removeNullValues!,
      });
      matches.forEach((url, index) => {
         this._cachedData.delete(url);
         this._observables.delete(url);
         clearTimeout(this._clearTimeouts.get(url));
         this._clearTimeouts.delete(url);
         this._showDevtool &&
            this._updateDevtool(url, `🗑 Matched and removed (${index + 1}/${matches.length})`, {
               url,
               cleanQueryOptions: options || {},
            });
      });
   }

   public insert(params: InsertParams): void {
      const {uniqueIdentifier: uid, url: _rawUrl, data, clearTimeout} = params;
      const url = this._rearrangeUrl({url: _rawUrl, params: params.params});
      const key = uid ? uid + uidSeparator + url : url;
      if (this._cachedData.has(key)) {
         const messageText =
            "⛔ This key is already in the cache. If you intend to update it, consider using the update method instead.";
         this._showDevtool && this._updateDevtool(key, messageText, data);
         if (this._isDev) {
            throw new Error("RxJS Response Cache Development Error: " + messageText);
         }
         return;
      }
      this._cachedData.set(key, data);
      clearTimeout && this._setClearTimeout(key, clearTimeout, data);

      // DEVTOOL UPDATE
      if (this._showDevtool) {
         let messageText = "➕ New data inserted";
         clearTimeout && (messageText += this._getRemovalTimeoutMessage(clearTimeout));
         this._updateDevtool(key, messageText, data);
      }
   }

   /** Clears the entire cache. */
   public reset() {
      this._cachedData = new Map();
      this._observables = new Map();
      this._clearTimeouts = new Map();
      this._showDevtool && this._updateDevtool("ALL", "CACHE CLEARED", "CACHE IS EMPTY.");
      this._isDev && clearAllTimeoutsInLocalStorage();
   }

   /** Configuration passed to the service.  */
   get config(): any {
      return {...this._config};
   }

   get data() {
      return mapToObject(this._cachedData);
   }

   get observables() {
      return mapToObject(this._observables);
   }

   get clearTimeouts() {
      return mapToObject(this._clearTimeouts);
   }

   // ============= Deprecated =============

   /** @deprecated Use remove() method instead. */
   public clean(url: string, options?: RemoveQueryOptions) {
      this.remove(url, options);
   }

   /** @deprecated Use reset() method instead. */
   public resetCache() {
      this.reset();
   }

   /** @deprecated Use data property instead. */
   get cachedData() {
      return this.data;
   }
}
