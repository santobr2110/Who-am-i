import { randomBytes, randomInt } from 'node:crypto';
import type { WebSocket } from 'ws';
import { GameError, applyAction, createGame, tickDue } from '../shared/engine/engine';
import { toView } from '../shared/engine/view';
import type {
  ClientMessage,
  GameAction,
  GameState,
  RoomInfo,
  ServerMessage,
  Viewer,
} from '../shared/types';

/** One connected browser tab. */
interface Client {
  ws: WebSocket;
  room: Room | null;
  viewer: Viewer;
}

interface Room {
  code: string;
  hostKey: string;
  hostName: string;
  state: GameState;
  /** sessionId → playerId. A session survives reloads, so a refresh is a reconnect, not a new player. */
  sessions: Map<string, string>;
  clients: Set<Client>;
  lastActivity: number;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O — they read as 1 and 0 over a call
const ROOM_TTL_MS = 3 * 60 * 60 * 1000;
const TICK_MS = 500;
/** Hosting proxies close sockets that stay silent; a ping keeps a quiet table connected. */
const PING_MS = 25_000;

/**
 * Holds every live game in memory and is the only place that touches sockets.
 * Swap the Map for a database to make rooms survive a restart.
 */
export class RoomManager {
  private rooms = new Map<string, Room>();
  private clients = new Map<WebSocket, Client>();

  constructor() {
    setInterval(() => this.tick(), TICK_MS).unref();
    setInterval(() => {
      for (const ws of this.clients.keys()) if (ws.readyState === ws.OPEN) ws.ping();
    }, PING_MS).unref();
  }

