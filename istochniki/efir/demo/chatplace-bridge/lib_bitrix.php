<?php
// Заглушка стенда: из настоящего lib_bitrix.php берём только функции окна.
$src = file_get_contents('/app/lib_bitrix.php');
$a = strpos($src, 'function b24_join_dialog_handle');
if ($a !== false) { eval(substr($src, $a)); }
