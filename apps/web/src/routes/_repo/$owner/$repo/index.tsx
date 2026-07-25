import { createFileRoute } from "@tanstack/react-router";
import { NewSessionComposer } from "./sessions/_components/NewSessionComposer";

export const Route = createFileRoute("/_repo/$owner/$repo/")({
  component: NewSessionComposer,
});
