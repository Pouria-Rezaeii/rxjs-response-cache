import {QueryParams} from "./index.type";

export type RemoveQueryOptions = {
   uniqueIdentifier?: string;
   exact?: boolean;
   /** @deprecated Use params instead */
   queryParams?: QueryParams;
   params?: QueryParams;
};
