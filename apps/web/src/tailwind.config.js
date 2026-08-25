// Bridge so both Vite (resolves `@config` from this stylesheet) and oj
// (resolves it from the Vite root) land on the same config.
export { default, themeExtend } from "../tailwind.config.js";
