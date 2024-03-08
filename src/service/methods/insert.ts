import {InsertParams} from "../../types/insert.type";
import {uidSeparator} from "../../constants/uid-separator";
import {errorPrefix} from "../../constants/error-prefix";
import {HandlerAssets} from "../../types/index.type";

export function insert(assets: HandlerAssets, params: InsertParams): void {
   const {rearrangeUrl, updateDevtool, showDevtool, isDev, cachedData, setClearTimeout} = assets;
   const {uniqueIdentifier: uid, url: _rawUrl, data, clearTimeout} = params;
   const url = rearrangeUrl({url: _rawUrl, params: params.params});
   const key = uid ? uid + uidSeparator + url : url;
   if (cachedData.has(key)) {
      const messageText =
         "⛔ This key is already in the cache. If you intend to update it, consider using the update method instead.";
      showDevtool && updateDevtool(key, messageText, {key: cachedData.get(key)});
      if (isDev) {
         throw new Error(errorPrefix + messageText);
      }
      return;
   }
   cachedData.set(key, data);
   clearTimeout && setClearTimeout(key, clearTimeout, data);

   // DEVTOOL UPDATE
   if (showDevtool) {
      let messageText = "➕ New data inserted";
      clearTimeout && (messageText += assets.getRemovalTimeoutMessage(clearTimeout));
      updateDevtool(key, messageText, data);
   }
}
