import {ObservableConfig} from "../types/cache.type";
import {defaults} from "../defaults";

export function rearrangeUrl(
   _url: string,
   params: ObservableConfig["params"] = {},
   paramsObjectIsPrior: boolean = defaults.paramsObjectIsPrior
) {
   const splitUrl = _url.split("?");
   const apiAddress = splitUrl[0];
   const urlParams = splitUrl[1] || "";

   if (!urlParams && !Object.keys(params).length) {
      return apiAddress;
   }

   const urlParamObject = urlParams.split("&").reduce<Record<string, string>>((prev, item) => {
      const keyValue = item.split("=");
      prev[keyValue[0]] = keyValue[1];
      return prev;
   }, {});

   const finalParams = paramsObjectIsPrior
      ? {
           ...urlParamObject,
           ...params,
        }
      : {
           ...params,
           ...urlParamObject,
        };

   const formattedQueryParams = Object.keys(finalParams)
      .filter(
         (key) =>
            finalParams[key] &&
            !["", "''", '""', "undefined", "null"].includes(finalParams[key].toString())
      )
      .sort((a, b) => a.localeCompare(b))
      .map((key) => key + "=" + finalParams[key].toString())
      .join("&");

   const formattedUrl = apiAddress + "?" + formattedQueryParams;
   return formattedUrl;
}
