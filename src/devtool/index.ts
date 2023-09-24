import {createElement} from "./create-element";
import * as styles from "./styles";
import {ids} from "./ids";
import {DevtoolConfig, DevtoolHistoryListItem, DevtoolListItem} from "./type";
import {defaults} from "../defaults";

let history: DevtoolHistoryListItem[] = [];
let devtoolIsOpen = defaults.devtool.isOpenInitially;
let lastQuery = "";
let config: DevtoolConfig | undefined;

export function attachDevtool(params: {
   devtoolConfig?: DevtoolConfig;
   onClickCacheStateButton: (state: any) => void;
}) {
   // reset for possible hot reloads ==========
   config = params.devtoolConfig;
   devtoolIsOpen = config?.isOpenInitially || defaults.devtool.isOpenInitially;
   clearHistory();
   // =========================================
   styles.addDefaultStyles();
   attachToggleButton();
   attachContainer(params.onClickCacheStateButton);
}

export function updateDevtool(listItem: DevtoolListItem) {
   const listItemWithTime = {...listItem, time: new Date().toLocaleTimeString()};
   history.push(listItemWithTime);

   if (listItemWithTime.url.includes(lastQuery)) {
      const listItem = createListItem(history.length, listItemWithTime);
      const list = document.getElementById(ids.list);
      list?.appendChild(listItem);
      list!.scrollTop = list!.scrollHeight;
   }
}

function clearHistory() {
   history = [];
   const list = document.getElementById(ids.list);
   list && (list.innerHTML = "");
}

function attachToggleButton() {
   if (document.getElementById(ids.toggleButton)) {
      return;
   }

   const toggleButton = createElement({
      tagName: "div",
      innerHtml: "Cache Devtool",
      id: ids.toggleButton,
      class: "button",
      styles: styles.toggleButton(config?.styles),
      onClick: () => {
         const container = document.getElementById(ids.container);
         container!.style.left = `${
            devtoolIsOpen ? -container!.getBoundingClientRect().width : 0
         }px`;
         devtoolIsOpen = !devtoolIsOpen;
      },
   });
   document.querySelector("body")?.appendChild(toggleButton);
}

function attachContainer(onClickCacheStateButton: (state: any) => void) {
   if (document.getElementById(ids.container)) {
      // removing previous devtool and creating a new one in hot reloads
      document.getElementById(ids.container)!.remove();
   }

   const container = createElement({
      tagName: "div",
      id: ids.container,
      styles: styles.container(config?.styles, devtoolIsOpen),
   });

   const title = createElement({
      tagName: "h1",
      innerHtml: "Cache Devtool",
      styles: styles.title,
   });

   const searchInputContainer = createElement({
      tagName: "div",
      styles: styles.searchInputContainer,
   });

   const searchInput = createElement({
      tagName: "input",
      id: ids.searchInput,
      styles: styles.searchInput,
   });
   searchInput.setAttribute("placeholder", "Search in URLs...");
   searchInput.addEventListener("keyup", (event) => {
      if ((event as KeyboardEvent).key === "Enter") {
         filterListByQuery((event.target as HTMLInputElement).value);
      }
   });

   const inputClearButton = createElement({
      tagName: "div",
      innerHtml: "✕",
      class: "button",
      styles: styles.inputClearButton,
      onClick: () => {
         filterListByQuery("");
         (document.getElementById(ids.searchInput) as HTMLInputElement).value = "";
      },
   });

   searchInputContainer.appendChild(searchInput);
   searchInputContainer.appendChild(inputClearButton);

   const searchHelperText = createElement({
      tagName: "div",
      innerHtml: "Showing all results.",
      id: ids.searchHelperText,
      styles: styles.searchHelperText,
   });

   const list = createElement({
      tagName: "div",
      id: ids.list,
      styles: styles.list,
   });

   const buttonsBox = createElement({
      tagName: "div",
      styles: styles.devtoolControlsBox,
   });

   const logCacheButton = createElement({
      tagName: "div",
      innerHtml: "Log Cache Last State",
      class: "button",
      styles: styles.logCacheButton,
      onClick: onClickCacheStateButton,
   });

   const clearDevtoolButton = createElement({
      tagName: "div",
      innerHtml: "✕ Clear Devtool",
      class: "button",
      styles: styles.clearDevtoolButton,
      onClick: clearHistory,
   });

   buttonsBox.appendChild(clearDevtoolButton);
   buttonsBox.appendChild(logCacheButton);
   container.appendChild(title);
   container.appendChild(searchInputContainer);
   container.appendChild(searchHelperText);
   container.appendChild(list);
   container.appendChild(buttonsBox);
   document.querySelector("body")?.appendChild(container);
}

function filterListByQuery(query: string) {
   if (query === lastQuery) {
      return;
   }

   lastQuery = query;
   document.getElementById(ids.list)!.innerHTML = "";
   document.getElementById(ids.searchHelperText)!.innerHTML = query
      ? `Showing results for <span class='primary-color' style='text-decoration: underline'>${query}</span>`
      : "Showing all results.";

   const list = document.getElementById(ids.list)!;
   const result = query ? history.filter((item) => item.url.includes(query)) : history;

   result.forEach((item, index) => {
      const listItem = createListItem(index + 1, item);
      list.appendChild(listItem);
   });
}

function createListItem(number: number, params: DevtoolHistoryListItem) {
   const {url, status, data, cacheState, time} = params;
   const itemButtonsBox = createElement({
      tagName: "div",
      styles: styles.itemButtonsBox,
   });

   const dataButton = createElement({
      tagName: "div",
      innerHtml: "Log Data",
      class: "button",
      styles: styles.itemButton,
      onClick: () => console.log(data),
   });

   const cacheButton = createElement({
      tagName: "div",
      innerHtml: "Cache State",
      class: "button",
      styles: styles.itemButton,
      onClick: () => console.log(cacheState),
   });

   itemButtonsBox.appendChild(dataButton);
   itemButtonsBox.appendChild(cacheButton);

   const listItem = createElement({
      tagName: "div",
      styles: styles.listItem,
   });

   const itemTextContentBox = createElement({
      tagName: "div",
   });

   [
      {key: `#${number}`, value: time},
      {key: "URL:", value: url, primaryColor: true},
      {key: "Status:", value: status},
   ].forEach((item) => {
      const row = createElement({
         tagName: "div",
         styles: styles.flexBox,
         innerHtml: `
      <p style="width:48px; flex-shrink:0;">${item.key}</p>
      <p
        class="${item.primaryColor ? "primary-color" : ""}"
        style="max-width: 250px; overflow-x: hidden; word-wrap: break-word;"
      >
        ${item.value}
      </p>`,
      });
      itemTextContentBox.appendChild(row);
   });

   listItem.appendChild(itemTextContentBox);
   listItem.appendChild(itemButtonsBox);
   return listItem;
}
