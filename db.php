<?php
class Database
{ 
    private $db;

    private function exec_query($sql) {
    	$result =$this->db->query($sql);
       	if ($result===false) return false;
    	switch ((explode(" ", $sql,2))[0]):												// выберем первое слово до пробела, это команда
    		case 'SELECT':
    			switch ($this->db->affected_rows):
    				case -1:	return false;						                    // ошибка при выполнении запроса
		    		case 0: 	return [];						                        // не выбрано данных (0 строк)
    				default: return $result->fetch_all(MYSQLI_ASSOC);				    // больше 1 строка - двумерный массив
    			endswitch;
    			break;
    		case 'UPDATE':
    		case 'INSERT':
    		case 'DELETE':
    		default: 
    			switch ($this->db->affected_rows):
    				case -1:	return false;				                            // ошибка при выполнении запроса
    				case 0:		return null;											// затронуто 0 строк
    				default:	return ($this->db->insert_id)?:true;					// id вставленной сроки или true, если update/delete
    			endswitch;
		endswitch;
		return false;
    }
    
    public function __construct($arg){
        $this->db = new mysqli($arg['server'], $arg['user'], $arg['pass'], $arg['dbname']);
    }

    public function register_user($data)    
    {
        $sql = "INSERT INTO `users` SET `login`='{$data['login']}', `pass`='{$data['pass']}'";
        return $this->exec_query($sql);        
    }

    public function get_user($login){
        $sql = "SELECT `pass` FROM `users` WHERE `login`='$login'";
        return $this->exec_query($sql);                     
    }

   
    public function get_all(){
        $sql = "SELECT `id`, `name`, `info` as `desc`, `pid` FROM `items`";        
        $result = $this->exec_query($sql);   
        $data =[];
        foreach ($result as $item) $data[$item['id']] = $item;                
        //file_put_contents("db.log", json_encode($data).PHP_EOL);
        return $data;
    }


    public function create($data){
        $sql = "INSERT INTO `items` SET `name`='{$data['name']}'".
        ($data['desc']?", `info`='{$data['desc']}'":"").
        ($data['pid']?", `pid`='{$data['pid']}'":", `pid`=0");        
        return $this->exec_query($sql);
    }


    public function update($data){
        $sql = "UPDATE `items` SET `name`='{$data['name']}'".
        (($data['desc']!==false)?", `info`='{$data['desc']}'":"").
        ($data['pid']?", `pid`={$data['pid']}":", `pid`=0").
        " WHERE `id`={$data['id']}";                                
        return $this->exec_query($sql);
    }


    public function delete($data){        
        $sql = "DELETE FROM `items` WHERE `id` IN (".implode(',',$data['del']).")";  // удаляем узлы        
        return $this->exec_query($sql);        
    }


    public function clear($string){
        return  $string!==false
                ?$this->db->escape_string(htmlspecialchars(trim($string), ENT_COMPAT|ENT_QUOTES|ENT_HTML5, 'UTF-8'))
                :false;
    }
};

$db = new Database($cfg['db']);