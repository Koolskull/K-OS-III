<?php
/**
 * One-shot extractor. Upload this next to the zip files in public_html,
 * open it in a browser once, then DELETE this file and the zips.
 * Does not delete /mp3 /art /store /biz /miyamakermini /gallery.
 */
header("Content-Type: text/plain; charset=utf-8");
header("X-Robots-Tag: noindex");

if (!class_exists("ZipArchive")) {
  http_response_code(500);
  echo "ZipArchive is not enabled on this host. Use cPanel File Manager → Extract instead.\n";
  exit;
}

$allowed = ["koolskull-os.zip", "koolskull-instruments.zip"];
$root = realpath(__DIR__);
if ($root === false) {
  http_response_code(500);
  echo "Bad extract directory.\n";
  exit;
}

echo "Extracting into {$root}\n\n";
$did = 0;
foreach ($allowed as $name) {
  $path = $root . DIRECTORY_SEPARATOR . $name;
  if (!is_file($path)) {
    echo "skip {$name} (not uploaded)\n";
    continue;
  }
  $zip = new ZipArchive();
  $ok = $zip->open($path);
  if ($ok !== true) {
    echo "FAIL {$name} (could not open, code {$ok})\n";
    continue;
  }
  echo "extracting {$name} ({$zip->numFiles} files)…\n";
  if (!$zip->extractTo($root)) {
    echo "FAIL {$name} (extractTo failed)\n";
    $zip->close();
    continue;
  }
  $zip->close();
  echo "ok {$name}\n";
  $did++;
}

echo "\nDone. Extracted {$did} zip(s).\n";
echo "Now delete unzip-koolskull.php and the zip files from public_html.\n";
echo "Check https://koolskull.com/ and https://koolskull.com/miyamakermini/\n";
