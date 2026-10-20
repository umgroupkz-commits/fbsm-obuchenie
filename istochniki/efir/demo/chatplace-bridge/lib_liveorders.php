<?php
// Демо-данные для тренажёра курса «Окно подтверждения заказов с эфира».
// Настоящий класс LiveOrders под другим именем; база, 1С и Битрикс — выдуманные.
// Клиенты, номера и суммы ненастоящие. Эфир 14.10.2026, продавец — один.
$src = file_get_contents('/app/lib_liveorders.php');
$src = preg_replace('/^<\?php/', '', $src);
$src = str_replace('declare(strict_types=1);', '', $src);
$src = str_replace('class LiveOrders', 'class LiveOrdersReal', $src);
eval($src);

const DEMO_DATE = '2026-10-14';
const DEMO_SELLER = 'Бектемирова Аида Сырымбетовна';

function dit($n, $c, $q, $p) {
    return ['line_number' => 1, 'name' => $n, 'characteristic' => $c, 'qty' => $q, 'price' => $p,
        'discount' => 0, 'amount' => $q * $p, 'cancelled' => false];
}
function dord($id, $tail, $items, $tm, $st = 'posted', $seller = DEMO_SELLER) {
    $t = array_sum(array_column($items, 'amount'));
    return ['id' => 'demo-' . $id, 'number' => '00RT-0' . $id, 'date' => DEMO_DATE . "T$tm:00+05:00",
        'status' => $st, 'seller_id' => 's', 'seller_name' => $seller, 'comment' => $tail,
        'phone_last4' => null, 'total_amount' => $t, 'changed_at' => 'x', 'items' => $items];
}

class LiveOrders extends LiveOrdersReal
{
    // tail => [номер, имя, чат]
    const C = [
        'a' => ['77010002742', 'Жанна', 'chat101'], 'b' => ['77050002742', 'Гость', 'chat102'],
        '5101' => ['77010005101', 'Айгерим', 'chat103'], '5102' => ['77020005102', 'Марина', 'chat104'],
        '7304' => ['77030007304', 'Динара', 'chat106'], '7405' => ['77040007405', 'Сауле', 'chat107'],
        '7506' => ['77050007506', 'Карина', 'chat108'], '7607' => ['77060007607', 'Асель', 'chat109'],
        '8708' => ['77070008708', 'Лаура', 'chat110'], '8809' => ['77080008809', 'Мадина', 'chat111'],
        '8900' => ['77090008900', 'Гульнара', 'chat112'], '9011' => ['77010009011', 'Алия', 'chat113'],
        '9122' => ['77020009122', 'Камила', 'chat114'], '9233' => ['77030009233', 'Жанар', 'chat115'],
        '9344' => ['77040009344', 'Ботагоз', 'chat116'], '9455' => ['77050009455', 'Елена', 'chat117'],
        'c' => ['77750008809', 'Нурила', 'chat118'],
    ];

