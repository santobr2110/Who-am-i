import { DIFFICULTY_LABEL, LEVEL_RULES, TIMER_OPTIONS } from '../../shared/config/levels';
import { PACKS } from '../../shared/content';
import { eligibleIdentities } from '../../shared/engine/engine';
import { LEVELS, type Difficulty, type GameConfig } from '../../shared/types';
import { Pill, Segmented, Stepper, Toggle } from '../components/ui';

/** The teacher's game setup. Every change is sent straight to the room, so students see it live. */
export function Settings({ config, onChange }: { config: GameConfig; onChange: (patch: Partial<GameConfig>) => void }) {
  const togglePack = (id: string) => {
    const next = config.packIds.includes(id) ? config.packIds.filter((p) => p !== id) : [...config.packIds, id];
    if (next.length) onChange({ packIds: next });
  };
  const pool = eligibleIdentities(config).length;

  return (
    <div className="settings">
      <fieldset className="settings__group">
        <legend>English level</legend>
        <Segmented
          label="English level"
          value={config.level}
          options={LEVELS.map((l) => ({ value: l, label: l }))}
          onChange={(level) => onChange({ level })}
        />
        <p className="hint">{LEVEL_RULES[config.level].blurb}</p>
      </fieldset>

      <fieldset className="settings__group">
        <legend>Identity packs</legend>
        <div className="packs">
          {PACKS.map((pack) => {
            const on = config.packIds.includes(pack.id);
            return (
              <button
                key={pack.id}
                type="button"
                className="pack"
                aria-pressed={on}
                onClick={() => togglePack(pack.id)}
                title={pack.description}
              >
                <span className="pack__emoji" aria-hidden="true">{pack.emoji}</span>
                <span className="pack__name">{pack.name}</span>
                <span className="pack__count">{pack.identities.length} cards</span>
              </button>
            );
          })}
        </div>
        <p className="hint">
          {pool} cards fit this level and difficulty.
          {pool < config.maxPlayers && ' Harder cards will fill the gap.'}
        </p>
      </fieldset>

      <fieldset className="settings__group">
        <legend>Difficulty</legend>
        <Segmented<Difficulty>
          label="Difficulty"
          value={config.difficulty}
          options={[
            { value: 'easy', label: 'Easy' },
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Hard' },
          ]}
          onChange={(difficulty) => onChange({ difficulty })}
        />
        <p className="hint">{DIFFICULTY_LABEL[config.difficulty]}</p>
      </fieldset>

      <fieldset className="settings__group">
        <legend>Timer</legend>
        <Segmented<number | null>
          label="Timer"
          value={config.timerMinutes}
          options={TIMER_OPTIONS.map((m) => ({ value: m, label: m ? `${m} min` : 'No limit' }))}
          onChange={(timerMinutes) => onChange({ timerMinutes })}
        />
      </fieldset>

      <div className="settings__row">
        <fieldset className="settings__group">
          <legend>Players</legend>
          <Stepper label="players" value={config.maxPlayers} min={2} max={8} onChange={(maxPlayers) => onChange({ maxPlayers })} />
        </fieldset>
        <fieldset className="settings__group">
          <legend>Questions per turn</legend>
          <Stepper label="questions per turn" value={config.questionsPerTurn} min={1} max={3} onChange={(questionsPerTurn) => onChange({ questionsPerTurn })} />
        </fieldset>
      </div>

      <div className="settings__toggles">
        <Toggle
          checked={config.hostPlays}
          onChange={(hostPlays) => onChange({ hostPlays })}
          label="I'm playing too"
          hint="Take a seat at the table — perfect for one-to-one classes."
        />
        <Toggle
          checked={config.allowNotSure}
          onChange={(allowNotSure) => onChange({ allowNotSure })}
          label='Allow "Not sure"'
          hint="A third answer for when nobody really knows."
        />
        <Toggle
          checked={config.englishBonus}
          onChange={(englishBonus) => onChange({ englishBonus })}
          label="English bonus"
          hint="A few extra points for well-formed English questions."
        />
      </div>
    </div>
  );
}

/** Read-only summary of the same settings, for students. */
export function SettingsSummary({ config }: { config: GameConfig }) {
  return (
    <div className="chips">
      <Pill tone="navy">{config.level}</Pill>
      {PACKS.filter((p) => config.packIds.includes(p.id)).map((p) => (
        <Pill key={p.id}>
          {p.emoji} {p.name}
        </Pill>
      ))}
      <Pill icon="clock">{config.timerMinutes ? `${config.timerMinutes} min` : 'No time limit'}</Pill>
    </div>
  );
}
