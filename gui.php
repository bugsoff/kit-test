<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">    
    <title>Тестовое задание<?=($cfg['admin']??false)?" | Режим администратора":""?></title>
    <meta name="description" content="Тестовое задание КиТ">
    <link rel="stylesheet" href="styles.css">
</head>

<body>
    <header>
        <form method="POST" action="">
            <?php if ($cfg['admin']??false){ ?>
            <button type="submit" id="exit" name="exit" value="1" title="Выход">&#10062;</button>
            <?php } else { ?>
            <label>Логин: <input type="text" id="login" name="login" /></label>
            <label>Пароль: <input type="password" id="pass" name="pass" /></label>
            <button type="submit" id="enter" title="Вход">&#9989;</button>
            <?php } ?>
        </form>
    </header>

    <div class="container" id="container">        
        <div class="data" id="i0"><h1>Структура данных</h1>
        </div>
    </div>
    <script>var admin=<?=($cfg['admin']??false)?'true':'false'?>;</script>
    <script type="text/javascript" src="scripts.js?<?=rand(0,9999)?>"></script>    
    <div style="display: none;">
    </div>
<footer></footer>            

</body>

<html>