    function __construct($c, $l) {}
    function ensureSchema(): void {}
    function configured(): bool { return true; }
    function status(): array { return ['last_sync_at' => DEMO_DATE . 'T09:15:00.000Z']; }
    function ordersFor(string $d): array
    {
        return [
            dord(1101, '2742', [dit('GBL Футболка', 'M, Коричневый', 2, 1590)], '12:54', 'draft'),
            dord(1102, '2742', [dit('Le Trois Кардиган Зип', 'L, Тёмно-синий', 1, 4995)], '18:10', 'draft'),
            dord(1103, '5101', [dit('Жилет PADDING', 'L, Бежевый', 1, 800), dit('Шарф', '', 1, 1500)], '12:58'),
            dord(1104, '5102', [dit('Champion pants', 'XL, Жёлтый', 1, 2400)], '13:02'),
            dord(1105, '6203', [dit('Футболка Pro-Specs', 'S', 3, 1000)], '13:05'),
            dord(1106, '7304', [dit('Худи Covernat', 'M', 1, 4995)], '13:10'),
            dord(1107, '7405', [dit('Кардиган', 'L', 1, 4400), dit('Шапка', '', 1, 1200)], '13:15'),
            dord(1108, '7506', [dit('Штаны тедди', 'L', 1, 4500), dit('Футболка GBL', 'M', 1, 1590)], '13:20'),
            dord(1109, '7607', [dit('Жилет синтепон', 'XL, Розовый', 1, 800)], '13:24'),
            dord(1110, '8708', [dit('Куртка', '48', 1, 9990)], '13:30'),
            dord(1111, '8809', [dit('Пуховик', '50', 1, 12990), dit('Доставка 1', '', 1, 1800)], '13:35'),
            dord(1112, '8900', [dit('Свитер', 'M', 1, 3990)], '13:40'),
            dord(1113, '9011', [dit('Джинсы', '30', 1, 5990), dit('Доставка 2', '', 1, 2000)], '13:44'),
            dord(1114, '9122', [dit('Аксессуары 3400', 'Free size', 1, 3400)], '13:50'),
            dord(1115, '9233', [dit('Кеды', '38', 1, 6990)], '13:55'),
            dord(1116, '9344', [dit('Ветровка', 'M', 1, 7490)], '14:00'),
            dord(1117, '9455', [dit('Футболка GBL', 'S, Синий', 2, 1590), dit('Жилет', 'L', 1, 800)], '14:05'),
            // те же 4 цифры у клиентки другого продавца — для выбора «чья посылка»
            dord(1118, '8809', [dit('Сумка', '', 1, 6500)], '14:10', 'posted', 'Кузьмина Алина'),
        ];
    }
    function order(string $id): ?array
    {
        foreach ($this->ordersFor('') as $o) { if ($o['id'] === $id) return $o; }
        return null;
    }
    function dialogsFor(string $d): array
    {
        $out = [];
        foreach (self::C as $c) { $out[$c[2]] = 0; }
        return $out;
    }
    function resolveContacts($bx, array $d, int $b = 400): array
    {
        $out = [];
        foreach (self::C as $c) { $out[$c[2]] = ['phone' => $c[0], 'name' => $c[1]]; }
        return $out;
    }
    function recentDialogs($bx, string $d): array { return []; }
    function seenAt(string $date, string $dialogId): int { return strtotime(DEMO_DATE . ' 14:30'); }  // писали в день эфира
    function unresolvedCount(array $d): int { return 0; }
    function orderPhones(string $d): array { return []; }
    function adoptWz(?BitrixApp $bx, array $c = [], string $d = ''): int { return 0; }
    function notesFor(array $ids): array { return [37 => ['shipped_pickup' => ['at' => strtotime(DEMO_DATE . ' 19:30'), 'sure' => true]]]; }
    function contactByPhone(string $p): ?array { return null; }
    function openDates(int $days = 30, bool $withShipped = false): array { return [DEMO_DATE]; }
    function staffCheck($bx, $st, array $want, bool $fresh = false): array
    {
        return array_intersect_key(['chat116' => ['uid' => 52, 'name' => 'Динара (магазин)', 'at' => strtotime(DEMO_DATE . ' 15:20')]], $want);
    }
    /** Отправки: что клиенту уже ушло и что он ответил. */
    function sendsFor(string $d): array
    {
        $o = $this->ordersFor($d);
        $by = [];
        foreach ($o as $x) { if ($x['seller_name'] === DEMO_SELLER) { $by[$x['comment']][] = $x; } }
        $mk = function (int $id, string $tail, array $extra) use ($by) {
            $c = self::C[$tail];
            $ords = $by[$tail];
            return $extra + ['id' => $id, 'tail' => $tail, 'seller' => DEMO_SELLER, 'status' => 'sent',
                'order_ids' => implode(',', array_column($ords, 'id')), 'order_nums' => implode(', ', array_column($ords, 'number')),
                'phone' => $c[0], 'dialog_id' => $c[2], 'fingerprint' => self::fingerprint($ords),
                'text' => 'Вы заказали…', 'sent_at' => strtotime(DEMO_DATE . ' 16:00'), 'sent_by' => 'Аида',
                'error' => null, 'answer' => null, 'answered_at' => null, 'stage' => null, 'pay_bank' => null,
                'delivery' => null, 'followup' => null, 'receipt_at' => null, 'stage_by' => null, 'stage_at' => null];
        };
        $k = static fn($t) => self::cardKey($t, DEMO_SELLER);
        $at = strtotime(DEMO_DATE . ' 16:40');
        return [
            $k('7304') => $mk(31, '7304', []),
            $k('7405') => $mk(32, '7405', ['status' => 'confirm', 'answer' => 'Подтверждаю, каспи', 'answered_at' => $at,
                'pay_bank' => 'Kaspi', 'followup' => "87040007405 Каспи\nАлматы, Абая 10, кв 5", 'delivery' => 'доставка']),
            $k('7506') => $mk(33, '7506', ['status' => 'confirm', 'answer' => 'Подтверждаю', 'answered_at' => $at,
                'pay_bank' => 'Kaspi', 'stage' => 'wait_pay', 'stage_by' => 'Аида', 'stage_at' => $at + 600,
                'receipt_at' => $at + 1800, 'delivery' => 'самовывоз']),
            $k('7607') => $mk(34, '7607', ['status' => 'confirm', 'answer' => 'да', 'answered_at' => $at, 'pay_bank' => 'Halyk',
                'stage' => 'paid', 'stage_by' => 'Аида', 'stage_at' => $at + 900, 'delivery' => 'самовывоз']),
            $k('8708') => $mk(35, '8708', ['status' => 'confirm', 'answer' => 'Подтверждаю', 'answered_at' => $at, 'pay_bank' => 'Kaspi',
                'stage' => 'ship', 'stage_by' => 'Аида', 'stage_at' => $at + 1200, 'delivery' => 'самовывоз']),
            $k('8809') => $mk(36, '8809', ['status' => 'confirm', 'answer' => 'Подтверждаю', 'answered_at' => $at, 'pay_bank' => 'Kaspi',
                'stage' => 'ship', 'stage_by' => 'Аида', 'stage_at' => $at + 1200, 'delivery' => 'доставка']),
            $k('8900') => $mk(37, '8900', ['status' => 'confirm', 'answer' => 'Подтверждаю', 'answered_at' => $at, 'pay_bank' => 'Kaspi',
                'stage' => 'sent_out', 'stage_by' => 'Аида', 'stage_at' => $at + 3600, 'delivery' => 'самовывоз']),
            $k('9011') => $mk(38, '9011', ['status' => 'confirm', 'answer' => 'Подтверждаю', 'answered_at' => $at, 'pay_bank' => 'Halyk',
                'stage' => 'sent_out', 'stage_by' => 'Аида', 'stage_at' => $at + 3600, 'delivery' => 'доставка']),
            $k('9122') => $mk(39, '9122', ['status' => 'confirm', 'answer' => 'Подтверждаю, в отложку', 'answered_at' => $at,
                'pay_bank' => 'Kaspi', 'stage' => 'paid', 'stage_by' => 'Аида', 'stage_at' => $at + 900]),
            $k('9233') => $mk(40, '9233', ['status' => 'notmine', 'answer' => 'Это не мой заказ', 'answered_at' => $at]),
            $k('9455') => $mk(41, '9455', ['status' => 'correct', 'answer' => 'Футболку синюю отмена', 'answered_at' => $at]),
            self::cardKey('8809', 'Кузьмина Алина') => ['seller' => 'Кузьмина Алина', 'phone' => '77750008809', 'dialog_id' => 'chat118',
                'order_ids' => 'demo-1118', 'order_nums' => '00RT-01118',
                'fingerprint' => self::fingerprint([$this->order('demo-1118')])] + $mk(42, '8809', ['status' => 'confirm',
                'answer' => 'Подтверждаю', 'answered_at' => $at, 'pay_bank' => 'Kaspi', 'stage' => 'ship', 'delivery' => 'доставка'])
                ,
        ];
    }
    function holdsActive(): array
    {
        return ['77020009122' => ['phone' => '77020009122', 'since' => strtotime('2026-10-09'), 'set_by' => 'Аида',
            'dialog_id' => 'chat114', 'name' => 'Камила', 'closed_at' => null]];
    }
    function holdList(): array
    {
        return ['77020009122' => $this->holdsActive()['77020009122'] + ['buys' => 2, 'sum' => 8395.0, 'last_buy' => DEMO_DATE,
            'idle_days' => 1, 'orders' => [
                ['efir_date' => '2026-10-09', 'order_num' => '00RT-0990', 'total' => 4995,
                    'items' => json_encode([['Covernat vest', 'M', 1, 4995]], JSON_UNESCAPED_UNICODE)],
                ['efir_date' => DEMO_DATE, 'order_num' => '00RT-01114', 'total' => 3400,
                    'items' => json_encode([['Аксессуары 3400', 'Free size', 1, 3400]], JSON_UNESCAPED_UNICODE)]]]];
    }
    function holdOrderIds(): array { return ['demo-1114' => '77020009122']; }
    /** «Трек-коды»: выгрузка уже загружена. */
    function parcels(int $days = 14): array
    {
        $p = static fn($tr, $n, $tail, $ph, $a) => ['track' => $tr, 'name' => $n, 'tail' => $tail, 'phone' => $ph, 'addr' => $a,
            'loaded_at' => strtotime(DEMO_DATE . ' 18:00'), 'sent_at' => null, 'sent_by' => null, 'sent_to' => null, 'error' => null];
        return [
            'AP000008809KZ' => $p('AP000008809KZ', 'Мадина Ахметова', '8809', '77080008809', 'Казахстан, г. Шымкент, ул. Тауке хана, 5'),
            'AP000008800KZ' => $p('AP000008800KZ', 'Нурила Оспанова', '8809', '', 'Казахстан, г. Караганда, ул. Ерубаева, 8'),
            'AP000006666KZ' => $p('AP000006666KZ', 'Ольга Ким', '6666', '77770006666', 'Казахстан, г. Павлодар, ул. Ленина, 1'),
        ];
    }
}
