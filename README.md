# Diário de Operações — mini índice

Site de diário de operações (day trade mini índice/mini dólar) com backend em Node/Express +
Sequelize + PostgreSQL e frontend em React + Vite, seguindo os mesmos padrões e stack do
Projeto-Delivery.

## Estrutura

- `BackEnd/` — API REST (Express 5, Sequelize, PostgreSQL, autenticação JWT)
- `frontend/` — SPA em React 19 + Vite + Tailwind + Recharts

## Configuração

1. Crie o banco de dados PostgreSQL:
   ```
   createdb -U postgres diario_operacoes
   ```
2. Backend:
   ```
   cd BackEnd
   copy .env.example .env
   # edite BackEnd/.env com usuário/senha do seu Postgres e um JWT_SECRET forte
   npm install
   npm run db:migrate
   ```
3. Frontend:
   ```
   cd frontend
   copy .env.example .env
   npm install
   ```

## Rodando em desenvolvimento

Na raiz do projeto:
```
npm install
npm run dev
```
Isso sobe o backend em `http://localhost:3001` e o frontend em `http://localhost:5173`.

Crie uma conta em `/register`, faça login e comece a lançar operações. O botão **Exemplo**
carrega um conjunto de operações de demonstração; **Limpar** remove todas as suas operações.
