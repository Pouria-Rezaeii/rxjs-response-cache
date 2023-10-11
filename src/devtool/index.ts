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
      id: ids.container,
      styles: styles.container(config?.styles, devtoolIsOpen),
   });

   const title = createElement({
      tagName: "h1",
      innerHtml: "Cache Devtool",
      styles: styles.title,
   });

   const list = createElement({
      id: ids.list,
      styles: styles.list,
   });

   const buttonsBox = createElement({
      styles: styles.devtoolControlsBox,
   });

   const logCacheButton = createElement({
      innerHtml: "Log Cache Last State",
      class: "button",
      styles: styles.logCacheButton,
      onClick: onClickCacheStateButton,
   });

   const clearDevtoolButton = createElement({
      innerHtml: "✕ Clear Devtool",
      class: "button",
      styles: styles.clearDevtoolButton,
      onClick: clearHistory,
   });

   buttonsBox.appendChild(clearDevtoolButton);
   buttonsBox.appendChild(logCacheButton);
   container.appendChild(title);
   container.appendChild(generateSearchBox());
   container.appendChild(list);
   container.appendChild(buttonsBox);
   document.querySelector("body")?.appendChild(container);
}

function generateSearchBox() {
   const searchBox = createElement({
      styles: styles.searchBox,
   });

   const searchInputContainer = createElement({
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
      innerHtml: "Showing all results.",
      id: ids.searchHelperText,
      styles: styles.searchHelperText,
   });

   searchBox.appendChild(searchInputContainer);
   searchBox.appendChild(searchHelperText);

   return searchBox;
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
      styles: styles.itemButtonsBox,
   });

   const dataButton = createElement({
      innerHtml: "Log Data",
      class: "button",
      styles: styles.itemButton,
      onClick: () => console.log(data),
   });

   const cacheButton = createElement({
      innerHtml: "Cache State",
      class: "button",
      styles: styles.itemButton,
      onClick: () => console.log(cacheState),
   });

   itemButtonsBox.appendChild(dataButton);
   itemButtonsBox.appendChild(cacheButton);

   const listItem = createElement({
      styles: styles.listItem,
   });

   const itemTextContentBox = createElement({});

   [
      {key: `#${number}`, value: time},
      {key: "URL:", value: url, primaryColor: true},
      {key: "Status:", value: status},
   ].forEach((item) => {
      const row = createElement({
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
