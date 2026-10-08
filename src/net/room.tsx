import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ClientAction, ClientMessage, GameConfig, GameView, RoomInfo, ServerMessage } from '../../shared/types';

type Conn = 'connecting' | 'open' | 'reconnecting';

interface Membership {
  code: string;
  watch: boolean;
  hostKey?: string;
}

export interface RoomApi {
  conn: Conn;
  view: GameView | null;
  /** Local clock reading when `view` arrived — pairs with view.serverNow to estimate server time. */
  viewAt: number;
  /** undefined = not asked yet, null = no such game, RoomInfo = game exists and you may join. */
  roomInfo: RoomInfo | null | undefined;
  pendingCode: string | null;
  hostKey: string | null;
  error: string | null;
  closed: string | null;
  create(hostName: string, config: GameConfig): void;
  lookup(code: string): void;
  join(code: string, name: string): void;
  send(action: ClientAction): void;
  leave(): void;
  dismissError(): void;
}

const RoomContext = createContext<RoomApi | null>(null);

function sessionId(): string {
  // Per tab on purpose: a reload keeps your seat, and two tabs can be two players when testing.
  let id = sessionStorage.getItem('wai.session');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('wai.session', id);
  }
  return id;
}

function membershipFromUrl(): Membership | null {
  const q = new URLSearchParams(location.search);
  const code = q.get('room')?.toUpperCase();
  if (!code) return null;
  return { code, watch: q.get('view') === 'board', hostKey: q.get('host') ?? undefined };
}

function setUrl(m: Membership | null) {
  const q = new URLSearchParams();
  if (m) {
    q.set('room', m.code);
    if (m.hostKey) q.set('host', m.hostKey);
    if (m.watch) q.set('view', 'board');
  }
  const qs = q.toString();
  history.replaceState(null, '', qs ? `/?${qs}` : '/');
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const [conn, setConn] = useState<Conn>('connecting');
  const [state, setState] = useState<{ view: GameView | null; viewAt: number }>({ view: null, viewAt: 0 });
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [closed, setClosed] = useState<string | null>(null);
  const [membership, setMembership] = useState<Membership | null>(membershipFromUrl);

  const ws = useRef<WebSocket | null>(null);
  const member = useRef(membership);
  member.current = membership;

  const raw = useCallback((msg: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg));
    else setError('You are offline. Reconnecting…');
  }, []);

  const resume = useCallback(() => {
    const m = member.current;
    if (!m) return;
    raw(m.watch ? { t: 'watch', code: m.code } : { t: 'resume', code: m.code, sessionId: sessionId(), hostKey: m.hostKey });
  }, [raw]);

  useEffect(() => {
    let stopped = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout>;

    const open = () => {
      const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
      ws.current = socket;
      socket.onopen = () => {
        retry = 0;
        setConn('open');
        setError(null);
        resume();
      };
      socket.onclose = () => {
        if (stopped) return;
        setConn('reconnecting');
        timer = setTimeout(open, Math.min(5000, 500 * 2 ** retry++));
      };
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data) as ServerMessage;
        switch (msg.t) {
          case 'joined': {
            const next = { code: msg.code, watch: msg.role === 'spectator', hostKey: msg.hostKey ?? member.current?.hostKey };
            setMembership(next);
            setUrl(next);
            setRoomInfo(undefined);
            setClosed(null);
            break;
          }
          case 'state':
            setState({ view: msg.view, viewAt: Date.now() });
            break;
          case 'room':
            setRoomInfo(msg.info);
            break;
          case 'error':
            if (msg.code === 'no_room') setRoomInfo(null);
            setError(msg.message);
            break;
          case 'closed':
            setState({ view: null, viewAt: 0 });
            setMembership(null);
            setRoomInfo(undefined);
            if (msg.reason === 'left') setUrl(null);
            else setClosed(msg.reason);
            break;
        }
      };
    };
    open();
    return () => {
      stopped = true;
      clearTimeout(timer);
      ws.current?.close();
    };
  }, [resume]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4500);
    return () => clearTimeout(t);
  }, [error]);

  const api: RoomApi = {
    conn,
    view: state.view,
    viewAt: state.viewAt,
    roomInfo,
    pendingCode: membership?.code ?? null,
    hostKey: membership?.hostKey ?? null,
    error,
    closed,
    create: (hostName, config) => raw({ t: 'create', sessionId: sessionId(), hostName, config }),
    lookup: (code) => {
      const next = { code: code.toUpperCase(), watch: false };
      member.current = next;
      setMembership(next);
      setRoomInfo(undefined);
      setUrl(next);
      resume();
    },
    join: (code, name) => raw({ t: 'join', code, sessionId: sessionId(), name }),
    send: (action) => raw({ t: 'action', action }),
    leave: () => {
      if (state.view) raw({ t: 'leave' });
      else {
        setMembership(null);
        setRoomInfo(undefined);
        setUrl(null);
      }
    },
    dismissError: () => setError(null),
  };

  return <RoomContext.Provider value={api}>{children}</RoomContext.Provider>;
}

export function useRoom(): RoomApi {
  const api = useContext(RoomContext);
  if (!api) throw new Error('useRoom must be used inside <RoomProvider>');
  return api;
}

/** For screens that only render once a game view exists. */
export function useGame() {
  const api = useRoom();
  if (!api.view) throw new Error('No game view yet');
  return { ...api, view: api.view };
}
