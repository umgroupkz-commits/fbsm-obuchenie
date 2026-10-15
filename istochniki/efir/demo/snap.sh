cp /app/live.php /d/site/orders/live.php
php -S 127.0.0.1:8080 -t /d/site >/tmp/srv.log 2>&1 &
sleep 1
mkdir -p /d/raw
php -r '
$urls = json_decode(file_get_contents("/d/urls.json"), true);
foreach ($urls as $name => $q) {
  $h = file_get_contents("http://127.0.0.1:8080/orders/live.php" . $q);
  file_put_contents("/d/raw/$name.html", $h);
  $w = preg_match_all("/(Warning|Fatal error|Notice|Deprecated)[^\n]{0,200}/", strip_tags($h), $m);
  echo $name, " ", strlen($h), ($w ? " ОШИБКИ: " . implode(" | ", array_unique($m[0])) : ""), "\n";
}'
grep -i "warning\|fatal" /tmp/srv.log | head -3
