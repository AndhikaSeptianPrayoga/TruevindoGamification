import { Copy, Edit3, Play, Send, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { QuizSummary } from '@shared/types/game'

interface QuizLibraryCardProps {
  quiz: QuizSummary
  isBusy?: boolean
  onPublishToggle: (quiz: QuizSummary) => void
  onDuplicate: (quiz: QuizSummary) => void
  onDelete: (quiz: QuizSummary) => void
}

export function QuizLibraryCard({
  quiz,
  isBusy,
  onPublishToggle,
  onDuplicate,
  onDelete,
}: QuizLibraryCardProps) {
  const isPublished = quiz.status === 'published'

  return (
    <div className="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 lg:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
            {quiz.status}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {quiz.questionCount} questions
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Updated {new Date(quiz.updatedAt).toLocaleTimeString('en-US')}
          </span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-semibold text-white">{quiz.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{quiz.description}</p>
      </div>

      <div className="grid gap-3 lg:w-56">
        <Link
          to={`/admin/quizzes/${quiz.id}/edit`}
          className="flex items-center justify-center gap-2 rounded-[24px] border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Quiz</span>
        </Link>

        <Link
          to={`/admin/sessions/new/lobby?quizId=${quiz.id}`}
          className="flex items-center justify-center gap-2 rounded-[24px] bg-white px-4 py-3 text-center text-sm font-semibold text-ink transition hover:bg-slate-100"
        >
          <Play className="h-4 w-4" />
          <span>Host Session</span>
        </Link>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => onPublishToggle(quiz)}
          className="flex items-center justify-center gap-2 rounded-[24px] border border-accent/30 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => onDuplicate(quiz)}
          className="flex items-center justify-center gap-2 rounded-[24px] border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Copy className="h-4 w-4" />
          <span>Duplicate</span>
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => onDelete(quiz)}
          className="flex items-center justify-center gap-2 rounded-[24px] border border-red-400/20 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )
}
