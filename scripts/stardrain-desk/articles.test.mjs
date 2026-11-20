import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { approvalMessage, loginMessage } from "./messages.js";

const root = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(root, "../../public/stardrain/desk/articles.json"), "utf8"));
const seen = new Set();

function walk(nodes, depth) {
  assert.ok(depth < 4);
  for (const node of nodes) {
    assert.match(node.id, /^[a-z0-9-]{1,64}$/);
    assert.equal(seen.has(node.id), false);
    seen.add(node.id);
    assert.equal(typeof node.title, "string");
    assert.ok(node.title.length > 0);
    if (node.children) {
      assert.equal(node.paragraphs, undefined);
      walk(node.children, depth + 1);
    } else {
      assert.ok(Array.isArray(node.paragraphs));
      assert.ok(node.paragraphs.length > 0);
      for (const paragraph of node.paragraphs) assert.equal(typeof paragraph, "string");
    }
  }
}

walk(catalog.sections, 0);
assert.equal(catalog.editor, "koolskull.eth");
assert.match(catalog.publisher, /2kool Productions LLC, Los Angeles, CA/);
assert.ok(seen.has("how-to-approve"));
assert.equal(typeof catalog.sections[0].summary, "string");
assert.match(approvalMessage("hotel", " south side "), /Article: hotel/);
assert.match(approvalMessage("hotel", " south side "), /south side$/);
assert.match(loginMessage("0x0000000000000000000000000000000000000000"), /Action: login/);
console.log(`stardrain-desk: ${seen.size} articles and sections`);
