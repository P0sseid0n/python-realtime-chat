import asyncio
import websockets
from pydantic import TypeAdapter, ValidationError
from app.schemas import IncomingMessage, ServerError, ServerAck, ServerBroadcastText, ServerBroadcastTyping

PORT = 3000

CLIENTS: set[websockets.ServerConnection] = set()
CLIENTS_USERNAMES: dict[websockets.ServerConnection, str] = {}

async def handler(websocket: websockets.ServerConnection):
    client_address = websocket.remote_address
    print(f"Novo cliente ({client_address}) conectado")
    CLIENTS.add(websocket)
    OTHER_CLIENTS = CLIENTS - {websocket}

    try:
        async for message in websocket:
            print(f"Mensagem recebida do cliente ({client_address}): {message}")
            try:
                adapter = TypeAdapter[IncomingMessage](IncomingMessage)
                validated_message = adapter.validate_json(message)

                if validated_message.event == 'SET_USERNAME':
                    CLIENTS_USERNAMES[websocket] = validated_message.username
                    await websocket.send(ServerAck(status='success', message_id=validated_message.id).model_dump_json())
                elif CLIENTS_USERNAMES.get(websocket) is None:
                    await websocket.send(ServerError(message='Usuario sem nome').model_dump_json())
                else:
                    match validated_message.event:
                        case 'TYPING':
                            username = CLIENTS_USERNAMES[websocket]
                            websockets.broadcast(OTHER_CLIENTS, ServerBroadcastTyping(username=username).model_dump_json())
                        case 'SEND_TEXT':
                            username = CLIENTS_USERNAMES[websocket]
                    
                            await websocket.send(ServerAck(status='success', message_id=validated_message.id).model_dump_json())
                            broadcast_message = ServerBroadcastText(author=username, text=validated_message.text).model_dump_json()

                            websockets.broadcast(OTHER_CLIENTS, broadcast_message)
            except ValidationError as e:
                print(f"Erro de validação para cliente ({client_address}):")
                print(e.errors())

                first_error = e.errors()[0]

                if first_error.get('type') == 'union_tag_invalid':
                    response = ServerError(event='ERROR', message='Campo "event" inválido', detail=str(e)).model_dump_json()
                else:
                    response = ServerError(event='ERROR', message='Erro de validação', detail=str(e)).model_dump_json()
                await websocket.send(response)
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
