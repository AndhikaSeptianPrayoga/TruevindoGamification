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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getQuizzes()
      .then(setQuizzes)
      .catch(() => undefined)
      .finally(() => setIsLoading(false))
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
      title="A premium quiz library built as a clear and reliable control room for corporate events."
      description="From here, the admin can prepare drafts, publish quizzes, duplicate content, and launch live sessions through a clearer and more production-ready control room experience."
      aside={<AdminSidebar />}
    >
      {notice ? (
        <div className="panel-elevated mb-4 px-5 py-4 text-sm text-slate-700">
          {notice}
        </div>
      ) : null}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => void handleCreateQuiz()}
          disabled={isCreatingDraft}
          className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>{isCreatingDraft ? 'Preparing Draft...' : 'Create New Quiz'}</span>
        </button>
      </div>
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="panel-elevated animate-pulse p-6">
              <div className="h-4 w-32 rounded-full bg-slate-200" />
              <div className="mt-5 h-10 w-2/3 rounded-2xl bg-slate-200" />
              <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
              <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-100" />
              <div className="mt-6 grid gap-3 lg:w-56">
                <div className="h-12 rounded-[24px] bg-slate-100" />
                <div className="h-12 rounded-[24px] bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}
    </AppShell>
  )
}
