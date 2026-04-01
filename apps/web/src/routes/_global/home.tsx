import { createFileRoute } from "@tanstack/react-router";
import { ReposClient } from "./home/ReposClient";

export const Route = createFileRoute("/_global/home")({
  component: ReposClient,
});
