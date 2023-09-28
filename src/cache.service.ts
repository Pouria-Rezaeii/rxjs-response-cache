import {
   CacheConfigType,
   ObservableFunc,
   ObservableConfig,
   Subscriber,
   UrlQueryOptions,
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

/**
 * @class Global caching service for rxjs GET method responses.
 * @see how to use on {@link https://github.com/Pouria-Rezaeii/rxjs-cache-service#readme}
 * @usageNote Instantiate the service at the root level of your application, and with the help
 * of the get method, store rxjs GET method responses in a global context,
 * and access them in any other place or any other time ---
 * Multiple instances is supported, but the devtool SHOULD be used only for one instance at a time.
 * */
export class CacheService {
   private _isDev: boolean;
   private _showDevtool: boolean;
   private _config: CacheConfigType;
   private _cachedData: Record<string, any> = {};
   private _clearTimeouts: Record<string, number> = {};
   private _observables: Record<string, ObservableFunc> = {};

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
         cacheState: structuredClone(this._cachedData),
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
    *       is zero dependency and and does not now which version of rxjs your going to pass in
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
      const {url: _url, defaultParams, params, observable, refresh, clearTime} = config;
      const url = rearrangeUrl({
         url: _url,
         defaultParams,
         params: params,
         paramsObjectOverwrites: this._config.paramsObjectOverwritesUrlQueries,
      });
      this._observables[url] = observable;
      const isPresentInCache = this._cachedData[url];

      return new this._config.observableConstructor((subscriber) => {
         if (isPresentInCache && !refresh) {
            this._readFromCache(subscriber, url, clearTime);
         } else if (isPresentInCache && refresh) {
            this._readFromCacheAndRefresh(subscriber, url, clearTime);
         } else {
            this._fetch(subscriber, url, clearTime);
         }
      });
   }

   private _readFromCache(subscriber: Subscriber, url: string, clearTimeout?: number) {
      subscriber.next(this._cachedData[url]);
      this._showDevtool &&
         this._updateDevtool(url, "❤️ Present in the cache", this._cachedData[url]);
      subscriber.complete();
      if (clearTimeout && ![this._clearTimeouts[url]]) {
         this._setClearTimeout(url, clearTimeout, this._cachedData[url]);
      }
   }

   private _readFromCacheAndRefresh(subscriber: Subscriber, url: string, clearTimeout?: number) {
      subscriber.next(this._cachedData[url]);
      this._showDevtool &&
         this._updateDevtool(url, "❤️ Present in the cache", this._cachedData[url]);
      this._observables[url](url).subscribe({
         error: (err) => subscriber.error(err),
         next: (res) => {
            this._cachedData[url] = res;
            subscriber.next(res);
            subscriber.complete();
            this._showDevtool && this._updateDevtool(url, "🔁 Refreshed", res);
            clearTimeout && this._setClearTimeout(url, clearTimeout, res);
         },
      });
   }

   private _fetch(subscriber: Subscriber, url: string, clearTimeout?: number) {
      this._observables[url](url).subscribe({
         error: (err) => subscriber.error(err),
         next: (res) => {
            this._cachedData[url] = res;
            subscriber.next(res);
            subscriber.complete();
            this._showDevtool && this._updateDevtool(url, "✅ Not present, fetched", res);
            clearTimeout && this._setClearTimeout(url, clearTimeout, res);
         },
      });
   }

   private _setClearTimeout(url: string, timeout: number, data: any) {
      const oldTimeoutId = this._clearTimeouts[url];
      if (oldTimeoutId) {
         // deleting the old one
         clearTimeout(oldTimeoutId);
         this._isDev && removeTimeoutFromLocalStorage(oldTimeoutId);
      }

      const timeoutId = setTimeout(() => {
         delete this._cachedData[url];
         delete this._observables[url];
         delete this._clearTimeouts[url];
         this._isDev && removeTimeoutFromLocalStorage(timeoutId as unknown as number);
         this._showDevtool && this._updateDevtool(url, "🗑 Removed by timeout", data);
      }, timeout);
      // setting a new one
      this._clearTimeouts[url] = timeoutId as unknown as number;
      this._isDev && addTimeoutToLocalStorage(timeoutId as unknown as number);

      const date = new Date();
      date.setMilliseconds(date.getMilliseconds() + timeout);
      this._showDevtool &&
         this._updateDevtool(url, `🕓 Removal timeout set for ${date.toLocaleTimeString()}`, data);
   }

   /**
    * Searches for all matched keys based on a given string key and deletes them from the cache
    * @see examples on {@link https://github.com/Pouria-Rezaeii/rxjs-cache-service#readme}
    * @prop options.exact --- specifies if the search operation should be based on exact match or not
    * @usageNote Query params can be included in both the key argument or the options.params property ---
    * Before searching, query params will be sorted alphabetically and empty strings, null and undefined
    * values will be removed
    */
   public clean(urlQuery: string, options?: UrlQueryOptions) {
      const matches = getMatchedKeys({
         source: this._cachedData,
         keyPart: urlQuery,
         options: options,
         paramsObjectOverwrites: this._config.paramsObjectOverwritesUrlQueries,
      });
      matches.forEach((url, index) => {
         delete this._cachedData[url];
         delete this._observables[url];
         clearTimeout(this._clearTimeouts[url]);
         delete this._clearTimeouts[url];
         this._showDevtool &&
            this._updateDevtool(url, `🗑 Matched and removed (${index + 1}/${matches.length})`, {
               urlQuery,
               urlQueryOptions: options || {},
            });
      });
   }

   /** Resets the cache state */
   public resetCache() {
      this._cachedData = {};
      this._observables = {};
      this._clearTimeouts = {};
      this._showDevtool && this._updateDevtool("ALL", "RESET CACHE", "CACHE IS EMPTY.");
   }

   get config(): any {
      return {...this._config};
   }

   get cachedData() {
      return {...this._cachedData};
   }

   get observables() {
      return {...this._observables};
   }

   get clearTimeouts() {
      return {...this._clearTimeouts};
   }
}
