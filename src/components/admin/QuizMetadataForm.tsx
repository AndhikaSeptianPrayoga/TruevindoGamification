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
    <section className="panel-elevated p-6">
      <p className="kicker">Quiz Metadata</p>
      <div className="mt-5 grid gap-5">
        <div>
          <label htmlFor="quiz-title" className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-700">
            Quiz Title
          </label>
          <input
            id="quiz-title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="brand-input"
            placeholder="e.g. DIGICON 2026 Corporate Challenge"
          />
        </div>

        <div>
          <label htmlFor="quiz-description" className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-700">
            Description
          </label>
          <textarea
            id="quiz-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={5}
            className="brand-input"
            placeholder="Describe the event context, target audience, and quiz goal."
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-700">
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
                    ? 'border-signal/20 bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Total Questions</p>
            <p className="mt-2 font-display text-2xl font-semibold text-slate-950">{questionCount}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Participant History</p>
            <p className="mt-2 font-display text-2xl font-semibold text-slate-950">{participantCount}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
