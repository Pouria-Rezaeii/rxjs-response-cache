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

export class CacheService {
   private _isDev: boolean;
   private _showDevtool: boolean;
   private _config: CacheConfigType;
   private _cachedData: Record<string, any> = {};
   private _clearTimeouts: Record<string, number> = {};
   private _observables: Record<string, ObservableFunc> = {};

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
