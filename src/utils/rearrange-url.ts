import {ObservableConfig} from "../types/cache.type";
import {defaults} from "../defaults";

/* sorts params alphabetically and removes possible extra params */
export function rearrangeUrl(inputs: {
   url: string;
   defaultParams?: ObservableConfig["defaultParams"];
   params?: ObservableConfig["params"];
   paramsObjectOverwrites?: boolean;
}) {
   const {
      url: _url,
      defaultParams,
      params,
      paramsObjectOverwrites = defaults.paramsObjectOverwrites,
   } = inputs;

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

   const formattedQueryParams = Object.keys(finalParams)
      .filter(
         (key) =>
            finalParams[key] && !["", "''", '""', "undefined"].includes(finalParams[key].toString())
      )
      .sort((a, b) => a.localeCompare(b))
      .map((key) => key + "=" + finalParams[key].toString())
      .join("&");

   const formattedUrl = apiAddress + "?" + formattedQueryParams;
   return formattedUrl;
}
