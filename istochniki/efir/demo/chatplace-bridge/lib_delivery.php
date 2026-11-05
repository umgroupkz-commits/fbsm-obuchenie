<?php
// Демо-адреса для тренажёра курса «Окно подтверждения заказов с эфира».
// Настоящий класс LiveDelivery под другим именем, база выдуманная: по одной карточке на каждую метку окна.
// Люди, адреса и номера ненастоящие.
$src = file_get_contents('/app/lib_delivery.php');
$src = preg_replace('/^<\?php/', '', $src);
$src = str_replace('declare(strict_types=1);', '', $src);
$src = str_replace('class LiveDelivery', 'class LiveDeliveryReal', $src);
eval($src);

class LiveDelivery extends LiveDeliveryReal
{
    function __construct(array $cfg) {}

    function forSends(array $sendIds): array
    {
        $adr = static fn(string $src, string $fio, string $ph, string $ind, string $city, string $str, string $dom, array $ext = []) => $ext + [
            'method' => 'post', 'state' => 'ok', 'source' => $src, 'office_name' => '', 'office_index' => $ind, 'rayon' => $city,
            'naspunkt' => '-', 'street' => $str, 'house' => $dom, 'fio' => $fio, 'rec_phone' => $ph, 'bank' => 'Kaspi'];
        $all = [
            // входят в файл для post-blank
            36 => $adr('база', 'Мадина Ахметова', '77080008809', '160000', 'г. Шымкент', 'ул. Демонстрационная', '1'),
            42 => $adr('переписка', 'Нурила Оспанова', '77750008809', '100000', 'г. Караганда', 'ул. Примерная', '2'),
            38 => $adr('база', 'Алия Сарсенова', '77010009011', '050000', 'г. Алматы', 'ул. Тестовая', '3'),
            43 => $adr('база', 'Роза Ибраева', '77010009566', '010000', 'г. Астана', 'ул. Учебная', '4', ['state' => 'ask_base']),
            39 => $adr('база', 'Камила Нурова', '77020009122', '140000', 'г. Павлодар', 'ул. Образцовая', '5', ['state' => 'ask_base', 'quiet' => true]),
            // не входят
            44 => ['method' => '', 'state' => 'ask_new', 'source' => '', 'office_index' => ''],
            34 => ['method' => '', 'state' => 'ask_new', 'source' => '', 'office_index' => '', 'quiet' => true],
            32 => $adr('переписка', 'Сауле Ким', '77040007405', '', 'г. Алматы', 'ул. Абая', '10', ['state' => 'missing', 'missing' => 'индекс']),
        ];
        return array_intersect_key($all, array_flip($sendIds));
    }
}
