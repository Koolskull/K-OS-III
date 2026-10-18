<?php
require __DIR__ . "/_lib.php";

$slug = isset($_GET["slug"]) ? strval($_GET["slug"]) : "";
if (!in_array($slug, ks_scatter_slugs(), true)) {
  ks_json_out(["error" => "Unknown collection"], 404);
}

list($colCode, $col, $colErr) = ks_http("https://api.scatter.art/v1/collection/" . rawurlencode($slug));
if ($colErr || $colCode < 200 || !is_array($col)) {
  ks_json_out(["error" => "Scatter collection fetch failed"], 502);
}

list($listCode, $lists) = ks_http(
  "https://api.scatter.art/v1/collection/" . rawurlencode($slug) . "/eligible-invite-lists"
);
if ($listCode < 200 || !is_array($lists)) {
  $lists = [];
}

ks_json_out(ks_map_collection($slug, $col, $lists));
