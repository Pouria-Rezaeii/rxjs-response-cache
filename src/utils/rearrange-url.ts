import {QueryParams} from "../types/cache.type";
import {defaults} from "../defaults";

/* sorts params alphabetically and removes possible extra params */
export function rearrangeUrl(inputs: {
   url: string;
   defaultParams?: QueryParams;
   params?: QueryParams;
   paramsObjectOverwrites?: boolean;
   removeNullValues?: boolean;
}) {
   const {
      url: _url,
      defaultParams,
      params,
      paramsObjectOverwrites = defaults.paramsObjectOverwrites,
      removeNullValues = defaults.removeNullValues,
   } = inputs;

   const removable = ["", "''", '""', "undefined", "NaN"];
   if (removeNullValues) {
      removable.push("null");
   }

   const splitUrl = _url.split("?");
   const apiAddress = splitUrl[0];
   const urlParams = splitUrl[1] || "";

   if (
      !urlParams &&
      !Object.keys(defaultParams || {}).length &&
      !Object.keys(params || {}).length
   ) {
      return apiAddress;
   }

   const urlParamObject = urlParams.split("&").reduce<Record<string, string>>((prev, item) => {
      const keyValue = item.split("=");
      prev[keyValue[0]] = keyValue[1];
      return prev;
   }, {});

   const finalParams = paramsObjectOverwrites
      ? {
           ...defaultParams,
           ...urlParamObject,
           ...params,
        }
      : {
           ...defaultParams,
           ...params,
           ...urlParamObject,
        };

   const stingQueryParams = Object.keys(finalParams).reduce<QueryParams>((acc, key: string) => {
      const value = finalParams[key];
      // converting 3 falsy value to save them from being removed in next filter operation
      if (value === null || value === false || value === 0) {
         acc![key] = String(value);
      } else {
         acc![key] = value;
      }
      return acc;
   }, {});

   const formattedQueryParams = Object.keys(stingQueryParams)
      // removing redundant values
      .filter(
         (key) => !!stingQueryParams[key] && !removable.includes(stingQueryParams[key].toString())
      )
      .sort((a, b) => a.localeCompare(b))
      // joining key value pairs
      .map((key) => key + "=" + stingQueryParams[key])
      .join("&");

   const formattedUrl = apiAddress + "?" + formattedQueryParams;
   return formattedUrl;
}
