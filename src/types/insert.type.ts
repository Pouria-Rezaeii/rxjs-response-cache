import {QueryParams} from "./index.type";

export type InsertParams = {
   uniqueIdentifier?: string;
   url: string;
   clearTimeout?: number;
   params?: QueryParams;
   data: any;
};
