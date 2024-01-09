import {
   CacheConfigType,
   ObservableFunc,
   ObservableConfig,
   Subscriber,
   CleanQueryOptions,
} from "./types/cache.type";
import {rearrangeUrl} from "./utils/rearrange-url";
import {getMatchedKeys} from "./utils/get-matched-keys";
import {attachDevtool, updateDevtool} from "./devtool";
import {
   addTimeoutToLocalStorage,
   clearAllTimeoutsInLocalStorage,
   removeTimeoutFromLocalStorage,
} from "./utils/timeout-utils";
import {defaults} from "./defaults";
import {mapToObject} from "./utils/map-to-object";
import {uidSeparator} from "./constants/uid-separator";

/**
 * @class Global caching service for rxjs GET method responses.
 * @see how to use on {@link https://github.com/Pouria-Rezaeii/rxjs-cache-service#readme}
 * @usageNote Instantiate the service at the root level of your application, and with the help
 * of the get method, store rxjs GET method responses in a global context,
 * and access them in any other place or any other time ---
 * Multiple instances is supported, but the devtool SHOULD be used only for one instance at a time.
 * */
export class CacheService {
   private readonly _isDev: boolean;
   private readonly _showDevtool: boolean;
   private readonly _config: CacheConfigType;
   private _cachedData = new Map<string, any>();
   private _clearTimeouts = new Map<string, number>();
   private _observables = new Map<string, ObservableFunc>();

   /**
    * @see how to use on {@link https://github.com/Pouria-Rezaeii/rxjs-cache-service#readme}
    * @prop observableConstructor --- pass your version of Observable constructor exported from rxjs package
    * @prop isDevMode --- if true, and devtool.show also equals true, the devtool will be attached to the body
    * @prop paramsObjectOverwritesUrlQueries --- represent if params object should overwrite the query params in the url field, passed to the get method
    * @prop devtool --- develop tool configuration. The Devtool lets you inspect the cache state and cache history
    */
   constructor(config: CacheConfigType) {
      this._config = config;
      this._isDev = config.isDevMode;
      this._showDevtool =
         config.isDevMode &&
         (config.devtool?.show !== undefined ? config.devtool.show : defaults.devtool.show);
      this._showDevtool &&
         attachDevtool({
            devtoolConfig: config.devtool,
            onClickCacheStateButton: () => console.log(this._cachedData),
         });
      // removing all possible saved timeouts ids from the last render (probably lost because of hot reload)
      this._isDev && clearAllTimeoutsInLocalStorage();
   }

   private _updateDevtool(url: string, status: string, data: any) {
      updateDevtool({
         url: url,
         status: status,
         data: data,
         cacheState: mapToObject(this._cachedData),
      });
   }

   /**
    * @see examples on {@link https://github.com/Pouria-Rezaeii/rxjs-cache-service#readme}
    * @usageNote the method combines params, defaultParams and query strings contained in
    *       the url, orders them alphabetically, removes the empty strings, null, and
    *       undefined values and uses them as the key to store the response.
    * @usageNote If using with typescript consider that the method accepts a generic type,
    *       and the generic type should also be contained within the Observable type
    *       (example: get<Observable<Post[]>>(params)). This is because the package
    *       is zero dependency and does not know which version of rxjs your going to pass in
    * @prop url --- the string part of the url (may also contain query strings)
    * @prop observable --- observable callback function (should return your observable function) ---
    *       it receives the rearranged url as argument
    * @prop defaultParams --- the default query parameters which will be overwritten by
    *       the url query strings or params field in the case of duplication ---
    *       If your endpoint uses any default parameters, include them here to get the
    *       best possible result
    * @prop params --- query parameters (will overwrite the defaultParameters and
    *       the url query strings by default)
    * @prop refresh --- pass true if you want to get the refreshed data after the staled ---
    *       If true, the observable.next function probably will be called twice, first time returns the
    *       staled data (if exist), and the last time the refreshed.
    * @prop clearTime --- the time offset in milliseconds that the cached data should be removed
    * @returns a new brand observable
    */
   public get<T>(config: ObservableConfig): T {
      const {uniqueIdentifier: uid, url: _rawUrl, refresh, clearTime} = config;
      const url = rearrangeUrl({
         url: _rawUrl,
         defaultParams: config.defaultParams,
         params: config.params,
         paramsObjectOverwrites: this._config.paramsObjectOverwritesUrlQueries,
      });
      const key = uid ? uid + uidSeparator + url : url;
      this._observables.set(key, config.observable);
      const isPresentInCache = this._cachedData.get(key);

      return new this._config.observableConstructor((subscriber) => {
         if (isPresentInCache && !refresh) {
            this._readFromCache(subscriber, key, clearTime);
         } else if (isPresentInCache && refresh) {
            this._readFromCacheAndRefresh(subscriber, key, url, clearTime);
         } else {
            this._fetch(subscriber, key, url, clearTime);
         }
      });
   }

