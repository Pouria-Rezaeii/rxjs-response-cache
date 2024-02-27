import {RemoveQueryOptions} from "../types/index.type";
import {mapToObject} from "./map-to-object";
import {rearrangeUrl} from "./rearrange-url";
import {uidSeparator} from "../constants/uid-separator";

export function getMatchedKeys(params: {
   source: Map<string, any>;
   url: string;
   options?: RemoveQueryOptions;
   paramsObjectOverwrites: boolean;
   removeNullValues: boolean;
}) {
   const {source, url, options, paramsObjectOverwrites, removeNullValues} = params;
   const uid = options?.uniqueIdentifier;

   const sourceObject = mapToObject(source);
   const rearrangedUrl = rearrangeUrl({
      url,
      params: options?.queryParams,
      paramsObjectOverwrites,
      removeNullValues,
   });
   const key = uid ? uid + uidSeparator + rearrangedUrl : rearrangedUrl;

   if (options?.exact) {
      return Object.keys(sourceObject).filter((sourceKey) => sourceKey === key);
   } else {
      // temporarily ignoring query params
      let matches = Object.keys(sourceObject).filter(
         // checking the uid and the url separately to make sure everything works correctly
         // if some part in the middle is ignored by the user
         // some_uid__companies/some_id will match with {url: some_id, uid: some_uid}
         (sourceKey) => {
            if (uid) {
               return sourceKey.includes(uid) && sourceKey.includes(url.split("?")[0]);
            } else {
               return !sourceKey.includes(uidSeparator) && sourceKey.includes(url.split("?")[0]);
            }
         }
      );
      // check for query params
      if (key.split("?")[1]) {
         // example of queryKeyValuePairs: ["a=b", "c=d"]
         const queryKeyValuePairs = key.split("?")[1].split("&");
         // each matchedKey should include all the key=value pairs
         matches = matches.filter((matchedKey) =>
            queryKeyValuePairs.every((pair) => matchedKey.includes(pair))
         );
      }
      return matches;
   }
}
