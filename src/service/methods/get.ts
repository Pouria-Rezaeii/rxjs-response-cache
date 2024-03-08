import {ObservableConfig} from "../../types/get.type";
import {Observable} from "rxjs";
import {uidSeparator} from "../../constants/uid-separator";
import {HandlerAssets} from "../../types/index.type";

export function get<T = unknown>(
   assets: HandlerAssets,
   inputs: ObservableConfig<T>
): Observable<T> {
   const {
      rearrangeUrl,
      updateDevtool,
      showDevtool,
      cachedData,
      config,
      observables,
      clearTimeouts,
      setClearTimeout,
      getRemovalTimeoutMessage,
   } = assets;
   const {uniqueIdentifier: uid, url: _rawUrl, refresh, clearTimeout, observable} = inputs;
   const url = rearrangeUrl({
      url: _rawUrl,
      defaultParams: inputs.defaultParams,
      params: inputs.params,
   });
   const key = uid ? uid + uidSeparator + url : url;
   observables.set(key, observable);
   const isPresentInCache = cachedData.get(key);

   return new Observable<T>((subscriber) => {
      if (isPresentInCache && !refresh) {
         const shouldSetClearTimeout = !!clearTimeout && ![clearTimeouts.has(key)];
         subscriber.next(cachedData.get(key));
         subscriber.complete();
         shouldSetClearTimeout && setClearTimeout(key, clearTimeout, cachedData.get(key));

         // DEVTOOL UPDATE
         if (showDevtool) {
            let messageText = "❤️ Present in the cache";
            shouldSetClearTimeout && (messageText += getRemovalTimeoutMessage(clearTimeout));
            updateDevtool(key, messageText, cachedData.get(key));
         }
      } else if (isPresentInCache && refresh) {
         subscriber.next(cachedData.get(key));
         showDevtool && updateDevtool(key, "❤️ Present in the cache", cachedData.get(key));
         (observables.get(key)!({arrangedUrl: url}) as Observable<T>).subscribe({
            error: (err) => subscriber.error(err),
            next: (res) => {
               if (config.preventSecondCallIfDataIsUnchanged) {
                  if (JSON.stringify(cachedData.get(key)) !== JSON.stringify(res)) {
                     cachedData.set(key, res);
                     subscriber.next(res);
                  }
               } else {
                  cachedData.set(key, res);
                  subscriber.next(res);
               }
               subscriber.complete();
               clearTimeout && setClearTimeout(key, clearTimeout, res);

               // DEVTOOL UPDATE
               if (showDevtool) {
                  let messageText = "🔁 Refreshed";
                  clearTimeout && (messageText += getRemovalTimeoutMessage(clearTimeout));
                  updateDevtool(key, messageText, res);
               }
            },
         });
      } else {
         (observables.get(key)!({arrangedUrl: url}) as Observable<T>).subscribe({
            error: (err) => subscriber.error(err),
            next: (res) => {
               cachedData.set(key, res);
               subscriber.next(res);
               subscriber.complete();
               clearTimeout && setClearTimeout(key, clearTimeout, res);

               // DEVTOOL UPDATE
               if (showDevtool) {
                  let messageText = "✅ Not present, fetched";
                  clearTimeout && (messageText += getRemovalTimeoutMessage(clearTimeout));
                  updateDevtool(key, messageText, res);
               }
            },
         });
      }
   });
}
