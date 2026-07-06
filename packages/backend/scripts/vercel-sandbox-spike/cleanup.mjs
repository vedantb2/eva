// @ts-check
/** Deletes every sandbox and snapshot in the spike project. Throwaway project only. */
import { Sandbox } from "@vercel/sandbox";
import { Snapshot } from "@vercel/sandbox";

const CREDS = {
  token: process.env.VERCEL_TOKEN,
  teamId: process.env.VERCEL_TEAM_ID,
  projectId: process.env.VERCEL_PROJECT_ID,
};

let sandboxes = 0;
let snapshots = 0;

const sbxList = await Sandbox.list(CREDS);
for await (const s of sbxList) {
  try {
    const sbx = await Sandbox.get({ ...CREDS, name: s.name, resume: false });
    await sbx.delete();
    sandboxes++;
    console.log(`deleted sandbox ${s.name}`);
  } catch (e) {
    console.log(`skip sandbox ${s.name}: ${String(e).split("\n")[0]}`);
  }
}

const snapList = await Snapshot.list(CREDS);
for await (const snap of snapList) {
  try {
    const s = await Snapshot.get({ ...CREDS, snapshotId: snap.id });
    await s.delete();
    snapshots++;
    console.log(`deleted snapshot ${snap.id}`);
  } catch (e) {
    console.log(`skip snapshot ${snap.id}: ${String(e).split("\n")[0]}`);
  }
}

console.log(`\nDone. Deleted ${sandboxes} sandboxes, ${snapshots} snapshots.`);
