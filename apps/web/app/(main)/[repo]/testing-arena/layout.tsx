import { TestingArenaClient } from "./TestingArenaClient";

export default function TestingArenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TestingArenaClient>{children}</TestingArenaClient>;
}
