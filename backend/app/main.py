import asyncio
import json
import websockets
from pydantic import TypeAdapter, ValidationError
from app.schemas import ClientMessage, ServerError, ServerAck, ServerBroadcastText, ServerBroadcastTyping

PORT = 3000

CLIENTS: set[websockets.ServerConnection] = set()
CLIENTS_USERNAMES: dict[websockets.ServerConnection, str] = {}

CLIENT_MESSAGE_ADAPTER = TypeAdapter[ClientMessage](ClientMessage)

def other_clients(websocket: websockets.ServerConnection) -> set[websockets.ServerConnection]:
    return CLIENTS - {websocket}

def extract_message_id(raw_message: str | bytes) -> str | None:
    """Tenta obter o id de uma mensagem que falhou na validação, para responder com ACK de erro."""
    try:
        parsed = json.loads(raw_message)
    except ValueError:
        return None

    if isinstance(parsed, dict) and isinstance(parsed.get('id'), str):
        return parsed['id']
    return None

async def send_error(websocket: websockets.ServerConnection, message: str, message_id: str | None = None, detail: str | None = None):
    if message_id is not None:
        await websocket.send(ServerAck(status='error', message_id=message_id).model_dump_json())
    await websocket.send(ServerError(message=message, detail=detail).model_dump_json())

async def handler(websocket: websockets.ServerConnection):
    client_address = websocket.remote_address
    print(f"Novo cliente ({client_address}) conectado")
    CLIENTS.add(websocket)

    try:
        async for message in websocket:
            print(f"Mensagem recebida do cliente ({client_address}): {message}")
            try:
                validated_message = CLIENT_MESSAGE_ADAPTER.validate_json(message)
            except ValidationError as e:
                print(f"Erro de validação para cliente ({client_address}):")
                print(e.errors())

                first_error = e.errors()[0]
                error_message = 'Campo "event" inválido' if first_error.get('type') == 'union_tag_invalid' else 'Erro de validação'

                await send_error(websocket, error_message, extract_message_id(message), detail=str(e))
                continue

            if validated_message.event == 'SET_USERNAME':
                taken = any(name == validated_message.username for ws, name in CLIENTS_USERNAMES.items() if ws is not websocket)
                if taken:
                    await send_error(websocket, 'Nome de usuário já está em uso', validated_message.id)
                    continue

                CLIENTS_USERNAMES[websocket] = validated_message.username
                await websocket.send(ServerAck(status='success', message_id=validated_message.id).model_dump_json())
                continue

            username = CLIENTS_USERNAMES.get(websocket)
            if username is None:
                message_id = validated_message.id if validated_message.event == 'SEND_TEXT' else None
                await send_error(websocket, 'Usuario sem nome', message_id)
                continue

            match validated_message.event:
                case 'TYPING':
                    websockets.broadcast(other_clients(websocket), ServerBroadcastTyping(username=username).model_dump_json())
                case 'SEND_TEXT':
                    await websocket.send(ServerAck(status='success', message_id=validated_message.id).model_dump_json())
                    broadcast_message = ServerBroadcastText(author=username, text=validated_message.text).model_dump_json()

                    websockets.broadcast(other_clients(websocket), broadcast_message)
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Cliente ({client_address}) desconectado: {e}")
    finally:
        CLIENTS.discard(websocket)
        CLIENTS_USERNAMES.pop(websocket, None)
        print(f"Encerrando conexão com cliente ({client_address})")

async def main():

    async with websockets.serve(handler, "0.0.0.0", PORT) as server:
        print(f"Servidor WebSocket rodando em ws://{server.sockets[0].getsockname()[0]}:{PORT}")

        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