   private _readFromCache(subscriber: Subscriber, key: string, clearTimeout?: number) {
      subscriber.next(this._cachedData.get(key));
      subscriber.complete();
      let messageText = "❤️ Present in the cache";
      if (clearTimeout && ![this._clearTimeouts.has(key)]) {
         this._setClearTimeout(key, clearTimeout, this._cachedData.get(key));
         messageText += this._getRemovalTimeoutMessage(clearTimeout);
      }
      this._showDevtool && this._updateDevtool(key, messageText, this._cachedData.get(key));
   }

   private _readFromCacheAndRefresh(
      subscriber: Subscriber,
      key: string,
      url: string,
      clearTimeout?: number
   ) {
      subscriber.next(this._cachedData.get(key));
      this._showDevtool &&
         this._updateDevtool(key, "❤️ Present in the cache", this._cachedData.get(key));
      this._observables.get(key)!(url).subscribe({
         error: (err) => subscriber.error(err),
         next: (res) => {
            this._cachedData.set(key, res);
            subscriber.next(res);
            subscriber.complete();
            let messageText = "🔁 Refreshed";
            if (clearTimeout) {
               this._setClearTimeout(key, clearTimeout, res);
               messageText += this._getRemovalTimeoutMessage(clearTimeout);
            }
            this._showDevtool && this._updateDevtool(key, messageText, res);
         },
      });
   }

   private _fetch(subscriber: Subscriber, key: string, url: string, clearTimeout?: number) {
      this._observables.get(key)!(url).subscribe({
         error: (err) => subscriber.error(err),
         next: (res) => {
            this._cachedData.set(key, res);
            subscriber.next(res);
            subscriber.complete();
            let messageText = "✅ Not present, fetched";
            if (clearTimeout) {
               this._setClearTimeout(key, clearTimeout, res);
               messageText += this._getRemovalTimeoutMessage(clearTimeout);
            }
            this._showDevtool && this._updateDevtool(key, messageText, res);
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
    * Searches for all matched keys based on a given string key and deletes them from the cache
    * @see examples on {@link https://github.com/Pouria-Rezaeii/rxjs-cache-service#readme}
    * @prop options.exact --- specifies if the search operation should be based on exact match or not
    * @usageNote Query params can be included in both the key argument or the options.params property ---
    * Before searching, query params will be sorted alphabetically and empty strings, null and undefined
    * values will be removed
    */
   public clean(url: string, options?: CleanQueryOptions) {
      const matches = getMatchedKeys({
         source: this._cachedData,
         uniqueIdentifier: options?.uniqueIdentifier,
         url,
         options: options,
         paramsObjectOverwrites: this._config.paramsObjectOverwritesUrlQueries,
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

   /** Resets the cache state */
   public resetCache() {
      this._cachedData = new Map();
      this._observables = new Map();
      this._clearTimeouts = new Map();
      this._showDevtool && this._updateDevtool("ALL", "CACHE CLEARED", "CACHE IS EMPTY.");
      this._isDev && clearAllTimeoutsInLocalStorage();
   }

   get config(): any {
      return {...this._config};
   }

   get cachedData() {
      return mapToObject(this._cachedData);
   }

   get observables() {
      return mapToObject(this._observables);
   }

   get clearTimeouts() {
      return mapToObject(this._clearTimeouts);
   }
}
