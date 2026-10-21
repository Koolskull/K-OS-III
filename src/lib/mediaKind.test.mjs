import test from "node:test";
import assert from "node:assert/strict";
import { fileStill, mediaKind, mediaSrc, nftMedia, stillPair, wideStill } from "./mediaKind.ts";

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

test("a seadn square crop becomes the wide original", () => {
  const square = "https://i2c.seadn.io/ethereum/0xabc/banner.png?w=500&h=500";
  const wide = wideStill(square);
  assert.equal(wide, "https://i2c.seadn.io/ethereum/0xabc/banner.png?w=1600");
  assert.equal(wideStill("https://i2c.seadn.io/ethereum/0xabc/banner.png"), "https://i2c.seadn.io/ethereum/0xabc/banner.png?w=1600");
  assert.equal(wideStill("https://koolskull.com/miyamakermini/metadata/images/4.png"), "https://koolskull.com/miyamakermini/metadata/images/4.png");
  assert.equal(wideStill("javascript:alert(1)"), null);
});

test("a dead stardrain file is not the one FILE opens", () => {
  const dead = "https://stardrain.app/mialien/metadata/images/1313.jpg";
  const display = "https://i2c.seadn.io/ethereum/0xabc/1313.jpeg?w=500";
  assert.equal(fileStill(dead), null);
  const pair = stillPair(false, dead, display, dead);
  assert.equal(pair.image, display);
  assert.equal(pair.full, "https://i2c.seadn.io/ethereum/0xabc/1313.jpeg?w=1600");
});

test("a hosted original stays ahead of the seadn copy", () => {
  const png = "https://koolskull.com/miyamakermini/metadata/images/4.png";
  const sea = "https://i2c.seadn.io/ethereum/0xabc/4.png";
  const pair = stillPair(false, png, sea, sea);
  assert.equal(pair.image, png);
  assert.equal(pair.full, png);
});

test("wide art opens the uncropped seadn file", () => {
  const sea = "https://i2c.seadn.io/ethereum/0xabc/banner.png?w=500&h=500";
  const pair = stillPair(true, null, sea, sea);
  assert.equal(pair.image, "https://i2c.seadn.io/ethereum/0xabc/banner.png?w=1600");
  assert.equal(pair.full, pair.image);
});
