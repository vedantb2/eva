import { defineApp } from "convex/server";
import presence from "@convex-dev/presence/convex.config.js";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config.js";
import timeline from "convex-timeline/convex.config.js";
import workflow from "@convex-dev/workflow/convex.config.js";

const app = defineApp();
app.use(presence);
app.use(prosemirrorSync);
app.use(timeline);
app.use(workflow);

export default app;
