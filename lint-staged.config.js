// eslint-disable-next-line no-undef
module.exports = {
   // Type check TypeScript files
   "**/*.(ts)": () => "yarn tsc --noEmit",

   // Lint then format TypeScript and JavaScript files
   "**/*.(ts|js)": (filenames) => [
      `yarn eslint --fix ${filenames.join(" ")}`,
      `yarn prettier --write ${filenames.join(" ")}`,
   ],

   // Format MarkDown and JSON
   "**/*.(md|json)": (filenames) => `yarn prettier --write ${filenames.join(" ")}`,
};
