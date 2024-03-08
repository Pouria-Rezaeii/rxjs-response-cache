import {UpdateCallback, UpdateParams} from "../../types/update.type";
import {uidSeparator} from "../../constants/uid-separator";
import {isObject} from "../../utils/is-object";
import {getMatchedKeys} from "../../utils/get-matched-keys";
import {deepEqual} from "../../utils/deep-equal";
import {errorPrefix} from "../../constants/error-prefix";
import {HandlerAssets} from "../../types/index.type";

// todo: handle clearTimeout in next minor version (I should save the previous timeout value in order to using it here)

export function update<T>(assets: HandlerAssets, input: UpdateParams<T>): void {
   const {rearrangeUrl, updateDevtool, showDevtool, config, isDev, cachedData} = assets;
   const {uniqueIdentifier: uid, url: _rawUrl, data: _data, params, updateRelatedKeys} = input;
   const url = rearrangeUrl({url: _rawUrl, params: params});
   const key = uid ? uid + uidSeparator + url : url;

   if (!cachedData.has(key)) {
      const messageText = "⛔ You intended to update a key which is not present in the cache.";
      showDevtool && updateDevtool(key, messageText, {key: undefined});
      if (isDev) {
         throw new Error(errorPrefix + messageText);
      }
      return;
   }

   const newValue =
      typeof _data === "function" ? (_data as UpdateCallback<T>)(cachedData.get(key)) : _data;

   const oldValue = cachedData.get(key);
   cachedData.set(key, newValue);

   // DEVTOOL UPDATE
   if (showDevtool) {
      const messageText = "✎ data updated";
      updateDevtool(key, messageText, {oldValue, newValue});
   }

   // =========================  UPDATING RELATED KEYS

   if (updateRelatedKeys) {
      try {
         const {entityUniqueField: uniqueKey, keysSelector} = updateRelatedKeys;

         if (!isObject(newValue)) {
            const messageText =
               "updateRelatedKeys is only available if the provided data constructor is Object. Check the docs for more info.";
            if (isDev) {
               throw new Error(errorPrefix + messageText);
            }
            if (showDevtool) {
               updateDevtool(key, messageText, newValue);
            }
            return;
         }

         if (!Object.hasOwn(newValue as object, uniqueKey)) {
            const messageText = `The provided data does not include the provided entityUniqueField (${uniqueKey}). Check the docs for more info.`;
            if (isDev) {
               throw new Error(errorPrefix + messageText);
            }
            if (showDevtool) {
               updateDevtool(key, messageText, newValue);
            }
            return;
         }

         // todo: add Array scenario

         const {arrayFieldName: path, updateHandler, url: selectorUrl, ...options} = keysSelector;
         const matches = getMatchedKeys({
            source: cachedData,
            url: selectorUrl,
            options: options,
            paramsObjectOverwrites: config.paramsObjectOverwritesUrlQueries!,
            removeNullValues: config.removeNullValues!,
         })
            // filtering the original one
            .filter((k) => k !== key);

         if (path) {
            matches.forEach((key) => {
               const staleData = cachedData.get(key);
               if (!Array.isArray(staleData[path])) {
                  const messageText = `updateRelatedKeys only iterates on arrays. But, data[${path}] does not resolve to an array field. Check the docs for more info.`;
                  if (isDev) {
                     throw new Error(errorPrefix + messageText);
                  }
                  if (showDevtool) {
                     updateDevtool(key, messageText, {
                        providedPath: path,
                        data: staleData,
                     });
                  }
                  return;
               }
               const freshData = {
                  ...staleData,
                  [path]: (staleData[path] as any[]).map((entity: any) => {
                     return entity[uniqueKey] === (newValue as any)[uniqueKey] ? newValue : entity;
                  }),
               };

               CheckEqualityAndUpdate({
                  key,
                  staleData,
                  freshData,
                  cachedData,
                  showDevtool,
                  updateDevtool,
               });
            });
         } else if (updateHandler) {
            matches.forEach((key) => {
               const staleData = cachedData.get(key);
               const freshData = updateHandler({oldData: staleData, updatedEntity: newValue});

               CheckEqualityAndUpdate({
                  key,
                  staleData,
                  freshData,
                  cachedData,
                  showDevtool,
                  updateDevtool,
               });
            });
         } else {
            matches.forEach((key) => {
               const staleData = cachedData.get(key);
               if (!Array.isArray(staleData)) {
                  const messageText = `updateRelatedKeys only iterates on arrays. Check the docs for more info.`;
                  if (isDev) {
                     throw new Error(errorPrefix + messageText);
                  }
                  if (showDevtool) {
                     updateDevtool(key, messageText, {key: staleData});
                  }
                  return;
               }
               const freshData = (staleData as any[]).map((entity: any) => {
                  return entity[uniqueKey] === (newValue as any)[uniqueKey] ? newValue : entity;
               });

               CheckEqualityAndUpdate({
                  key,
                  staleData,
                  freshData,
                  cachedData,
                  showDevtool,
                  updateDevtool,
               });
            });
         }
      } catch (error) {
         isDev && console.log(error);
      }
   }
}

function CheckEqualityAndUpdate(inputs: any) {
   const {key, staleData, freshData, cachedData, showDevtool, updateDevtool} = inputs;
   if (deepEqual(staleData, freshData)) {
      if (showDevtool) {
         updateDevtool(key, "x Matched but NOT updated", {
            oldValue: staleData,
            newValue: freshData,
         });
      }
   } else {
      cachedData.set(key, freshData);
      if (showDevtool) {
         updateDevtool(key, "✎ Matched and updated", {
            oldValue: staleData,
            newValue: freshData,
         });
      }
   }
}
