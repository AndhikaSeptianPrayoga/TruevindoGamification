import type { QuizStatus } from '@shared/types/game'

interface QuizMetadataFormProps {
  title: string
  description: string
  status: QuizStatus
  questionCount: number
  participantCount: number
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onStatusChange: (value: QuizStatus) => void
}

const statuses: QuizStatus[] = ['draft', 'published', 'archived']

export function QuizMetadataForm({
  title,
  description,
  status,
  questionCount,
  participantCount,
  onTitleChange,
  onDescriptionChange,
  onStatusChange,
}: QuizMetadataFormProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Quiz Metadata</p>
      <div className="mt-5 grid gap-5">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
            Quiz Title
          </label>
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-ink/80 px-5 py-4 text-white outline-none transition focus:border-accent"
            placeholder="e.g. Annual Townhall Challenge"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={5}
            className="w-full rounded-3xl border border-white/10 bg-ink/80 px-5 py-4 text-white outline-none transition focus:border-accent"
            placeholder="Describe the event context, audience, and quiz goal."
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
            Status
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {statuses.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onStatusChange(item)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold capitalize transition ${
                  item === status
                    ? 'border-accent/40 bg-accent/10 text-white'
                    : 'border-white/10 bg-black/15 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Questions</p>
            <p className="mt-2 font-display text-2xl font-semibold text-white">{questionCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Participant History</p>
            <p className="mt-2 font-display text-2xl font-semibold text-white">{participantCount}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
