<?php
try {
    // Conecta única e exclusivamente no arquivo do SQLite3 (.db)
    $pdo = new PDO("sqlite:" . __DIR__ . "/banco.db");
    
    // Ativa os erros para te avisar se algo quebrar nas consultas
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Ativa o suporte a chaves estrangeiras
    $pdo->exec("PRAGMA foreign_keys = ON;");
    
} catch (PDOException $e) {
    die("Erro ao conectar com o banco SQLite: " . $e->getMessage());
}
?>