  connect(ws: WebSocket) {
    const client: Client = { ws, room: null, viewer: { id: null, role: 'spectator' } };
    this.clients.set(ws, client);
    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      try {
        this.handle(client, msg);
      } catch (err) {
        if (err instanceof GameError) send(ws, { t: 'error', code: err.code, message: err.message });
        else {
          console.error(err);
          send(ws, { t: 'error', code: 'server_error', message: 'Something went wrong. Please try again.' });
        }
      }
    });
    ws.on('close', () => {
      this.clients.delete(ws);
      this.detach(client);
    });
  }

  private handle(client: Client, msg: ClientMessage) {
    switch (msg.t) {
      case 'create': {
        this.detach(client);
        const code = this.newCode();
        const hostId = newId();
        const room: Room = {
          code,
          hostKey: randomBytes(9).toString('base64url'),
          hostName: msg.hostName.trim() || 'Teacher',
          state: createGame(code, hostId, msg.config, Date.now()),
          sessions: new Map([[msg.sessionId, hostId]]),
          clients: new Set(),
          lastActivity: Date.now(),
        };
        this.rooms.set(code, room);
        this.syncHostSeat(room);
        this.attach(client, room, { id: hostId, role: 'host' });
        break;
      }
      case 'resume': {
        const room = this.rooms.get(msg.code.toUpperCase());
        if (!room) return send(client.ws, { t: 'room', info: null });
        if (msg.hostKey && msg.hostKey === room.hostKey) room.sessions.set(msg.sessionId, room.state.hostId);
        const id = room.sessions.get(msg.sessionId);
        const known = id === room.state.hostId || room.state.players.some((p) => p.id === id);
        if (!id || !known) return send(client.ws, { t: 'room', info: roomInfo(room) });
        this.detach(client);
        this.attach(client, room, { id, role: id === room.state.hostId ? 'host' : 'player' });
        break;
      }
      case 'join': {
        const room = this.rooms.get(msg.code.toUpperCase());
        if (!room) throw new GameError('no_room', "We couldn't find that game. Check the code.");
        this.detach(client);
        const name = msg.name.trim();
        // Someone who lost their tab comes back by typing the same name.
        const reclaim = room.state.players.find(
          (p) => !p.connected && p.id !== room.state.hostId && p.name.toLowerCase() === name.toLowerCase(),
        );
        const id = reclaim?.id ?? newId();
        if (!reclaim) this.apply(room, null, { type: 'join', playerId: id, name });
        room.sessions.set(msg.sessionId, id);
        this.attach(client, room, { id, role: 'player' });
        break;
      }
      case 'watch': {
        const room = this.rooms.get(msg.code.toUpperCase());
        if (!room) throw new GameError('no_room', "We couldn't find that game. Check the code.");
        this.detach(client);
        this.attach(client, room, { id: null, role: 'spectator' });
        break;
      }
      case 'action': {
        const room = client.room;
        if (!room || !client.viewer.id) throw new GameError('not_in_room', 'You are not in a game.');
        this.apply(room, client.viewer.id, msg.action);
        if (msg.action.type === 'updateConfig') this.syncHostSeat(room);
        this.broadcast(room);
        break;
      }
      case 'leave': {
        const room = client.room;
        const { id, role } = client.viewer;
        if (!room) break;
        client.room = null;
        room.clients.delete(client);
        if (id && role === 'player') {
          this.apply(room, null, { type: 'leave', playerId: id });
          for (const [session, playerId] of room.sessions) if (playerId === id) room.sessions.delete(session);
        } else if (role === 'host') {
          this.syncPresence(room, id);
        }
        send(client.ws, { t: 'closed', reason: 'left' });
        this.broadcast(room);
        break;
      }
    }
  }

  private attach(client: Client, room: Room, viewer: Viewer) {
    // A second tab on the same seat replaces the first, so nobody plays twice.
    for (const other of room.clients) {
      if (viewer.id && other.viewer.id === viewer.id && other !== client) {
        other.room = null;
        room.clients.delete(other);
        send(other.ws, { t: 'closed', reason: 'replaced' });
      }
    }
    client.room = room;
    client.viewer = viewer;
    room.clients.add(client);
    this.syncPresence(room, viewer.id);
    send(client.ws, {
      t: 'joined',
      code: room.code,
      role: viewer.role,
      hostKey: viewer.role === 'host' ? room.hostKey : undefined,
    });
    this.broadcast(room);
  }

  private detach(client: Client) {
    const room = client.room;
    if (!room) return;
    client.room = null;
    room.clients.delete(client);
    this.syncPresence(room, client.viewer.id);
    this.broadcast(room);
  }

  /** Mirrors "does this id still have an open socket?" into the game state. */
  private syncPresence(room: Room, id: string | null) {
    if (!id) return;
    const connected = [...room.clients].some((c) => c.viewer.id === id);
    if (id === room.state.hostId) this.apply(room, null, { type: 'hostConnection', connected });
    this.apply(room, null, { type: 'connection', playerId: id, connected });
  }

  /** Seats or unseats the teacher when "I'm playing too" changes. */
  private syncHostSeat(room: Room) {
    const { hostId, config, players } = room.state;
    const seated = players.some((p) => p.id === hostId);
    if (config.hostPlays && !seated) {
      try {
        this.apply(room, null, { type: 'join', playerId: hostId, name: room.hostName });
      } catch {
        // Table already full: the teacher stays a spectator.
        this.apply(room, hostId, { type: 'updateConfig', config: { hostPlays: false } });
      }
    } else if (!config.hostPlays && seated) {
      this.apply(room, null, { type: 'leave', playerId: hostId });
    }
  }

  private apply(room: Room, actorId: string | null, action: GameAction) {
    room.state = applyAction(room.state, actorId, action, { now: Date.now(), rng: Math.random });
    room.lastActivity = Date.now();
  }

  private broadcast(room: Room) {
    const now = Date.now();
    for (const client of room.clients) {
      // The host's player record may be gone (removed) or absent (not playing) — the view handles both.
      send(client.ws, { t: 'state', view: toView(room.state, client.viewer, now) });
    }
  }

  private tick() {
    const now = Date.now();
    for (const room of this.rooms.values()) {
      if (tickDue(room.state, now)) {
        this.apply(room, null, { type: 'tick' });
        this.broadcast(room);
      }
      if (room.clients.size === 0 && now - room.lastActivity > ROOM_TTL_MS) this.rooms.delete(room.code);
    }
  }

  private newCode(): string {
    for (;;) {
      const code = Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
      if (!this.rooms.has(code)) return code;
    }
  }
}

function roomInfo(room: Room): RoomInfo {
  const { state } = room;
  return {
    code: room.code,
    status: state.status,
    players: state.players.length,
    maxPlayers: state.config.maxPlayers,
    reclaimable: state.players.filter((p) => !p.connected && p.id !== state.hostId).map((p) => p.name),
  };
}

function newId(): string {
  return randomBytes(8).toString('base64url');
}

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}
