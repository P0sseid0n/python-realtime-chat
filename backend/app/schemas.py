from typing import Annotated, Literal
from pydantic import BaseModel, Field

class BaseCommand(BaseModel):
    id: str

class ClientSetUsername(BaseCommand):
    event: Literal['SET_USERNAME'] = 'SET_USERNAME'
    username: str

class ClientSendText(BaseCommand):
    event: Literal['SEND_TEXT'] = 'SEND_TEXT'
    text: str 

class ClientTyping(BaseModel):
    event: Literal['TYPING'] = 'TYPING'

type ClientMessage = Annotated[ClientSetUsername | ClientSendText | ClientTyping, Field(discriminator='event')]

class ServerAck(BaseModel):
    event: Literal['ACK'] = 'ACK'
    status: Literal['success', 'error']
    message_id: str

class ServerError(BaseModel):
    event: Literal['ERROR'] = 'ERROR'
    message: str
    detail: str | None = None

class ServerBroadcastText(BaseModel):
    event: Literal['BROADCAST_TEXT'] = 'BROADCAST_TEXT'
    author: str
    text: str

class ServerBroadcastTyping(BaseModel):
    event: Literal['BROADCAST_TYPING'] = 'BROADCAST_TYPING'
    username: str

type ServerMessage = Annotated[ServerAck | ServerError | ServerBroadcastText, Field(discriminator='event')]