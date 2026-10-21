import test from "node:test";
import assert from "node:assert/strict";
import { priceLabel, unitRaw } from "./askPrice.mjs";
import { wideStill } from "../mediaKind.ts";

test("a decimal ask becomes the base-unit raw price", () => {
  assert.equal(unitRaw(0.00034, 18), "340000000000000");
  assert.equal(priceLabel(0.00034, "ETH"), "0.00034 ETH");
});

test("a bare banner file is requested at its original width", () => {
  const src = "https://i2c.seadn.io/ethereum/0x19f053f02c676248faef8dabd88f119f942dc1ab/banner.png";
  assert.equal(wideStill(src), `${src}?w=1600`);
});
