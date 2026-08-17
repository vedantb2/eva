"use client";

import { Tabs, TabsList, TabsTrigger } from "@eva/ui";
import {
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTablet,
} from "@tabler/icons-react";
import type { PreviewDevice } from "../_utils/-previewAnnotation";

export function PreviewDeviceToggle({
  value,
  onChange,
}: {
  value: PreviewDevice;
  onChange: (device: PreviewDevice) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (next === "desktop" || next === "tablet" || next === "mobile") {
          onChange(next);
        }
      }}
    >
      {/* `title` alone is a weak accessible name and invisible on touch, and the
          triggers paint under 40px — `hit-target` grows the tap area only. */}
      <TabsList className="h-8">
        <TabsTrigger
          value="desktop"
          className="hit-target px-2 text-xs"
          aria-label="Frame preview as desktop"
          title="Desktop"
        >
          <IconDeviceDesktop size={14} />
        </TabsTrigger>
        <TabsTrigger
          value="tablet"
          className="hit-target px-2 text-xs"
          aria-label="Frame preview as tablet"
          title="Tablet"
        >
          <IconDeviceTablet size={14} />
        </TabsTrigger>
        <TabsTrigger
          value="mobile"
          className="hit-target px-2 text-xs"
          aria-label="Frame preview as mobile"
          title="Mobile"
        >
          <IconDeviceMobile size={14} />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
