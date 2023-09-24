export interface DevtoolConfig {
   show?: boolean;
   isOpenInitially?: boolean;
   styles?: {
      zIndex?: number;
      toggleButtonPosition?: {
         right?: number;
         bottom?: number;
      };
   };
}

export interface DevtoolListItem {
   url: string;
   status: string;
   data: any;
   cacheState: any;
}

export interface DevtoolHistoryListItem extends DevtoolListItem {
   time: string;
}
