# golden_raspberry_awards_api

API RESTful que expõe o intervalo mínimo e máximo entre vitórias consecutivas de produtores no **Golden Raspberry Awards** (Frammies), a partir de uma lista de indicados/vencedores carregada de arquivo(s) CSV.

## Stack utilizada e motivações

- **Node.js + TypeScript** — tipagem estática em todo o código para reduzir bugs em tempo de execução e facilitar manutenção.
- **[Fastify](https://fastify.dev/)** como servidor HTTP — performático e com um sistema de schema/serialização nativo, o que se encaixa bem com validação via Zod.
- **[Zod](https://zod.dev/)** (via `fastify-type-provider-zod`) para validação de schema em runtime com inferência de tipos — evita duplicar a definição de tipos TypeScript e as regras de validação.
- **Drizzle ORM + `better-sqlite3` (banco em memória)** — ORM leve e type-safe; usar SQLite em memória elimina a necessidade de subir uma instância de banco externa, se adequando ao desafio técnico. O banco é recriado do zero a partir do CSV a cada start da aplicação.
- **csv-parse** — parsing do(s) arquivo(s) de ingestão de dados.
- **pino / pino-pretty** — logging estruturado (formatado em desenvolvimento, JSON em produção).
- **[Vitest](https://vitest.dev/)** — test runner rápido, com boa integração TypeScript/ESM, usado nos testes de integração das rotas.

## Como configurar e iniciar a API

Pré-requisito: Node.js 22+.

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `3000` | Porta em que a API sobe |
| `HOST` | `0.0.0.0` | Host em que a API escuta |
| `LOG_LEVEL` | `info` | `fatal`\|`error`\|`warn`\|`info`\|`debug`\|`trace`\|`silent` |

### 3. Preparar os dados de ingestão (obrigatório antes de subir a API)

A API popula o banco em memória lendo arquivo(s) CSV de uma pasta fixa na raiz do projeto: `data/ingestion/`. Essa pasta é ignorada pelo git (`data/*` está no `.gitignore`), então **não vem populada em um clone novo** — é preciso criá-la e colocar os arquivos manualmente:

```bash
mkdir -p data/ingestion
# copie seu(s) arquivo(s) .csv para dentro de data/ingestion/
```

**Contrato de dados esperado:**

- Extensão do arquivo: **`.csv`** (qualquer arquivo com essa extensão dentro da pasta é lido; é possível ter mais de um arquivo).
- Delimitador: `;` (ponto e vírgula).
- Cabeçalho obrigatório, nesta ordem exata:

  ```
  year;title;studios;producers;winner
  ```

- Colunas:
  | Coluna | Tipo esperado | Observação |
  |---|---|---|
  | `year` | número | ano da indicação |
  | `title` | texto | título do filme |
  | `studios` | texto | estúdio(s) |
  | `producers` | texto | um ou mais produtores, separados por vírgula e/ou "and" |
  | `winner` | `yes` \| `true` \| vazio | `yes` ou `true` marca o filme como vencedor; qualquer outro valor (inclusive vazio) é tratado como não vencedor |

- Exemplo de linha:

  ```
  1980;Can't Stop the Music;Associated Film Distribution;Allan Carr;yes
  ```

- Comportamento em caso de erro: um arquivo cujo cabeçalho não bate com o contrato acima é ignorado (com aviso no log), sem derrubar o processo. Se, ao final, **nenhum** arquivo válido resultar em linhas, a API falha ao subir (erro 500 no bootstrap).

### 4. Subir a API

```bash
# desenvolvimento (watch mode)
npm run start:dev

# produção
npm run build
npm start
```

A API sobe em `http://localhost:3000` (ou no `HOST`/`PORT` configurado), com todas as rotas sob o prefixo `/api/v1`.

### Padrão de acesso às rotas

Hoje o projeto expõe apenas as rotas de `health` e `awards/intervals`, mas ambas foram montadas seguindo a mesma lógica de design — essa é a lógica usada para definir o padrão de rotas do projeto, e qualquer rota nova deveria segui-la:

- Prefixo fixo `/api/v1/<módulo>/<recurso>` (ex.: `/api/v1/health`, `/api/v1/awards/intervals`).
- Request/response validados e serializados via schema Zod, sempre retornando JSON.
- Richardson Maturity Model nível 2: recursos expostos como substantivos, o método HTTP carrega a semântica da operação (`GET`, `POST`, ...), e os status codes HTTP padrão (`200`, `422`, `500`, ...) comunicam o resultado — não há um único endpoint/status genérico.

## Regras de negócio do endpoint de intervals

`GET /api/v1/awards/intervals` calcula, entre os produtores que já venceram o prêmio, quais têm o **menor** e o **maior** intervalo entre vitórias consecutivas:

- Só entram no cálculo filmes vencedores (`winner = true`), ordenados por ano.
- O intervalo é a diferença em anos entre duas vitórias **consecutivas** do mesmo produtor.
- Produtor com apenas 1 vitória não gera intervalo e é excluído do cálculo.
- Quando uma linha lista vários produtores (ex.: `"Produtor A, Produtor B and Produtor C"`), cada nome é separado (split por vírgula e por "and") e creditado individualmente.
- A resposta traz dois grupos — `min` (menor(es) intervalo(s) encontrado(s)) e `max` (maior(es)) — e, havendo empate, todos os produtores empatados aparecem na lista.

Exemplo de resposta (ilustrando o contrato, não uma listagem exaustiva de endpoints):

```json
{
  "min": [
    { "producer": "Produtor A", "interval": 1, "previousWin": 2000, "followingWin": 2001 }
  ],
  "max": [
    { "producer": "Produtor B", "interval": 10, "previousWin": 1990, "followingWin": 2000 }
  ]
}
```

## Como rodar os testes

```bash
npm run test        # roda todos os testes uma vez (vitest run)
npm run test:watch  # modo watch
```

Os testes existentes são de **integração**: sobem a aplicação Fastify, populam o SQLite em memória via Drizzle e fazem requisições HTTP (`app.inject`) contra as rotas, validando status code e corpo da resposta.

## Scripts

| Script | Comando | Descrição |
|---|---|---|
| `start:dev` | `tsx watch --env-file .env src/index.ts` | Sobe em modo desenvolvimento (watch) |
| `build` | `tsc -p tsconfig.json` | Compila TypeScript para `dist/` |
| `start` | `node --env-file .env dist/index.js` | Roda o build compilado |
| `typecheck` | `tsc --noEmit` | Checagem de tipos sem gerar arquivos |
| `test` | `vitest run` | Executa os testes uma vez |
| `test:watch` | `vitest` | Executa os testes em modo watch |
