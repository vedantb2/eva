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
      <TabsList className="h-8">
        <TabsTrigger value="desktop" className="px-2 text-xs" title="Desktop">
          <IconDeviceDesktop className="size-3.5" />
        </TabsTrigger>
        <TabsTrigger value="tablet" className="px-2 text-xs" title="Tablet">
          <IconDeviceTablet className="size-3.5" />
        </TabsTrigger>
        <TabsTrigger value="mobile" className="px-2 text-xs" title="Mobile">
          <IconDeviceMobile className="size-3.5" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
