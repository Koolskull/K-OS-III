<?php
/** Shared helpers for optional LiteSpeed shims. Browser usually talks to Scatter/RPC directly. */

function ks_json_out($data, $code = 200) {
  http_response_code($code);
  header("Content-Type: application/json; charset=utf-8");
  header("Cache-Control: no-store");
  echo json_encode($data);
  exit;
}

function ks_http($url, $method = "GET", $body = null) {
  $ch = curl_init($url);
  $headers = ["Accept: application/json", "User-Agent: koolskull-os/1.0"];
  if ($method === "POST") {
    $headers[] = "Content-Type: application/json";
  }
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_FOLLOWLOCATION => true,
  ];
  if ($method === "POST") {
    $opts[CURLOPT_POST] = true;
    $opts[CURLOPT_POSTFIELDS] = is_string($body) ? $body : json_encode($body);
  }
  curl_setopt_array($ch, $opts);
  $out = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  if ($out === false) {
    return [0, null, $err];
  }
  $json = json_decode($out, true);
  return [$code, $json, null];
}

function ks_scatter_slugs() {
  return ["mialien-eth", "kool-skull-s-halloween-special", "bannerz-by-koolskull"];
}

function ks_zero_addr() {
  return "0x0000000000000000000000000000000000000000";
}

function ks_public_root() {
  return "0x" . str_repeat("0", 64);
}

function ks_map_list($L) {
  $root = isset($L["root"]) ? strval($L["root"]) : "";
  $currencyAddress = isset($L["currency_address"]) ? strval($L["currency_address"]) : "";
  return [
    "id" => $L["id"] ?? "",
    "name" => $L["name"] ?? "",
    "tokenPrice" => isset($L["token_price"]) ? strval($L["token_price"]) : "",
    "currency" => $L["currency_symbol"] ?? "ETH",
    "currencyAddress" => $currencyAddress,
    "root" => $root,
    "startTime" => $L["start_time"] ?? null,
    "endTime" => $L["end_time"] ?? null,
    "listLimit" => isset($L["list_limit"]) ? intval($L["list_limit"]) : 0,
    "isPublic" => strtolower($root) === ks_public_root(),
    "native" => $currencyAddress === "" || strtolower($currencyAddress) === ks_zero_addr(),
  ];
}

function ks_map_collection($slug, $col, $lists) {
  $minted = intval($col["num_items"] ?? 0);
  $max = intval($col["max_items"] ?? 0);
  $mappedLists = [];
  if (is_array($lists)) {
    foreach ($lists as $L) {
      $mappedLists[] = ks_map_list($L);
    }
  }
  return [
    "slug" => $slug,
    "name" => $col["name"] ?? $slug,
    "symbol" => $col["symbol"] ?? null,
    "address" => $col["address"] ?? "",
    "chainId" => intval($col["chain_id"] ?? 1),
    "avatar" => $col["avatar_uri"] ?? null,
    "banner" => $col["banner_uri"] ?? null,
    "description" => $col["description"] ?? "",
    "minted" => $minted,
    "max" => $max,
    "remaining" => max(0, $max - $minted),
    "soldOut" => $max > 0 && $minted >= $max,
    "owners" => $col["num_owners"] ?? null,
    "lists" => $mappedLists,
  ];
}

function ks_mini() {
  return [
    "address" => "0x375a1911C0C2982f59826C227B7830e5d5985d59",
    "chainId" => 1,
    "mintPriceEth" => "0.4444",
    "mintPriceWei" => "444400000000000000",
    "maxSupply" => 1024,
  ];
}

function ks_sanctioned() {
  return [
    ["id" => "miyamaker-mini", "name" => "Miyamaker Mini", "address" => "0x375a1911C0C2982f59826C227B7830e5d5985d59"],
    ["id" => "mialien-eth", "name" => "Mialien Maker ETH", "address" => "0xC5759Dd58057808568C698fFDc4Ad5548D17e75a"],
    ["id" => "kool-skull-s-halloween-special", "name" => "KOOL SKULL'S HALLOWEEN SPECIAL", "address" => "0x840C326D4E18Cc5969FE20335DcA0401078340fC"],
    ["id" => "bannerz-by-koolskull", "name" => "THRASH BANNERZ BY KOOLSKULL", "address" => "0x19f053F02c676248fAEf8dabd88F119f942dc1aB"],
    ["id" => "milady", "name" => "Milady Maker", "address" => "0x5Af0D9827E0c53e4799bb226655a1de152a425a5"],
    ["id" => "remilio", "name" => "Redacted Remilio Babies", "address" => "0xd3d9ddd0cf0a5f0bfb8f7fceae075df687eaebab"],
    ["id" => "radbro", "name" => "Radbro Webring V2", "address" => "0xABCDB5710B88f456fED1e99025379e2969F29610"],
    ["id" => "bonkler", "name" => "Bonkler", "address" => "0xABFaE8A54e6817F57F9De7796044E9a60e61ad67"],
  ];
}

function ks_rpc($to, $data) {
  list($code, $json, $err) = ks_http("https://ethereum.publicnode.com", "POST", [
    "jsonrpc" => "2.0",
    "id" => 1,
    "method" => "eth_call",
    "params" => [["to" => $to, "data" => $data], "latest"],
  ]);
  if ($err || $code < 200) {
    return null;
  }
  return $json["result"] ?? null;
}

function ks_hex_uint($hex) {
  $h = preg_replace("/^0x/i", "", strval($hex ?? ""));
  $h = ltrim($h, "0");
  if ($h === "") {
    return 0;
  }
  return intval($h, 16);
}

function ks_alchemy_key() {
  $env = getenv("ALCHEMY_API_KEY");
  if (is_string($env) && trim($env) !== "") {
    return trim($env);
  }
  // Outside the web root only: ~/kos-secrets.php next to public_html, never in public_html.
  $home = dirname(__DIR__, 1); // public_html
  $outside = dirname($home) . "/kos-secrets.php";
  if (!is_file($outside) || !is_readable($outside)) {
    return "";
  }
  $ALCHEMY_API_KEY = "";
  include $outside;
  return is_string($ALCHEMY_API_KEY) ? trim($ALCHEMY_API_KEY) : "";
}
