export function createElement(options: {
   tagName?: keyof HTMLElementTagNameMap;
   innerHtml?: string;
   id?: string;
   class?: string;
   styles?: Partial<CSSStyleDeclaration>;
   title?: string;
   onClick?: (event: Event) => void;
}) {
   const element = document.createElement(options.tagName || "div");
   options.innerHtml && (element.innerHTML = options.innerHtml);
   options.id && element.setAttribute("id", options.id);
   options.class && element.setAttribute("class", options.class);
   options.title && element.setAttribute("title", options.title);
   options.onClick && element.addEventListener("click", (e) => options.onClick?.(e));

   if (options.styles) {
      for (const key in options.styles) {
         element.style[key] = (options.styles as CSSStyleDeclaration)[key];
      }
   }
   return element;
}
