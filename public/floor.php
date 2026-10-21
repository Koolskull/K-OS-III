<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: public, max-age=20");

$allow = [
    "miyamaker-mini" => true,
    "mialien" => true,
    "kool-skull-s-halloween-special" => true,
    "thrashbannerz" => true,
];
$slug = isset($_GET["slug"]) ? (string) $_GET["slug"] : "";
if (!isset($allow[$slug])) {
    http_response_code(400);
    echo "{\"items\":[]}";
    exit;
}

$query = <<<'GQL'
query Floor($slug: String!) {
  collectionItems(collectionSlug: $slug, limit: 50, filter: { isListed: true }, sort: { by: PRICE, direction: ASC }) {
    items {
      tokenId
      name
      imageUrl
      bestListing {
        id
        maker { address }
        pricePerItem { token { unit symbol } }
      }
    }
  }
}
GQL;

$payload = json_encode([
    "query" => $query,
    "variables" => ["slug" => $slug],
]);

$raw = false;
if (function_exists("curl_init")) {
    $ch = curl_init("https://gql.opensea.io/graphql");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Accept: application/json",
            "Origin: https://opensea.io",
            "User-Agent: Mozilla/5.0",
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
    ]);
    $raw = curl_exec($ch);
    curl_close($ch);
}
if (!is_string($raw) || $raw === "") {
    $ctx = stream_context_create([
        "http" => [
            "method" => "POST",
            "header" => "Content-Type: application/json\r\nAccept: application/json\r\nOrigin: https://opensea.io\r\nUser-Agent: Mozilla/5.0\r\n",
            "content" => $payload,
            "timeout" => 20,
            "ignore_errors" => true,
        ],
    ]);
    $got = @file_get_contents("https://gql.opensea.io/graphql", false, $ctx);
    $raw = is_string($got) ? $got : false;
}
if (!is_string($raw) || $raw === "") {
    http_response_code(502);
    echo "{\"items\":[]}";
    exit;
}

$parsed = json_decode($raw, true);
$rows = $parsed["data"]["collectionItems"]["items"] ?? [];
$items = [];
if (is_array($rows)) {
    foreach ($rows as $row) {
        if (!is_array($row)) {
            continue;
        }
        $ask = $row["bestListing"] ?? null;
        if (!is_array($ask)) {
            continue;
        }
        $token = $ask["pricePerItem"]["token"] ?? null;
        if (!is_array($token) || !isset($token["unit"], $token["symbol"])) {
            continue;
        }
        $id = isset($row["tokenId"]) ? (string) $row["tokenId"] : "";
        if ($id === "" || !ctype_digit($id)) {
            continue;
        }
        $maker = $ask["maker"]["address"] ?? "";
        $items[] = [
            "tokenId" => $id,
            "name" => isset($row["name"]) ? (string) $row["name"] : "",
            "imageUrl" => isset($row["imageUrl"]) ? (string) $row["imageUrl"] : "",
            "maker" => is_string($maker) ? $maker : "",
            "symbol" => strtoupper((string) $token["symbol"]),
            "unit" => $token["unit"],
            "listingId" => isset($ask["id"]) ? (string) $ask["id"] : "",
        ];
    }
}

echo json_encode(["items" => $items], JSON_UNESCAPED_SLASHES);
