<?php
/**
 * First-party BFF: koolskull.com /api/* (except local mint shims) → 2kool.tv.
 * Browser cookies stay on koolskull.com. Upstream Auth.js cookies live in this PHP session.
 * Same Postgres users: wallet/email on 2kool.tv is the same account here.
 */
session_name("KOSAUTH");
session_set_cookie_params([
  "lifetime" => 60 * 60 * 24 * 14,
  "path" => "/",
  "secure" => true,
  "httponly" => true,
  "samesite" => "Lax",
]);
session_start();

$UPSTREAM = "https://2kool.tv";
$ALLOW = [
  "auth/",
  "ethereum/",
  "profile",
  "account/",
  "nfts",
  "apps/activity",
  "users/",
];

$uri = $_SERVER["REQUEST_URI"] ?? "/";
$path = parse_url($uri, PHP_URL_PATH);
if (!is_string($path) || strpos($path, "/api/") !== 0) {
  http_response_code(400);
  header("Content-Type: application/json");
  echo json_encode(["error" => "Bad path"]);
  exit;
}
$rel = substr($path, 5); // after /api/
$ok = false;
foreach ($ALLOW as $prefix) {
  if ($rel === rtrim($prefix, "/") || strpos($rel, $prefix) === 0) {
    $ok = true;
    break;
  }
}
if (!$ok) {
  http_response_code(404);
  header("Content-Type: application/json");
  echo json_encode(["error" => "Not proxied"]);
  exit;
}

$qs = parse_url($uri, PHP_URL_QUERY);
$target = $UPSTREAM . $path . ($qs ? "?" . $qs : "");

if (!isset($_SESSION["jar"]) || !is_array($_SESSION["jar"])) {
  $_SESSION["jar"] = [];
}

$headers = ["Accept: application/json", "User-Agent: koolskull-os-bff/1.0"];
$ct = $_SERVER["CONTENT_TYPE"] ?? $_SERVER["HTTP_CONTENT_TYPE"] ?? "";
if ($ct) {
  $headers[] = "Content-Type: " . $ct;
}

$cookieParts = [];
foreach ($_SESSION["jar"] as $name => $val) {
  $cookieParts[] = $name . "=" . $val;
}
if ($cookieParts) {
  $headers[] = "Cookie: " . implode("; ", $cookieParts);
}

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
$body = null;
if ($method !== "GET" && $method !== "HEAD") {
  $body = file_get_contents("php://input");
}

$ch = curl_init($target);
$opts = [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HEADER => true,
  CURLOPT_CUSTOMREQUEST => $method,
  CURLOPT_HTTPHEADER => $headers,
  CURLOPT_TIMEOUT => 25,
  CURLOPT_FOLLOWLOCATION => false,
];
if ($body !== null && $body !== false && $body !== "") {
  $opts[CURLOPT_POSTFIELDS] = $body;
}
curl_setopt_array($ch, $opts);
$raw = curl_exec($ch);
$errno = curl_errno($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errno || $raw === false) {
  http_response_code(502);
  header("Content-Type: application/json");
  echo json_encode(["error" => "Account server unreachable"]);
  exit;
}

$headerBlob = substr($raw, 0, $code);
$respBody = substr($raw, $code);

foreach (preg_split("/\r\n/", $headerBlob) as $line) {
  if (stripos($line, "Set-Cookie:") === 0) {
    $cookie = trim(substr($line, 11));
    $nv = explode(";", $cookie, 2)[0];
    $eq = strpos($nv, "=");
    if ($eq === false) continue;
    $name = trim(substr($nv, 0, $eq));
    $val = trim(substr($nv, $eq + 1));
    $low = strtolower($cookie);
    if (strpos($low, "max-age=0") !== false || preg_match("/expires=.*1970/i", $cookie)) {
      unset($_SESSION["jar"][$name]);
    } else {
      $_SESSION["jar"][$name] = $val;
    }
  }
}

http_response_code($http > 0 ? $http : 502);
$respCt = "application/json";
foreach (preg_split("/\r\n/", $headerBlob) as $line) {
  if (stripos($line, "Content-Type:") === 0) {
    $respCt = trim(substr($line, 13));
    break;
  }
}
header("Content-Type: " . $respCt);
header("Cache-Control: no-store");
echo $respBody;
