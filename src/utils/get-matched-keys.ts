import {UrlQueryOptions} from "../types/cache.type";
import {rearrangeUrl} from "./rearrange-url";

export function getMatchedKeys(params: {
   source: Record<string, any>;
   keyPart: string;
   options?: UrlQueryOptions;
   paramsObjectIsPrior?: boolean;
}) {
   const {source, keyPart, options, paramsObjectIsPrior} = params;
   const rearrangedKey = rearrangeUrl(keyPart, options?.queryParams, paramsObjectIsPrior);

   if (options?.exact) {
      return Object.keys(source).filter((url) => url === rearrangedKey);
   } else {
      // temporarily ignoring query params
      let matches = Object.keys(source).filter((url) => url.includes(rearrangedKey.split("?")[0]));
      // check for query params
      if (rearrangedKey.split("?")[1]) {
         const queryKeyValuePairs = rearrangedKey.split("?")[1].split("&");
         matches = matches.filter((url) => queryKeyValuePairs.every((pair) => url.includes(pair)));
      }
      return matches;
   }
}
