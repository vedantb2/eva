import fs from "fs";

const commitMsgPath = process.argv[2];
if (!commitMsgPath || !fs.existsSync(commitMsgPath)) {
  process.exit(0);
}

const lines = fs.readFileSync(commitMsgPath, "utf8").split(/\r?\n/);
const filtered = lines.filter((line) => {
  const trimmed = line.trim();
  if (/^Co-authored-by:\s*Cursor\s*<cursoragent@cursor\.com>\s*$/i.test(trimmed)) {
    return false;
  }
  if (/^Made-with:\s*Cursor\s*$/i.test(trimmed)) {
    return false;
  }
  return true;
});

while (filtered.length > 0 && filtered[filtered.length - 1].trim() === "") {
  filtered.pop();
}

fs.writeFileSync(commitMsgPath, filtered.length === 0 ? "" : `${filtered.join("\n")}\n`);
