import {createElement} from "./create-element";
import * as styles from "./styles";
import {ids} from "./ids";
import {DevtoolConfig, DevtoolHistoryListItem, DevtoolListItem} from "./type";
import {defaults} from "../defaults";
import {iconBase64} from "../constants/icon";

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
      innerHtml: `<img src=${iconBase64} alt="rxjs-cache-service" style="width: 24px;height: 24px"/>`,
      id: ids.toggleButton,
      class: "devtool-button",
      styles: styles.toggleButton(config?.styles),
      title: "Toggle Devtool",
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

   const list = createElement({
      id: ids.list,
      styles: styles.list,
   });

   container.appendChild(generateTitleBox());
   container.appendChild(generateSearchBox());
   container.appendChild(list);
   container.appendChild(generateControlsBox(onClickCacheStateButton));
   document.querySelector("body")?.appendChild(container);
}

function generateTitleBox() {
   const titleBox = createElement({
      styles: styles.titleBox,
   });

   const flexBox = createElement({
      styles: {display: "flex", gap: "4px", alignItems: "center"},
   });

   const icon = `<img src=${iconBase64} alt="rxjs-cache-service" />`;

   const title = createElement({
      tagName: "p",
      innerHtml: "Cache Devtool",
      styles: styles.title,
   });

   flexBox.innerHTML = icon;
   flexBox.appendChild(title);

   const closeButton = createElement({
      innerHtml: "✕",
      styles: styles.closeButton,
      class: "devtool-button",
      title: "Close Devtool",
      onClick: () => document.getElementById(ids.toggleButton)?.click(),
   });

   titleBox.appendChild(flexBox);
   titleBox.appendChild(closeButton);

   return titleBox;
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
      class: "devtool-button",
      styles: styles.inputClearButton,
      title: "Clear",
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

function generateControlsBox(onClickCacheStateButton: (state: any) => void) {
   const buttonsBox = createElement({
      styles: styles.devtoolControlsBox,
   });

   const logCacheButton = createElement({
      innerHtml: "Log Cache State",
      class: "devtool-button",
      styles: styles.logCacheButton,
      onClick: onClickCacheStateButton,
      title: "Log Cache Last State",
   });

   const clearDevtoolButton = createElement({
      innerHtml: "✕ Clear Devtool",
      class: "devtool-button",
      styles: styles.clearDevtoolButton,
      onClick: clearHistory,
   });

   buttonsBox.appendChild(clearDevtoolButton);
   buttonsBox.appendChild(logCacheButton);

   return buttonsBox;
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
      class: "devtool-button",
      styles: styles.itemButton,
      onClick: () => console.log(data),
      title: "Log data in the console",
   });

   const cacheButton = createElement({
      innerHtml: "Log Cache",
      class: "devtool-button",
      styles: styles.itemButton,
      onClick: () => console.log(cacheState),
      title: "Log cache state in the console",
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
         styles: {display: "flex"},
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
