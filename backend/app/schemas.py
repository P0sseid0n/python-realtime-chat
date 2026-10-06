from typing import Annotated, Literal
from pydantic import BaseModel, Field, StringConstraints

Username = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=32)]
MessageText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]

class BaseCommand(BaseModel):
    id: str

class ClientSetUsername(BaseCommand):
    event: Literal['SET_USERNAME'] = 'SET_USERNAME'
    username: Username

class ClientSendText(BaseCommand):
    event: Literal['SEND_TEXT'] = 'SEND_TEXT'
    text: MessageText

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

class ServerBroadcastUsernameChange(BaseModel):
    event: Literal['BROADCAST_USERNAME_CHANGE'] = 'BROADCAST_USERNAME_CHANGE'
    old_username: str
    new_username: str

class ServerBroadcastUserJoined(BaseModel):
    event: Literal['BROADCAST_USER_JOINED'] = 'BROADCAST_USER_JOINED'
    username: str

class ServerBroadcastUserLeft(BaseModel):
    event: Literal['BROADCAST_USER_LEFT'] = 'BROADCAST_USER_LEFT'
    username: str

type ServerMessage = Annotated[
    ServerAck
    | ServerError
    | ServerBroadcastText
    | ServerBroadcastTyping
    | ServerBroadcastUsernameChange
    | ServerBroadcastUserJoined
    | ServerBroadcastUserLeft,
    Field(discriminator='event')]