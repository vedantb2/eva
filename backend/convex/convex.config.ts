import { defineApp } from "convex/server";
import presence from "@convex-dev/presence/convex.config.js";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config.js";

const app = defineApp();
app.use(presence);
app.use(prosemirrorSync);

export default app;
