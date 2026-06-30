import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { QuizLibraryCard } from '@/components/admin/QuizLibraryCard'
import { AppShell } from '@/components/common/AppShell'
import { useHostStore } from '@/stores/useHostStore'
import type { QuizSummary } from '@shared/types/game'
import { createQuizDraft, deleteQuiz, duplicateQuiz, getQuizzes, updateQuizStatus } from '@/utils/api'

export default function QuizListPage() {
  const navigate = useNavigate()
  const { quizzes, setQuizzes } = useHostStore()
  const [notice, setNotice] = useState('')
  const [busyQuizId, setBusyQuizId] = useState<string | null>(null)
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)

  useEffect(() => {
    getQuizzes().then(setQuizzes).catch(() => undefined)
  }, [setQuizzes])

  async function refreshList(message?: string) {
    const nextQuizzes = await getQuizzes()
    setQuizzes(nextQuizzes)
    if (message) {
      setNotice(message)
    }
  }

  async function handlePublishToggle(quiz: QuizSummary) {
    try {
      setBusyQuizId(quiz.id)
      const nextStatus = quiz.status === 'published' ? 'draft' : 'published'
      await updateQuizStatus(quiz.id, nextStatus)
      await refreshList(
        nextStatus === 'published'
          ? 'Quiz successfully published to the live library.'
          : 'Quiz returned to draft status.',
      )
    } catch (actionError) {
      setNotice(actionError instanceof Error ? actionError.message : 'Failed to change the quiz status.')
    } finally {
      setBusyQuizId(null)
    }
  }

  async function handleDuplicate(quiz: QuizSummary) {
    try {
      setBusyQuizId(quiz.id)
      await duplicateQuiz(quiz.id)
      await refreshList('Quiz successfully duplicated into a new draft.')
    } catch (actionError) {
      setNotice(actionError instanceof Error ? actionError.message : 'Failed to duplicate the quiz.')
    } finally {
      setBusyQuizId(null)
    }
  }

  async function handleDelete(quiz: QuizSummary) {
    try {
      setBusyQuizId(quiz.id)
      await deleteQuiz(quiz.id)
      await refreshList('Quiz successfully removed from the library.')
    } catch (actionError) {
      setNotice(actionError instanceof Error ? actionError.message : 'Failed to delete the quiz.')
    } finally {
      setBusyQuizId(null)
    }
  }

  async function handleCreateQuiz() {
    try {
      setIsCreatingDraft(true)
      const created = await createQuizDraft()
      await refreshList('New quiz draft successfully created from the Quiz Library.')
      navigate(`/admin/quizzes/${created.id}/edit`)
    } catch (actionError) {
      setNotice(actionError instanceof Error ? actionError.message : 'Failed to create a new quiz draft.')
    } finally {
      setIsCreatingDraft(false)
    }
  }

  return (
    <AppShell
      eyebrow="Admin Dashboard"
      title="Quiz library for corporate events and internal activations."
      description="The Quiz Library now supports operational actions to publish, duplicate, delete, and host — bringing the dashboard closer to a real control room."
      aside={<AdminSidebar />}
    >
      {notice ? (
        <div className="mb-4 rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
          {notice}
        </div>
      ) : null}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => void handleCreateQuiz()}
          disabled={isCreatingDraft}
          className="flex items-center gap-3 rounded-[24px] bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>{isCreatingDraft ? 'Preparing Draft...' : 'Create New Quiz'}</span>
        </button>
      </div>
      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <QuizLibraryCard
            key={quiz.id}
            quiz={quiz}
            isBusy={busyQuizId === quiz.id}
            onPublishToggle={handlePublishToggle}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </AppShell>
  )
}
