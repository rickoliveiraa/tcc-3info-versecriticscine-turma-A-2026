/**
 * 1. fazer download da biblioteca: npm install express
 *      cria um servidor de páginas web/ -> nos criaremos uma api
 * 2. importar as funções da biblioteca no meu projeto
 *      linha 8 (import expres .....)
 * 3. instanciar as bibliotecas/funções (jogar para memória e executar) 
 * 
 * 4. colocar o servidor web para escutar na porta específica
 */

import express from 'express';

//Instanciando o servidor express() //criando o servidor api no sistema
const server = express();

const users = [
    { id: 1, name: 'João da Silva', gender: 'M', email: 'joao.silva@email.com' },
    { id: 2, name: 'Maria Mariana', gender: 'F', email: 'maria.ariana@email.com' },
    { id: 3, name: 'Claudia Goes', gender: 'F', email: 'claudia.oes@email.com' },
    { id: 4, name: 'Cristiano Ronaldo', gender: 'M', email: 'cristiano.ronaldo@email.com' },
    { id: 5, name: 'Eddaughter Oliveira', gender: 'F', email: 'eddaughter.oliveira@email.com' },
];

/**
 * 1o. Parâmetro - Rota (endpoint)
 * 2o. Parâmetro - Callback (função a ser executada quando a rota for acessada)
 */
server.get("/", (req, res) => {
    /**
     * req - Objeto de requisição (request)
     * res - Objeto de resposta (response)
     */
    res.send("Rota Raiz " + Date());
});

//Rota para acessar um usuário específico por ID
server.get("/users/:id", (req, res) => {
    //Obtendo o id da rota
    const id = parseInt(req.params.id); 
    //Buscando o usuário com o id correspondente
    const user = users.find(u => u.id === id);

    return res.status(200).json({
        error: false,
        message: 'User found',
        result: user
    });
});

server.get('/users',(req, res)=>{
    return res.status(200).json({
        error: false,
        message: 'Users list',
        result: users
    });
});

//Iniciando o servidor na porta 3000
/**
 * listen() - Método para iniciar o servidor
 * Parâmetros:
 * 1o. Parâmetro - Porta (número da porta onde o servidor irá escutar as requisições)
 * 2o. Parâmetro - Callback (função a ser executada quando o servidor for iniciado)
 */
server.listen(3000, () => {
    console.log("Server on");
});