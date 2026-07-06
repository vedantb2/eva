/** Thin VM image pull (node:20-bookworm) before tooling bootstrap. */
export const VM_SNAPSHOT_THIN_SUFFIX = "-vm-thin";
export const VM_SNAPSHOT_BASE_SUFFIX = "-vm";

export function vmBaseSnapshotName(containerSnapshotName: string): string {
  return `${containerSnapshotName}${VM_SNAPSHOT_BASE_SUFFIX}`;
}

export function vmThinSnapshotName(containerSnapshotName: string): string {
  return `${containerSnapshotName}${VM_SNAPSHOT_THIN_SUFFIX}`;
}

/** Eva tooling base on experimental (no baked repo — seed prep clones fresh). */
export function isVmToolingBaseSnapshot(snapshotName: string): boolean {
  return (
    snapshotName.endsWith(VM_SNAPSHOT_BASE_SUFFIX) &&
    !snapshotName.endsWith(VM_SNAPSHOT_THIN_SUFFIX)
  );
}

/** VM-class snapshots are registered in Daytona's experimental region. */
export function isVmRegionSnapshotName(snapshotName: string): boolean {
  return (
    snapshotName.endsWith(VM_SNAPSHOT_THIN_SUFFIX) ||
    snapshotName.endsWith(VM_SNAPSHOT_BASE_SUFFIX)
  );
}
