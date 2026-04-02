# Live Chat

## Current Direction

Live Chat is connected between:

- customer mobile app
- support / manager console

## Customer APIs

- `GET /support/chats/me`
- `POST /support/chats`
- `GET /support/chats/:id`
- `POST /support/chats/:id/messages`

## Console APIs

- `GET /support/console/chats/open`
- `GET /support/console/chats/assigned`
- `GET /support/console/chats/resolved`
- `GET /support/console/chats/:id`
- `POST /support/console/chats/:id/assign`
- `POST /support/console/chats/:id/messages`
- `PATCH /support/console/chats/:id/status`

## Statuses

- open
- assigned
- waiting_customer
- waiting_agent
- resolved
- closed
