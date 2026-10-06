# Projeto Chat WebSocket

Aplicação de chat em tempo real separada em dois serviços: um backend em Python gerenciado com `uv` e um frontend utilizando TypeScript e Bun.

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python, Pydantic, WebSockets, `uv` (Package Manager).
- **Frontend:** TypeScript, Bun, HTML/CSS.

## ⚙️ Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em sua máquina:

- [Python 3.14+](https://www.python.org/downloads/)
- [uv](https://github.com/astral-sh/uv) (Gerenciador de pacotes e ambientes Python)
- [Bun](https://bun.sh/) (Runtime e gerenciador de pacotes para o Frontend)

---

## 🚀 Como Executar o Projeto

O projeto é dividido em duas pastas distintas. Você precisará de dois terminais abertos para rodar o backend e o frontend simultaneamente.

### Usando o workspace do VS Code (recomendado)

O arquivo `chat.code-workspace` abre o `frontend` e o `backend` como pastas separadas no mesmo VS Code (multi-root workspace), cada uma com suas próprias configurações e ambiente.

1. Abra o workspace: **File > Open Workspace from File...** e selecione `chat.code-workspace`, ou pelo terminal:

   ```bash
   code chat.code-workspace
   ```

2. Abra um terminal para cada projeto: em **Terminal > New Terminal** (`` Ctrl+Shift+` ``), o VS Code pergunta em qual pasta abrir. Escolha `backend` para o primeiro terminal e repita escolhendo `frontend` para o segundo.

Cada terminal já abre dentro da pasta do projeto, então o `cd` dos passos abaixo não é necessário. Para ver os dois lado a lado, use **Split Terminal** (`Ctrl+Shift+5`).

### 1. Rodando o Backend (Python)

Abra o primeiro terminal, navegue até a pasta do backend e inicie o servidor:

```bash
# Entre na pasta do backend
cd backend

# Sincronize as dependências e crie o ambiente virtual usando o uv
uv sync

# Inicie o servidor WebSocket
uv run python -m app.main
```

_O servidor estará escutando na porta configurada (ex: `ws://localhost:3000` ou `ws://0.0.0.0:3000`)._

### 2. Rodando o Frontend (Bun)

Abra o segundo terminal, navegue até a pasta do frontend e inicie a aplicação:

```bash
# Entre na pasta do frontend
cd frontend

# Instale as dependências usando Bun
bun install

# Inicie o servidor de desenvolvimento
bun run dev

```

_O servidor de desenvolvimento do frontend estará disponível no seu navegador local._

---

## 📁 Estrutura do Projeto

- `/backend`: Contém a lógica do servidor, definição de schemas (Pydantic), gerenciamento de estado das conexões e rotas do WebSocket.
- `/frontend`: Contém a interface do usuário, tipagens do TypeScript e comunicação via cliente WebSocket.
