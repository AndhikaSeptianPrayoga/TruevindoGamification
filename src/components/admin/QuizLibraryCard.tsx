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
    <div className="panel-elevated grid gap-4 p-6 lg:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="pill-tag">
            {quiz.status}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-600">
            {quiz.questionCount} questions
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Updated {new Date(quiz.updatedAt).toLocaleTimeString('en-US')}
          </span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-semibold text-slate-950">{quiz.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{quiz.description}</p>
      </div>

      <div className="grid gap-3 lg:w-56">
        <Link
          to={`/admin/quizzes/${quiz.id}/edit`}
          className="brand-button-secondary"
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Quiz</span>
        </Link>

        <Link
          to={`/admin/sessions/new/lobby?quizId=${quiz.id}`}
          className="brand-button-primary"
        >
          <Play className="h-4 w-4" />
          <span>Host Session</span>
        </Link>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => onPublishToggle(quiz)}
          className="brand-button-ghost disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => onDuplicate(quiz)}
          className="brand-button-ghost disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Copy className="h-4 w-4" />
          <span>Duplicate</span>
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => onDelete(quiz)}
          className="brand-button-danger disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )
}
