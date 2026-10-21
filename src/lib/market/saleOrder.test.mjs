import test from "node:test";
import assert from "node:assert/strict";
import { compareAsks, groupByCollection } from "./saleOrder.ts";

const order = ["miyamaker-mini", "mialien-eth", "bannerz-by-koolskull"];

test("each collection stays in floor order, cheapest ask first inside it", () => {
  const tiles = [
    { collectionId: "mialien-eth", currency: "ETH", raw: "100", price: "0.0000000000000001 ETH", token: "1" },
    { collectionId: "miyamaker-mini", currency: "ETH", raw: "500", price: "0.3 ETH", token: "9" },
    { collectionId: "miyamaker-mini", currency: "CULT", raw: "10", price: "10 CULT", token: "9" },
    { collectionId: "miyamaker-mini", currency: "ETH", raw: "100", price: "0.1 ETH", token: "4" },
    { collectionId: "bannerz-by-koolskull", currency: "ETH", raw: "50", price: "0.05 ETH", token: "2" },
  ];
  const groups = groupByCollection(tiles, order, compareAsks);
  assert.deepEqual(groups.map((group) => group.collectionId), ["miyamaker-mini", "mialien-eth", "bannerz-by-koolskull"]);
  assert.deepEqual(groups[0].tiles.map((tile) => tile.price), ["10 CULT", "0.1 ETH", "0.3 ETH"]);
  for (const tile of tiles) assert.ok(tile.price.trim());
});

test("a cheaper other collection does not jump ahead of an earlier type", () => {
  const groups = groupByCollection(
    [
      { collectionId: "mialien-eth", currency: "ETH", raw: "1", price: "0.01 ETH" },
      { collectionId: "miyamaker-mini", currency: "ETH", raw: "9", price: "0.9 ETH" },
    ],
    order,
    compareAsks,
  );
  assert.equal(groups[0].collectionId, "miyamaker-mini");
  assert.equal(groups[0].tiles[0].price, "0.9 ETH");
});
