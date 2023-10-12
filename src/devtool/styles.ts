import {DevtoolConfig} from "./type";
import {defaults} from "../defaults";

type CSSStyles = Partial<CSSStyleDeclaration>;
type StylesConfig = DevtoolConfig["styles"];

const defaultStyles = defaults.devtool.styles;
const primaryColor = "#d97b5d";
const secondaryColor = "#155263";

const buttonDefaultStyles: CSSStyles = {
   boxSizing: "border-box",
   display: "inline-flex",
   justifyContent: "center",
   alignItems: "center",
   padding: "8px 16px",
   fontSize: "14px",
   fontWeight: "500",
   cursor: "pointer",
   borderRadius: "4px",
   border: "1px solid #00000088",
};

export const flexBox: CSSStyles = {
   display: "flex",
};

export const toggleButton = (stylesConfig: StylesConfig): CSSStyles => ({
   ...buttonDefaultStyles,
   position: "fixed",
   right: `${stylesConfig?.toggleButtonPosition?.right || defaultStyles.right}px`,
   bottom: `${stylesConfig?.toggleButtonPosition?.bottom || defaultStyles.bottom}px`,
   zIndex: (stylesConfig?.zIndex || defaultStyles.zIndex).toString(),
   flexDirection: "column",
   gap: "4px",
   fontSize: "12px",
   padding: "8px",
   width: "58px",
   lineHeight: "1.6",
   textAlign: "center",
   userSelect: "none",
   backgroundColor: secondaryColor,
   color: primaryColor,
});

export const container = (stylesConfig: StylesConfig, isInitiallyOpen: boolean): CSSStyles => ({
   boxSizing: "border-box",
   display: "flex",
   flexDirection: "column",
   width: `${defaultStyles.containerWidth}px`,
   maxWidth: "80vw",
   height: "100dvh",
   position: "fixed",
   zIndex: (stylesConfig?.zIndex || defaultStyles.zIndex).toString(),
   top: "0",
   left: isInitiallyOpen ? "0" : `-${defaultStyles.containerWidth}px`,
   transition: ".2s ease-in-out",
   backgroundColor: secondaryColor,
   boxShadow: "0 1px 3px 1px #00000088",
   padding: "20px 6px 20px 10px",
});

export const titleBox: CSSStyles = {
   width: "100%",
   display: "flex",
   justifyContent: "space-between",
   alignItems: "center",
   paddingRight: "10px",
   marginBottom: "24px",
};

export const title: CSSStyles = {
   fontSize: "30px",
   color: primaryColor,
   textShadow: "1px 1px 4px #333",
};

export const closeButton: CSSStyles = {
   ...buttonDefaultStyles,
   padding: "0",
   border: "1px solid #ffffff33",
   fontSize: "20px",
   width: "30px",
   height: "30px",
   color: "#ffffff55",
};

export const searchBox: CSSStyles = {
   width: "100%",
   marginBottom: "12px",
};

export const searchInputContainer: CSSStyles = {
   width: "calc(100% - 11px)",
   position: "relative",
   marginBottom: "4px",
};

export const searchInput: CSSStyles = {
   width: "100%",
   outline: "none",
   padding: "7px 40px 7px 10px",
   border: "1px solid #ffffff66",
   borderRadius: "4px",
   color: "#ffffffdd",
   fontSize: "14px",
   backgroundColor: "#00000033",
};

export const inputClearButton: CSSStyles = {
   position: "absolute",
   right: "0",
   top: "0",
   height: "100%",
   width: "36px",
   display: "flex",
   justifyContent: "center",
   alignItems: "center",
   cursor: "pointer",
   fontSize: "22px",
   color: "#ffffff88",
};

export const searchHelperText: CSSStyles = {
   paddingLeft: "3px",
};

export const list: CSSStyles = {
   maxHeight: "calc(100dvh - 240px)",
   overflowY: "scroll",
   overflowX: "hidden",
   paddingRight: "8px",
};

export const listItem: CSSStyles = {
   width: "100%",
   paddingTop: "6px",
   marginBottom: "6px",
   display: "flex",
   gap: "12px",
   justifyContent: "space-between",
   alignItems: "center",
   borderTop: "1px solid #00000044",
};

export const devtoolControlsBox: CSSStyles = {
   marginTop: " auto",
   display: "flex",
   width: "100%",
   gap: "6px",
};

export const logCacheButton: CSSStyles = {
   ...buttonDefaultStyles,
   width: "100%",
   height: "32px",
   backgroundColor: primaryColor,
   borderRadius: " 4px",
   color: "#333",
   border: "none",
};

export const clearDevtoolButton: CSSStyles = {
   ...buttonDefaultStyles,
   width: "100%",
   height: "32px",
   backgroundColor: "transparent",
   border: `solid 1px ${primaryColor}`,
   color: primaryColor,
   borderRadius: " 4px",
};

export const itemButtonsBox: CSSStyles = {
   flexShrink: "0",
   display: "flex",
   flexDirection: "column",
   gap: "4px",
};

export const itemButton: CSSStyles = {
   ...buttonDefaultStyles,
   textAlign: "center",
   fontSize: "11px",
   width: "42px",
   height: "32px",
   padding: "3px",
   backgroundColor: "#00000018",
   borderRadius: "4px",
   color: "#ffffffcc",
   border: "1px solid #00000055",
   lineHeight: "1.15",
};

export function addDefaultStyles() {
   document.head.insertAdjacentHTML(
      "beforeend",
      `<style>
         @import url('https://fonts.googleapis.com/css2?family=Ubuntu&display=swap');
         #devtool-container * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            color: #c2c2c2;
            font-family: Ubuntu , Oxygen , Roboto , Cantarell;
            font-size: 13px;
            line-height: 1.5;
         }
      
         .devtool-button:hover {
            transition: .2s;
            filter: saturate(1.15) brightness(115%);
         }
      
         .primary-color {
            color: ${primaryColor} !important;
         }
      
         input::placeholder {
            color: #ffffff66;
         }
      
         ::selection {
            color: #ffffff;
            background-color: ${primaryColor};
         }
      
         #devtool-list::-webkit-scrollbar {
            width: 5px;
         }
      
         #devtool-list::-webkit-scrollbar-track {
            background-color: #ffffff18;
         }
      
         #devtool-list::-webkit-scrollbar-thumb {
            background-color: #ffffff66;
         }
      </style>`
   );
}
