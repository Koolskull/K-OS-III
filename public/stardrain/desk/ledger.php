<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");
$path = __DIR__ . "/ledger.json";

if ($_SERVER["REQUEST_METHOD"] === "GET") {
  if (!is_file($path)) {
    echo "{}";
    exit;
  }
  readfile($path);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo "{\"ok\":false}";
  exit;
}

$raw = file_get_contents("php://input");
if ($raw === false || strlen($raw) > 8000) {
  http_response_code(413);
  echo "{\"ok\":false}";
  exit;
}

$item = json_decode($raw, true);
$ok = is_array($item)
  && isset($item["articleId"], $item["address"], $item["message"], $item["signature"], $item["note"])
  && is_string($item["articleId"]) && is_string($item["address"])
  && is_string($item["message"]) && is_string($item["signature"]) && is_string($item["note"])
  && preg_match('/^[a-z0-9-]{1,64}$/', $item["articleId"])
  && preg_match('/^0x[0-9a-fA-F]{40}$/', $item["address"])
  && preg_match('/^0x[0-9a-fA-F]{130}$/', $item["signature"])
  && strlen($item["note"]) <= 4000
  && strlen($item["message"]) <= 2000
  && strpos($item["message"], "Editor: koolskull.eth") !== false
  && strpos($item["message"], "Article: " . $item["articleId"]) !== false;

if (!$ok) {
  http_response_code(400);
  echo "{\"ok\":false}";
  exit;
}

$ledger = [];
if (is_file($path)) {
  $decoded = json_decode((string) file_get_contents($path), true);
  if (is_array($decoded)) $ledger = $decoded;
}

$ledger[$item["articleId"]] = [
  "articleId" => $item["articleId"],
  "address" => $item["address"],
  "message" => $item["message"],
  "signature" => $item["signature"],
  "note" => $item["note"],
  "savedAt" => gmdate("c"),
];

$written = file_put_contents($path, json_encode($ledger, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n", LOCK_EX);
if ($written === false) {
  http_response_code(500);
  echo "{\"ok\":false}";
  exit;
}

echo "{\"ok\":true}";
