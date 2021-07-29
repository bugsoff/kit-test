<?php

session_start();

if (($_POST['login']??false) AND ($_POST['pass']??false)) {           
    if ( password_verify (  $_POST['pass'], 
                            ($db->get_user($_POST['login']))[0]['pass'] ))
        $_SESSION['admin']=true;    
}

if ($_POST['exit']??false) unset($_SESSION['admin']);

if ($_SESSION['admin']??false) $cfg['admin']=true;





/****  регистрация  пользователей               ****/
/****  /?act=register&login=admin&pass=123      ****/
if (($_GET['act']??false)=='register'){
    $result =$db->register_user(['login'=>$_GET['login']??'', 'pass'=>password_hash($_GET['pass']??false, PASSWORD_DEFAULT)]);
    var_export($result) &  exit;
}
