import {QueryParams} from "./query-params.type";

export type RemoveQueryOptions = {
   uniqueIdentifier?: string;
   exact?: boolean;
   queryParams?: QueryParams;
};
