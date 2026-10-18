<?php
require __DIR__ . "/_lib.php";

$mini = ks_mini();
$supply = ks_rpc($mini["address"], "0x18160ddd");
$maxHex = ks_rpc($mini["address"], "0xd5abeb01");
if ($supply === null) {
  ks_json_out(["error" => "Status lookup failed"], 502);
}
$minted = ks_hex_uint($supply);
$max = ks_hex_uint($maxHex);
if ($max <= 0) $max = $mini["maxSupply"];
ks_json_out([
  "address" => $mini["address"],
  "chainId" => $mini["chainId"],
  "minted" => $minted,
  "max" => $max,
  "remaining" => max(0, $max - $minted),
  "soldOut" => $max > 0 && $minted >= $max,
  "mintPriceEth" => $mini["mintPriceEth"],
  "mintPriceWei" => $mini["mintPriceWei"],
]);
