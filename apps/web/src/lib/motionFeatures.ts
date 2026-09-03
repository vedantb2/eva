/**
 * Motion feature bundle, isolated so `LazyMotion` can `import()` it after
 * first paint. Importing `domMax` from `MotionProvider.tsx` would put the
 * layout-animation graph back on the entry chunk — the whole reason this
 * file exists.
 */
export { domMax as default } from "motion/react";
