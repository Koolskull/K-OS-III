<?php
require __DIR__ . "/_lib.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  ks_json_out(["error" => "POST required"], 405);
}

$raw = json_decode(file_get_contents("php://input"), true);
$slug = isset($raw["slug"]) ? strval($raw["slug"]) : "";
$minter = isset($raw["minterAddress"]) ? strval($raw["minterAddress"]) : "";
$listId = isset($raw["listId"]) ? strval($raw["listId"]) : "";
$quantity = intval($raw["quantity"] ?? 1);
if ($quantity < 1) $quantity = 1;
if ($quantity > 20) $quantity = 20;

if ($slug === "" || $minter === "" || $listId === "") {
  ks_json_out(["error" => "slug, minterAddress, listId required"], 400);
}
if (!in_array($slug, ks_scatter_slugs(), true)) {
  ks_json_out(["error" => "Unknown collection"], 404);
}

list($colCode, $col) = ks_http("https://api.scatter.art/v1/collection/" . rawurlencode($slug));
if ($colCode < 200 || !is_array($col) || empty($col["address"])) {
  ks_json_out(["error" => "Collection lookup failed"], 502);
}

$minted = intval($col["num_items"] ?? 0);
$max = intval($col["max_items"] ?? 0);
if ($max > 0 && $minted >= $max) {
  ks_json_out(["error" => "SOLD OUT"], 409);
}
if ($max > 0 && $minted + $quantity > $max) {
  ks_json_out(["error" => "Not enough supply left"], 409);
}

list($mintCode, $data, $err) = ks_http("https://api.scatter.art/v1/mint", "POST", [
  "collectionAddress" => $col["address"],
  "chainId" => intval($col["chain_id"] ?? 1),
  "minterAddress" => $minter,
  "lists" => [["id" => $listId, "quantity" => $quantity]],
]);
if ($err || $mintCode < 200) {
  $msg = is_array($data) && isset($data["error"]) ? $data["error"] : "Scatter mint failed";
  ks_json_out(["error" => $msg], 502);
}
ks_json_out($data);
