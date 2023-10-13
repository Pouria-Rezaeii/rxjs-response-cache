import {UrlQueryOptions} from "../types/cache.type";
import {mapToObject} from "./map-to-object";
import {rearrangeUrl} from "./rearrange-url";

export function getMatchedKeys(params: {
   source: Map<string, any>;
   keyPart: string;
   options?: UrlQueryOptions;
   paramsObjectOverwrites?: boolean;
}) {
   const {source, keyPart, options, paramsObjectOverwrites} = params;
   const sourceObject = mapToObject(source);
   const rearrangedKey = rearrangeUrl({
      url: keyPart,
      params: options?.queryParams,
      paramsObjectOverwrites,
   });

   if (options?.exact) {
      return Object.keys(sourceObject).filter((url) => url === rearrangedKey);
   } else {
      // temporarily ignoring query params
      let matches = Object.keys(sourceObject).filter((url) =>
         url.includes(rearrangedKey.split("?")[0])
      );
      // check for query params
      if (rearrangedKey.split("?")[1]) {
         // example of queryKeyValuePairs: ["a=b", "c=d"]
         const queryKeyValuePairs = rearrangedKey.split("?")[1].split("&");
         matches = matches.filter((url) => queryKeyValuePairs.every((pair) => url.includes(pair)));
      }
      return matches;
   }
}
