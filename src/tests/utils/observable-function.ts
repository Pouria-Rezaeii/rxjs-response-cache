import {Observable} from "rxjs";
import {mockServer} from "../server/server";

export function observableFunction<T>(url: string, options?: {throwError: boolean}): Observable<T> {
   return new Observable((observer) => {
      mockServer(url, options?.throwError).subscribe({
         next: (data) => {
            observer.next(data as T);
            observer.complete();
         },
         error: (err) => {
            observer.error(err);
         },
      });
   });
}
