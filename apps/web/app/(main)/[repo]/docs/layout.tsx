import { DocsClient } from "./DocsClient";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsClient>{children}</DocsClient>;
}
