import test from "node:test";
import assert from "node:assert/strict";
import { mediaKind, mediaSrc, nftMedia } from "./mediaKind.ts";

test("stills, pages, audio, and video each open as their own kind", () => {
  assert.equal(mediaKind("https://cdn.example/art.png"), "image");
  assert.equal(mediaKind("https://cdn.example/piece.mp4?id=1"), "video");
  assert.equal(mediaKind("https://cdn.example/track.mp3"), "audio");
  assert.equal(mediaKind("https://cdn.example/token.html"), "iframe");
  assert.equal(mediaKind("ipfs://bafy-animation", "animation"), "iframe");
  assert.equal(mediaKind("javascript:alert(1)"), "empty");
  assert.equal(mediaSrc("  javascript:alert(1)"), null);
});

test("the fullscreen still is the original file, and the animation is kept", () => {
  const media = nftMedia({
    display_image_url: "https://cdn.example/small.png",
    image_url: "https://cdn.example/original.png",
    animation_url: "https://cdn.example/player.html",
    description: "ignored",
  });
  assert.equal(media.image, "https://cdn.example/small.png");
  assert.equal(media.full, "https://cdn.example/original.png");
  assert.equal(media.animation, "https://cdn.example/player.html");
});
