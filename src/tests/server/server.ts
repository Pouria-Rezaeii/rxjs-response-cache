import {Observable} from "rxjs";
import {posts} from "./posts";
import {internalServerErrorException, notFoundException} from "./errors";

let counter = 1;

export function mockServer(url: string, throwError?: boolean) {
   return new Observable((observer) => {
      setTimeout(() => {
         if (throwError) {
            observer.error(internalServerErrorException);
            // posts
         } else if (url === "/posts" || url.startsWith("/posts?")) {
            observer.next(posts);
            observer.complete();
            // posts/:id
         } else if (url.startsWith("/posts/")) {
            const id = url.split("/")[2];
            const post = posts.find((p) => p.id.toString() === id);
            if (post) {
               observer.next(post);
               observer.complete();
            } else {
               observer.error(notFoundException);
            }
            // current-counter
         } else if (url === "/current-counter") {
            observer.next({counter});
            observer.complete();
            counter++;
            // reset-counter
         } else if (url === "/reset-counter") {
            observer.next(null);
            observer.complete();
            counter = 1;
         } else {
            // not-found
            observer.error(notFoundException);
         }
      }, 50);
   });
}
