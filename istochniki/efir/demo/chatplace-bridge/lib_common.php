<?php
if (!class_exists('Db')) { final class Db { static function release(): void {} } }
class Logger { function __construct($c) {} function info(...$a) {} function warn(...$a) {} }
class State { function __construct($c) {} function getMeta($k) { return $k === 'ol_bot_id' ? '7067' : null; } }
class BitrixApp { function __construct($c, $s, $l) {} }
