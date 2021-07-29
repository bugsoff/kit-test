<?php

$cfg['db'] = ["server"=>"localhost", "user"=>"kit", "pass"=>"123", "dbname"=>"kit"];

require ("db.php");
require ("auth.php");

switch($_GET['act']??false){
    case 'get':
        $data = $db->get_all();
        header('Content-Type: application/json');
        echo json_encode($data, JSON_NUMERIC_CHECK);        
        break;

    case 'new':
    case 'upd':
        if (!($cfg['admin']??false)) header("HTTP/1.1 403 Forbidden", true, 403) & exit;                        
        $json_data=file_get_contents("php://input");
        $data=json_decode($json_data,true);        
        if (!$data) break;        
        $data['id'] = (int)$data['id']??0;
        $data['name'] = $db->clear($data['name']);
        $data['desc'] = $db->clear($data['desc']);
        $data['pid'] = (int)$data['pid']??0;
        header('Content-Type: application/json');
        ($_GET['act']!='upd')
            ?print json_encode($db->create($data), JSON_NUMERIC_CHECK)
            :print json_encode($db->update($data), JSON_NUMERIC_CHECK);                    
        break;

    case 'del':
        if (!($cfg['admin']??false)) header("HTTP/1.1 403 Forbidden", true, 403) & exit;
        $json_data=file_get_contents("php://input");
        $data=json_decode($json_data,true);                
        print $db->delete($data);
        break;
        
    default: require ("gui.php");
}
