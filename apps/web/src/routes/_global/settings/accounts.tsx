import { createFileRoute } from "@tanstack/react-router";
import { AccountsClient } from "@/lib/components/accounts/AccountsClient";

export const Route = createFileRoute("/_global/settings/accounts")({
  staticData: { title: "Settings" },
  component: AccountsClient,
});
