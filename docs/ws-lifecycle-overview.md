# Websocket Lifecycle Overview

Quick flowchart of how live sessions actually work for agents and contributors. 

## page load flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PAGE LOAD                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   check URL params & storage   │
                    └───────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  ?id=<uuid>   │         │ ?invite=<token> │         │   no params     │
│(saved strudel)│         │  (join session) │         │                 │
└───────────────┘         └─────────────────┘         └─────────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ auth required │         │ store viewer    │         │ check stored    │
│ fetch strudel │         │ session in      │         │ session ID      │
│ metadata      │         │ sessionStorage  │         │ (sessionStorage)│
└───────────────┘         └─────────────────┘         └─────────────────┘
        │                           │                           │
        └───────────────────────────┴───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WebSocket connect                                   │
│  wsClient.connect({ sessionId?, inviteToken?, displayName? })               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      server sends session_state                             │
│  { code, your_role, participants, chat_history, conversation_history,       │
│    request_id: null }   ← null because this is initial connect              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  initialLoadComplete = false?  │
                    └───────────────────────────────┘
                          │ YES              │ NO (reconnect)
                          ▼                  ▼
                ┌─────────────────┐  ┌─────────────────┐
                │ restore code    │  │ ignore code     │
                │ from server     │  │ (keep current)  │
                └─────────────────┘  └─────────────────┘
                          │                  │
                          └────────┬─────────┘
                                   ▼
                    ┌───────────────────────────────┐
                    │   initialLoadComplete = true  │
                    │   save draft to localStorage  │
                    └───────────────────────────────┘
```

## user actions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CODE EDITING                                     │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  sendCodeUpdate(code)                 │  ← fire-and-forget
│  save draft to localStorage           │  ← continuous backup
└───────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                            AI REQUEST                                       │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  sendAgentRequest(query)              │
│  → sendWithReply (generates UUID)     │
│  → pendingRequests.set(requestId)     │
└───────────────────────────────────────┘
        │
        ├─────────────────────┬─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│agent_response │     │    error      │     │   timeout     │
│(request_id)   │     │(request_id)   │     │   (30s)       │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│Promise.resolve│     │Promise.reject │     │Promise.reject │
│+ UI update    │     │+ UI error     │     │               │
└───────────────┘     └───────────────┘     └───────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         SWITCH STRUDEL                                       │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  sendSwitchStrudel(strudelId)         │
│  → sendWithReply (generates UUID)     │
│  → pendingRequests.set(requestId)     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  server sends session_state           │
│  { ..., request_id: <matching-uuid> } │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  pendingRequests.has(request_id)?     │
│  YES → restore code, resolve Promise  │
└───────────────────────────────────────┘
```

## auth vs anonymous

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATED USER                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────-┐     ┌─────────────┐     ┌─────────────┐
  │ my-strudels  │     │ saved       │     │ fresh       │
  │ /my-strudels │     │ /?id=<uuid> │     │ /           │
  └─────────────-┘     └─────────────┘     └─────────────┘
        │                   │                   │
        │                   ▼                   ▼
        │           ┌─────────────┐     ┌─────────────┐
        │           │ load from   │     │ new session │
        │           │ server via  │     │ default code│
        │           │ rest-api    │     └─────────────┘
        │           └─────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────┐
  │  can: save, fork, share, create invites         │
  │  session ID stored in sessionStorage            │
  │  strudels persist to database                   │
  └─────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANONYMOUS USER                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐     ┌─────────────┐
  │ fresh       │     │ join via    │
  │ /           │     │ invite link │
  └─────────────┘     └─────────────┘
        │                   │
        ▼                   ▼
  ┌─────────────┐     ┌─────────────┐
  │ ephemeral   │     │ viewer or   │
  │ session     │     │ co-author   │
  │ default code│     │ role        │
  └─────────────┘     └─────────────┘
        │                   │
        ▼                   ▼
  ┌─────────────────────────────────────────────────┐
  │  cannot: save (prompted to login)               │
  │  draft saved to localStorage only               │
  │  session lost on tab close (sessionStorage)     │
  └─────────────────────────────────────────────────┘
```

## disconnect & reconnect

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DISCONNECT                                          │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  rejectAllPendingRequests()           │  ← all Promises reject
│  exponential backoff reconnect        │
│  (max 5 attempts)                     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  on reconnect: session_state          │
│  request_id: null                     │
│  → initialLoadComplete = true         │
│  → CODE NOT RESTORED (keep current)   │  ← user's work preserved
└───────────────────────────────────────┘
```

## storage

| storage          | key                  | purpose                             |
| ---------------- | -------------------- | ----------------------------------- |
| `sessionStorage` | `session_id`         | current WebSocket session (per-tab) |
| `sessionStorage` | `viewer_session`     | invite context for reconnect        |
| `sessionStorage` | `current_strudel_id` | loaded saved strudel ID             |
| `sessionStorage` | `current_draft_id`   | unsaved draft ID                    |
| `localStorage`   | `drafts`             | backup of all unsaved work          |
| `localStorage`   | `auth_token`         | JWT (persists across tabs)          |
