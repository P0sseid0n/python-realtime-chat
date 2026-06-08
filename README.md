# Projeto Chat WebSocket

Aplicação de chat em tempo real separada em dois serviços: um backend em Python gerenciado com `uv` e um frontend utilizando TypeScript e Bun.

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python, Pydantic, WebSockets, `uv` (Package Manager).
- **Frontend:** TypeScript, Bun, HTML/CSS.

## ⚙️ Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em sua máquina:

- [Python 3.12+](https://www.python.org/downloads/)
- [uv](https://github.com/astral-sh/uv) (Gerenciador de pacotes e ambientes Python)
- [Bun](https://bun.sh/) (Runtime e gerenciador de pacotes para o Frontend)

---

## 🚀 Como Executar o Projeto

O projeto é dividido em duas pastas distintas. Você precisará de dois terminais abertos para rodar o backend e o frontend simultaneamente.

### 1. Rodando o Backend (Python)

Abra o primeiro terminal, navegue até a pasta do backend e inicie o servidor:

```bash
# Entre na pasta do backend
cd backend

# Sincronize as dependências e crie o ambiente virtual usando o uv
uv sync

# Inicie o servidor WebSocket
uv run main.py
```
