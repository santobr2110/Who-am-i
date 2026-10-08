# WHO AM I? — Four Bridges

A multiplayer party game for English classes. Every player gets a secret identity that everyone can see **except them**; they find out who they are by asking the table yes-or-no questions in English.

Built for remote classes: each person plays from their own device, usually next to a video call.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5180, choose **I'm the teacher**, and send the invite link to the students.

To try a full table by yourself, create a game and fill it with bots:

```bash
npm run bots -- ABCD 7
```

Other commands: `npm test` (game rules), `npm run typecheck`, `npm run build` then `npm start` (production, one process, one port — set `PORT` to change it).

## Deploy (Render)

The game needs one always-on Node process (it holds live WebSocket connections and the rooms in memory), so it runs on Render rather than on a serverless host. `render.yaml` describes the service.

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, pick the repository, confirm.
3. Render builds and gives you a `https://….onrender.com` address — that is the link teachers open.

Every push to `main` redeploys. On the free plan the service sleeps after about 15 minutes without visitors and takes up to a minute to wake; games in progress are lost on a redeploy or restart.

## How a game goes

1. **Lobby** — the teacher picks level, packs, difficulty and timer; students join by link or 4-letter code and tap *I'm ready*.
2. **Deal** — everyone gets a card. You see the others' cards, never your own.
3. **Turns** — the active player asks a question (typed, and said out loud), the others tap YES / NO / NOT SURE, the table sees the tally. Then: ask again, guess, or pass.
4. **Guess** — right: celebration and points. Wrong: "Not quite!", no penalty, the turn moves on.
5. **Round end** — all cards are revealed. The teacher starts another round or finishes the game.
6. **Podium** — winner, playful awards, "What did you practice?".

With one student, the teacher's start button becomes **Play with {name}** and the teacher takes the second seat.

## Remote-play behaviour

- The server never sends a browser its own unsolved identity, so it can't be found in devtools.
- A reload or a dropped connection keeps your seat. Lost the tab? Join again with the same name.
- A player who goes offline never blocks the table: answers stop waiting for them and their turn passes after 20 seconds.
- Answers close by themselves after 45 seconds.
- An eye button hides every secret card before you share your screen; the teacher's board starts with them hidden.
- `/?room=CODE&view=board` is a read-only board with no secrets, for a projector or a shared screen.
- The teacher's address (`&host=…`) is their key — bookmarking it is enough to get back in as teacher.

## Where things live

| Path | What |
|---|---|
| `shared/types.ts` | Domain model: identities, config, game state, actions, views, wire protocol |
| `shared/engine/` | Pure game rules (`applyAction`), guess matching, per-viewer views. No I/O, fully unit-tested |
| `shared/config/` | Scoring, level rules, modes, defaults — the numbers you may want to tune |
| `shared/content/` | Identity packs and suggested questions. Content only, no logic |
| `server/` | HTTP + WebSocket server and the in-memory room manager |
| `src/` | React client: `screens/`, `game/` (table, stage, teacher panel), `components/`, `styles/` |
| `src/brand/assets.ts` | The one place that references Four Bridges brand files |
| `public/brand/mascots/` | Optimised mascot images served by the app; full-size originals are in `brand-source/` |
| `DESIGN_SYSTEM.md` | The visual system, derived from fourbridges.com.br. Live version at `/?styleguide` |

### Add an identity pack

Create `shared/content/packs/sports.ts` using `definePack` (one row per identity: id, name, emoji, minimum level, difficulty, description, three clues, tags, accepted spellings) and add it to the list in `shared/content/index.ts`. It shows up in the teacher's setup automatically. An identity image can be an emoji or a URL.

### Change the scoring

Edit `shared/config/scoring.ts`.

### Add a game mode

Register it in `MODES` (`shared/config/levels.ts`) and branch on `config.mode` in the engine's turn rules. Views, transport and UI shell are mode-agnostic.

### Ready for later

- **Audio** — `src/services/sound.ts` and `speech.ts` are small interfaces; today they use synthesized blips and the browser's voice.
- **AI** — `server/services/ai.ts` declares the extension points (question coach, English evaluator, identity generator, difficulty advisor). None is called yet.
- **Persistence** — rooms live in memory in `server/rooms.ts`; swap the `Map` for a database to survive restarts.
