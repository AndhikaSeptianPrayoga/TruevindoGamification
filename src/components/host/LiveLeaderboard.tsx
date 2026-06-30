import type { ParticipantStanding } from '@shared/types/game'
import { formatScore } from '@/utils/score'

interface LiveLeaderboardProps {
  participants: ParticipantStanding[]
}

export function LiveLeaderboard({ participants }: LiveLeaderboardProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Leaderboard</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-white">Top Performers</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          Live Ranking
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {participants.slice(0, 5).map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 font-display text-sm font-semibold text-white">
                #{participant.rank}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{participant.displayName}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Streak {participant.streak}
                </p>
              </div>
            </div>
            <p className="font-display text-lg font-semibold text-white">
              {formatScore(participant.score)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
