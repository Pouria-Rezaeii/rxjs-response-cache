## Rxjs Cache Service

A lightweight ( 18kb gZipped ), zero-dependency client-side package that lets you cache rxjs GET responses before working with.

It significantly improves user experience in applications where data does not change during a session or, the change frequency is low.

### Document Main Sections

-  <a href="#features"> Main Features </a>
-  <a href="#usage"> Usage Example </a>
-  <a href="#angular"> Usage in Angular </a>

### <section id="features"> Main Features </section>

-  Globally available through the whole application
-  Improving user experience by increasing the data accessibility speed
-  Reducing network requests
-  Using stale data while refreshing
-  Prefetch easily
-  Clear timeout
-  <b>Integrated devtool</b> which lets you inspect the cache event history visually
-  Ease of use

### <section id="usage"> Usage Example </section>

Instantiate the cacheService in the root of your application or in any other place in the components tree.

```ts
const cacheService = new CacheService({
   isDevMode: process.env.MODE === "development",
   devtool: {
      show: true,
      isOpenInitially: true,
   },
});
```

Provide it if you need and start using.

<b>Please Note</b> that you can use the get method in 2 ways:

-  Using arrangedUrl
-  Ignoring arrangedUrl

<b>arrangedUrl</b> is the key string that the service uses to store the data. Is the combination of url query params (if provided), defaultParams and params. Alphabetically sorted, and empty strings and undefined values are removed.

Example 1 ( Using arrangedUrl ):

```ts
function getPosts() {
   return cacheService.get({
      url: "posts",
      defaultParams: {page: 1, "page-size": 20},
      params: urlParamsObject,
      observable: ({arrangedUrl}) => rxjs_observable<Post[]>(arrangedUrl).pipe(your_operations),
   });
}
```

Example 2 ( Ignoring arrangedUrl argument and working with your own data ):

```ts
function getPosts() {
   const url = "posts";
   const params = urlParamsObject;
   return cacheService.get({
      url: url,
      defaultParams: {page: 1, "page-size": 20},
      params: params,
      observable: () => rxjs_observable<Post[]>(url, {params}).pipe(your_operations),
   });
}
```

<b>Important Hint:</b> For getting the best possible result of the service, always add your default params.

### <section id="angular"> Usage Example in Angular </section>

Hint: Make sure you have read the <a href="#usage"> Usage Example </a> section first.

```ts
function cacheServiceFactory() {
    return new CacheService({
        isDevMode: isDevMode(),
        devtool: your_desired_options,
    });
}

@NgModule({
    providers: [
        { provide: CacheService, useFactory: cacheServiceFactory },
    ],
})
```

And start using it in your services:

```ts
getPosts() {
    return this._cacheService.get({
        url: 'posts',
        observable: ({arrangedUrl}) => this._httpClient.get<Post[]>(arrangedUrl),
        ...other_params
    });
}
```
