module.exports = {
   "**/*.(ts)": (filenames) => [
      "yarn tsc --noEmit",
      `yarn eslint --fix ${filenames.join(" ")}`,
      `yarn prettier --write ${filenames.join(" ")}`,
   ],

   // Format MarkDown and JSON
   "**/*.(json)": (filenames) => `yarn prettier --write ${filenames.join(" ")}`,
};
