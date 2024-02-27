import {QueryParams} from "./query-params.type";

export type InsertParams = {
   uniqueIdentifier?: string;
   url: string;
   clearTimeout?: number;
   params?: QueryParams;
   data: any;
};
