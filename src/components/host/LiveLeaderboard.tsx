import type { ParticipantStanding } from '@shared/types/game'
import { formatScore } from '@/utils/score'

interface LiveLeaderboardProps {
  participants: ParticipantStanding[]
}

export function LiveLeaderboard({ participants }: LiveLeaderboardProps) {
  return (
    <div className="panel-elevated p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="kicker">Leaderboard</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-slate-950">Top Performers</h3>
        </div>
        <span className="pill-tag">
          Live Ranking
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {participants.slice(0, 5).map((participant) => (
          <div
            key={participant.id}
            className="list-item-soft flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 font-display text-sm font-semibold text-white">
                #{participant.rank}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950">{participant.displayName}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Streak {participant.streak}
                </p>
              </div>
            </div>
            <p className="font-display text-lg font-semibold text-slate-950">
              {formatScore(participant.score)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
