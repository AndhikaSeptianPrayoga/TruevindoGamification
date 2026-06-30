import { Plus, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { QuizMetadataForm } from '@/components/admin/QuizMetadataForm'
import { QuizQuestionEditorCard } from '@/components/admin/QuizQuestionEditorCard'
import { AppShell } from '@/components/common/AppShell'
import { useQuizEditorStore } from '@/stores/useQuizEditorStore'
import { getQuizDetail, saveQuizDetail } from '@/utils/api'

export default function QuizEditorPage() {
  const navigate = useNavigate()
  const { quizId } = useParams()
  const isNewDraft = useMemo(() => !quizId, [quizId])
  const {
    draft,
    isDirty,
    isSaving,
    lastSavedAt,
    setDraft,
    setTitle,
    setDescription,
    setStatus,
    addQuestion,
    removeQuestion,
    updateQuestionText,
    updateQuestionImageUrl,
    updateQuestionDuration,
    updateQuestionOption,
    updateQuestionCorrectOption,
    markSaving,
    markSaved,
  } = useQuizEditorStore()
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setNotice('')
    setIsLoading(true)

    async function loadDraft() {
      try {
        if (isNewDraft) {
          navigate('/admin/quizzes', { replace: true })
          return
        } else if (quizId) {
          const quiz = await getQuizDetail(quizId)
          setDraft(quiz)
        }
      } catch {
        setDraft(null)
        setNotice('The quiz draft could not be loaded yet.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadDraft()
  }, [isNewDraft, navigate, quizId, setDraft])

  async function handleSave() {
    if (!draft) {
      return
    }

    markSaving()
    try {
      const saved = await saveQuizDetail(draft.id, draft)
      markSaved(saved)
      setNotice('Quiz draft saved successfully.')
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : 'Failed to save the quiz draft.')
    }
  }

  return (
    <AppShell
      eyebrow="Quiz Builder"
      title="A quiz editor structured for 4 options and a per-question duration."
      description="The Quiz Builder can now edit metadata, add questions, set up 4 options, choose the correct answer, and save the draft to the backend."
      aside={<AdminSidebar />}
    >
      {isLoading && !isNewDraft ? (
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-sm uppercase tracking-[0.25em] text-slate-300">
          Preparing the quiz builder...
        </div>
      ) : null}

      {!isLoading && !isNewDraft ? (
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <QuizMetadataForm
            title={draft?.title ?? ''}
            description={draft?.description ?? ''}
            status={draft?.status ?? 'draft'}
            questionCount={draft?.questionCount ?? 0}
            participantCount={draft?.participantCount ?? 0}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onStatusChange={setStatus}
          />

          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Draft Status</p>
                <p className="mt-2 text-sm text-slate-300">
                  {notice || (isDirty ? 'You have unsaved changes.' : 'Draft is in sync with the backend.')}
                </p>
                {lastSavedAt ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Last save {new Date(lastSavedAt).toLocaleTimeString('en-US')}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={!draft || isSaving}
                className="flex items-center gap-3 rounded-3xl bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Question Builder</p>
              <p className="mt-2 text-sm text-slate-300">
                Each question supports 4 options, its own duration, and a correct-answer selection.
              </p>
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-3 rounded-3xl border border-white/10 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {draft?.questions.map((question) => (
              <QuizQuestionEditorCard
                key={question.id}
                question={question}
                canRemove={(draft?.questions.length ?? 0) > 1}
                onQuestionTextChange={updateQuestionText}
                onQuestionImageUrlChange={updateQuestionImageUrl}
                onDurationChange={updateQuestionDuration}
                onOptionChange={updateQuestionOption}
                onCorrectOptionChange={updateQuestionCorrectOption}
                onRemove={removeQuestion}
              />
            ))}
          </div>
        </section>
      </div>
      ) : null}
    </AppShell>
  )
}
