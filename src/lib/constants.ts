export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

export const STORAGE_KEYS = {
  SESSION_ID: "algojams_session_id",
  REDIRECT_AFTER_LOGIN: "redirect_after_login",
} as const;

export const WEBSOCKET = {
  RECONNECT_MAX_ATTEMPTS: 5,
  RECONNECT_DELAY_MS: 1000,
  PING_INTERVAL_MS: 30000,
  CONNECTION_TIMEOUT_MS: 10000,
} as const;

export const RATE_LIMITS = {
  CODE_UPDATES_PER_SECOND: 10,
  CHAT_MESSAGES_PER_MINUTE: 20,
  AGENT_REQUESTS_PER_MINUTE: 10,
} as const;

export const EDITOR = {
  MAX_CODE_SIZE_BYTES: 100 * 1024, // 100KB
  DEFAULT_CODE: `// Welcome to Algojams!
// Edit the code below and press play
// Learn more at strudel.cc/learn

// tempo
setCpm(108/4)

// drums
$: stack(
  cat(
    s("bd").bank("tr808").beat("0,7,8", 16),
    s("bd").bank("tr808").beat("0,2,7,8,14", 16),
  ),

  s("sd:8").bank("tr808").beat("4,12", 16),
  s("hh*8").bank("EmuSP12").gain(0.3),
)

// chords
$: note("<[0,3,7] [0,4,7]>".add("<b2 g2 b2 a2>")).room(.5).sustain(0.2).sound("gm_acoustic_guitar_nylon")`,
} as const;
