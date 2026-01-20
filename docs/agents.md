# algojams frontend - agent context

## Project Overview

algojams is a live coding music platform where users create "strudels" (music patterns) with AI assistance. users can collaborate in real-time via WebSocket, with support for both anonymous and authenticated sessions.

## Tech Stack

| Category        | Technology                   |
| --------------- | ---------------------------- |
| Framework       | Next.js 16 (App Router)      |
| Language        | TypeScript                   |
| UI Components   | shadcn/ui                    |
| Styling         | Tailwind CSS                 |
| Server State    | React Query (TanStack Query) |
| Client State    | Zustand                      |
| Code Editor     | @strudel/codemirror          |
| Audio Engine    | @strudel/webaudio            |
| Package Manager | pnpm                         |

## Backend

- **REST API**: `http://localhost:8080` (configurable via `NEXT_PUBLIC_API_URL`)
- **WebSocket**: `ws://localhost:8080` (configurable via `NEXT_PUBLIC_WS_URL`)
- **Auth**: OAuth with GitHub and Google providers

## Project Structure

```
frontend/
├── docs/
│   ├── agents.md                 # This file - agent context
│   └── api-guide.md              # API integration reference
├── public/
│   └── favicon.ico
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/      # Login-specific components
│   │   │   ├── callback/[provider]/
│   │   │   └── layout.tsx
│   │   ├── (main)/                   # Main app route group
│   │   │   ├── page.tsx              # Main editor (anonymous entry)
│   │   │   ├── layout.tsx
│   │   │   ├── _components/          # Shared by layout.tsx and page.tsx
│   │   │   │   ├── header.tsx
│   │   │   │   ├── strudel-editor.tsx
│   │   │   │   ├── chat-panel.tsx
│   │   │   │   └── ...
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/      # Dashboard-specific
│   │   │   └── explore/
│   │   │       └── page.tsx
│   │   ├── join/
│   │   │   └── page.tsx              # Join via invite token
│   │   └── layout.tsx                # Root layout
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components (do not edit manually)
│   │   └── shared/                   # Components used by 2+ pages
│   ├── lib/
│   │   ├── api/                      # REST API client + types
│   │   │   ├── client.ts             # Fetch wrapper with auth
│   │   │   ├── auth.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── strudels.ts
│   │   │   ├── strudels.types.ts
│   │   │   ├── sessions.ts
│   │   │   └── sessions.types.ts
│   │   ├── hooks/                    # React Query hooks
│   │   │   ├── use-auth.ts
│   │   │   ├── use-strudels.ts
│   │   │   ├── use-sessions.ts
│   │   │   └── use-websocket.ts
│   │   ├── stores/                   # Zustand stores
│   │   │   ├── auth-store.ts
│   │   │   ├── websocket-store.ts
│   │   │   ├── editor-store.ts
│   │   │   ├── audio-store.ts
│   │   │   └── ui-store.ts
│   │   ├── websocket/                # WebSocket client
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── utils/
│   │   │   ├── storage.ts
│   │   │   └── debounce.ts
│   │   └── constants.ts              # All app constants
│   ├── providers/
│   │   ├── providers.tsx             # Combined providers wrapper
│   │   ├── query-provider.tsx
│   │   └── auth-hydration.tsx
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── strudel.d.ts              # External module declarations only
```

## Key Conventions

### Component Organization

| Scope                  | Location                          |
| ---------------------- | --------------------------------- |
| Page-specific (1 page) | `app/[route]/_components/`        |
| Shared (2+ pages)      | `components/shared/`              |
| shadcn/ui components   | `components/ui/` (auto-generated) |

### Type Colocation

Types live next to the code that uses them:

- `lib/api/auth.types.ts` for `lib/api/auth.ts`
- `lib/websocket/types.ts` for `lib/websocket/client.ts`

Exception: `types/` folder is for external module declarations (e.g., Strudel packages).

### Constants

All magic values go in `lib/constants.ts`:

- `API_BASE_URL`, `WS_BASE_URL`
- `STORAGE_KEYS`
- `WEBSOCKET` (reconnect settings, ping interval)
- `RATE_LIMITS`
- `EDITOR` (default code, max size)

### Imports

Use path aliases:

