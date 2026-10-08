import type { GameView, PlayerView } from '../../shared/types';
import { Icon } from '../components/Icon';
import { AnswerBadge, Avatar, IdentityArt } from '../components/ui';
import { currentQuestion } from '../lib/game';

interface SeatProps {
  view: GameView;
  player: PlayerView;
  secretsHidden: boolean;
  big?: boolean;
  style?: React.CSSProperties;
}

/** One player at the table: who they are, whether it's their turn, and their (maybe secret) card. */
export function Seat({ view, player, secretsHidden, big, style }: SeatProps) {
  const isMe = player.id === view.you.id;
  const isActive = view.turn?.playerId === player.id;
  const question = currentQuestion(view);
  const answer = question && view.turn?.phase !== 'asking' ? question.answers[player.id] : undefined;
  const showAnswerValue = question?.closed;
  // Solved cards are public; everything else respects the "hide secrets" switch.
  const identity = player.solved || !secretsHidden ? player.identity : null;

  const state = !player.connected ? 'offline' : isActive ? 'active' : player.solved ? 'solved' : 'idle';

  return (
    <article className={`seat ${big ? 'seat--big' : ''}`} data-state={state} data-me={isMe} style={style}>
      {isActive && player.connected && (
        <span className="seat__turn">
          <Icon name="target" size={12} /> {isMe ? 'Your turn' : 'Turn'}
        </span>
      )}
      <div className="seat__avatar">
        <Avatar index={player.avatar} name={player.name} size={big ? 96 : 60} />
        {player.solved && (
          <span className="seat__badge seat__badge--solved" title="Knows who they are">
            <Icon name="check" size={14} />
            <span className="sr-only">Guessed correctly</span>
          </span>
        )}
        {answer && (
          <span className="seat__answer">
            {showAnswerValue ? <AnswerBadge value={answer} compact /> : <span className="seat__dot" title="Answered" />}
          </span>
        )}
      </div>
      <div className="seat__info">
        <strong className="seat__name">
          {player.name}
          {isMe && <span className="seat__you"> (you)</span>}
        </strong>
        <span className="seat__score">
          {!player.connected ? (
            <>
              <Icon name="wifiOff" size={13} /> Offline
            </>
          ) : (
            `${player.score} pts`
          )}
        </span>
      </div>
      <div className={`seat__card ${identity ? '' : 'seat__card--hidden'}`}>
        {identity ? (
          <>
            <IdentityArt image={identity.image} />
            <span>{identity.name}</span>
          </>
        ) : (
          <>
            <span className="seat__q" aria-hidden="true">?</span>
            <span>{isMe ? 'Who am I?' : 'Secret'}</span>
          </>
        )}
      </div>
    </article>
  );
}
