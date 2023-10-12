// eslint-disable-next-line no-undef
module.exports = {
   "**/*.(ts)": (filenames) => [
      // Type check all TypeScript files (including tests)
      "yarn tsc --noEmit",
      // linting
      `yarn eslint --fix ${filenames.join(" ")}`,
      // run prettier
      `yarn prettier --write ${filenames.join(" ")}`,
   ],

   // Format MarkDown and JSON
   "**/*.(md|json)": (filenames) => `yarn prettier --write ${filenames.join(" ")}`,
};