```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { API_BASE_URL } from '@/lib/constants';
```

## State Architecture

```
React Query (Server State)          Zustand (Client State)
├── Strudels CRUD                   ├── auth-store (token, user)
├── Sessions CRUD                   ├── websocket-store (status, participants, messages)
├── User profile                     ├── editor-store (code, cursor, isDirty)
└── Public strudels                 ├── audio-store (isPlaying, isInitialized)
                                    └── ui-store (modals, panels)
```

### When to Use What

- **React Query**: Data from REST API that needs caching/refetching
- **Zustand**: Real-time state (WebSocket), UI state, auth tokens

## WebSocket Flow

1. **Anonymous**: Connect without token → receive `session_id` → store in localStorage
2. **Authenticated**: Connect with JWT token → create/join session
3. **Reconnect**: Use stored `session_id` on page refresh
4. **Transfer**: After login, `POST /api/v1/sessions/transfer` with `session_id`

### Message Types (Client → Server)

- `code_update` - Send code changes
- `agent_request` - Request AI assistance
- `chat_message` - Send chat message
- `ping` - Heartbeat

### Message Types (Server → Client)

- `session_state` - Initial state on connect
- `code_update` - Code changes from others
- `agent_response` - AI response
- `chat_message` - Chat from others
- `user_joined` / `user_left` - Participant changes
- `error` - Error messages
- `pong` - Heartbeat response

## Authentication

- OAuth providers: GitHub, Google
- JWT stored in Zustand with localStorage persistence
- Auth flow:
  1. Click login → redirect to `/api/v1/auth/{provider}`
  2. OAuth flow → redirect to `/callback/{provider}?token=...`
  3. Store token → redirect to intended page

## Development Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## Adding New Features

### New Page

1. Create `app/(main)/[route]/page.tsx`
2. Add page-specific components in `app/(main)/[route]/_components/`
3. If component is needed elsewhere later, move to `components/shared/`

### New API Endpoint

1. Add types in `lib/api/[resource].types.ts`
2. Add API functions in `lib/api/[resource].ts`
3. Add React Query hook in `lib/hooks/use-[resource].ts`

### New Zustand Store

1. Create `lib/stores/[name]-store.ts`
2. Export from `lib/stores/index.ts`
3. Follow existing patterns (initial state, actions, selectors)

## Strudel Integration

The editor uses multiple `@strudel` packages for live coding music:

| Package              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `@strudel/codemirror`| `StrudelMirror` editor with pattern highlighting |
| `@strudel/core`      | Pattern engine, `evalScope`                  |
| `@strudel/transpiler`| Code transpiler, syntax highlighting         |
| `@strudel/webaudio`  | Audio output, synth sounds, samples          |
| `@strudel/mini`      | Mini notation parser                         |
| `@strudel/tonal`     | Scales and chords                            |
| `@strudel/draw`      | Visualizations                               |
| `@strudel/soundfonts`| Soundfont instruments                        |
| `@strudel/sampler`   | Sample playback                              |

### StrudelMirror Features

- **Pattern highlighting**: Shows currently playing code sections
- **Flash effects**: Visual feedback on evaluation
- **Strudel syntax**: Proper highlighting for Tidal/Strudel patterns
- **Keyboard shortcuts**: Ctrl+Enter (play), Ctrl+. (stop)

### Key Editor Files

- `app/(main)/_components/strudel-editor.tsx` - StrudelMirror integration
- `app/(main)/_components/use-strudel-audio.ts` - Audio control hook
- `types/strudel.d.ts` - Type declarations for all Strudel packages

## Key Files Reference

| File                                          | Purpose                               |
| --------------------------------------------- | ------------------------------------- |
| `lib/constants.ts`                            | All app constants                     |
| `lib/api/client.ts`                           | Fetch wrapper with auth interceptor   |
| `lib/websocket/client.ts`                     | WebSocket singleton with reconnection |
| `lib/stores/auth-store.ts`                    | JWT + user state with persistence     |
| `app/(main)/page.tsx`                         | Main editor entry point               |
| `app/(main)/_components/strudel-editor.tsx`   | StrudelMirror integration             |
| `app/(main)/_components/use-strudel-audio.ts` | Strudel audio hook                    |
