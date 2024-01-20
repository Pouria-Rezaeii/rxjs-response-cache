import {QueryParams} from "../types/cache.type";
import {defaults} from "../defaults";

type RearrangeUrlInput = {
   url: string;
   defaultParams?: QueryParams;
   params?: QueryParams;
   paramsObjectOverwrites: boolean;
   removeNullValues: boolean;
};

/* sorts params alphabetically and removes possible extra params */
export function rearrangeUrl(input: RearrangeUrlInput) {
   const {url, defaultParams = {}, params = {}, removeNullValues, paramsObjectOverwrites} = input;

   const apiAddress = url.split("?")[0];
   const urlParams = url.split("?")[1] || "";

   if (!urlParams && !Object.keys(defaultParams).length && !Object.keys(params).length) {
      return apiAddress;
   }

   const urlParamsObject = urlParams.split("&").reduce<QueryParams>((prev, item) => {
      const keyValue = item.split("=");
      prev[keyValue[0]] = keyValue[1];
      return prev;
   }, {});

   const concatenatedParams = concatParams({
      defaultParams,
      params,
      urlParamsObject,
      removeNullValues,
      paramsObjectOverwrites,
   });

   const stringQueryParams: string = Object.keys(concatenatedParams)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => key + "=" + concatenatedParams[key])
      .join("&");

   const formattedUrl = apiAddress + "?" + stringQueryParams;
   return formattedUrl;
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

type ConcatParamsInput = Required<Omit<RearrangeUrlInput, "url">> & {urlParamsObject: QueryParams};

function concatParams(input: ConcatParamsInput) {
   const {params, urlParamsObject, defaultParams, removeNullValues, paramsObjectOverwrites} = input;

   const firstSource = defaultParams;
   const secondSource = paramsObjectOverwrites ? urlParamsObject : params;
   const thirdSource = paramsObjectOverwrites ? params : urlParamsObject;
   const concatenatedParams: QueryParams = {};

   append(concatenatedParams, firstSource, removeNullValues);
   append(concatenatedParams, secondSource, removeNullValues);
   append(concatenatedParams, thirdSource, removeNullValues);

   return concatenatedParams;
}

function append(source: QueryParams, params: QueryParams, removeNullValues: boolean) {
   const removable = ["", '""', "undefined", "NaN"];

   Object.keys(params).forEach((key) => {
      const value = String(params[key]);
      if (!removable.includes(value)) {
         if (value !== "null") {
            source[key] = value;
         } else {
            // only include nulls if !removeNullValues && the source does not already contain the same key
            // this will make sure that a null value does not overwrite a non-falsy value
            if (!removeNullValues && !source[key]) {
               source[key] = value;
            }
         }
      }
   });
}
