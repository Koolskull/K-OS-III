<?php
require __DIR__ . "/_lib.php";

$address = isset($_GET["address"]) ? trim(strval($_GET["address"])) : "";
if (!preg_match("/^0x[a-fA-F0-9]{40}$/", $address)) {
  ks_json_out(["error" => "Valid Ethereum address required"], 400);
}

$cols = ks_sanctioned();
$key = ks_alchemy_key();
$items = [];
$held = [];

if ($key !== "") {
  $pageKey = null;
  for ($i = 0; $i < 6; $i++) {
    $url = "https://eth-mainnet.g.alchemy.com/nft/v3/" . rawurlencode($key) . "/getNFTsForOwner?owner=" . rawurlencode($address) . "&withMetadata=true&pageSize=100";
    foreach ($cols as $c) {
      $url .= "&contractAddresses[]=" . rawurlencode($c["address"]);
    }
    if ($pageKey) {
      $url .= "&pageKey=" . rawurlencode($pageKey);
    }
    list($code, $data) = ks_http($url);
    if ($code < 200 || !is_array($data)) {
      break;
    }
    foreach ($data["ownedNfts"] ?? [] as $n) {
      $contract = $n["contract"]["address"] ?? "";
      $tokenId = isset($n["tokenId"]) ? strval($n["tokenId"]) : "";
      $col = null;
      foreach ($cols as $c) {
        if (strtolower($c["address"]) === strtolower($contract)) {
          $col = $c;
          break;
        }
      }
      $image = $n["image"]["cachedUrl"] ?? $n["image"]["thumbnailUrl"] ?? $n["image"]["originalUrl"] ?? null;
      $items[] = [
        "contractAddress" => $contract,
        "tokenId" => $tokenId,
        "name" => $n["name"] ?? ($n["contract"]["name"] ?? null),
        "image" => $image,
        "collectionId" => $col["id"] ?? null,
        "collectionName" => $col["name"] ?? ($n["contract"]["name"] ?? null),
      ];
    }
    $pageKey = $data["pageKey"] ?? null;
    if (!$pageKey) break;
  }
}

$balances = [];
foreach ($cols as $c) {
  $ownerPad = str_pad(strtolower(substr($address, 2)), 64, "0", STR_PAD_LEFT);
  $hex = ks_rpc($c["address"], "0x70a08231" . $ownerPad);
  $n = ks_hex_uint($hex);
  $balances[$c["id"]] = $n;
  if ($n > 0) $held[] = $c["id"];
}

if ($key !== "") {
  $held = [];
  foreach ($cols as $c) {
    foreach ($items as $it) {
      if (strtolower($it["contractAddress"]) === strtolower($c["address"])) {
        $held[] = $c["id"];
        break;
      }
    }
  }
}

ks_json_out([
  "address" => $address,
  "held" => $held,
  "items" => $items,
  "balances" => $balances,
]);
