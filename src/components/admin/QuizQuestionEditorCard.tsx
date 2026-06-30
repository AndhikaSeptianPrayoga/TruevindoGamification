import { Link2, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AnswerOption, QuizQuestion } from '@shared/types/game'

interface QuizQuestionEditorCardProps {
  question: QuizQuestion
  canRemove: boolean
  onQuestionTextChange: (questionId: string, value: string) => void
  onQuestionImageUrlChange: (questionId: string, value: string) => void
  onDurationChange: (questionId: string, value: number) => void
  onOptionChange: (questionId: string, option: AnswerOption, value: string) => void
  onCorrectOptionChange: (questionId: string, option: AnswerOption) => void
  onRemove: (questionId: string) => void
}

export function QuizQuestionEditorCard({
  question,
  canRemove,
  onQuestionTextChange,
  onQuestionImageUrlChange,
  onDurationChange,
  onOptionChange,
  onCorrectOptionChange,
  onRemove,
}: QuizQuestionEditorCardProps) {
  const [imageInputMode, setImageInputMode] = useState<'link' | 'upload'>(
    question.imageUrl?.startsWith('data:') ? 'upload' : 'link',
  )
  const [imageNotice, setImageNotice] = useState('')

  useEffect(() => {
    setImageInputMode(question.imageUrl?.startsWith('data:') ? 'upload' : 'link')
  }, [question.imageUrl])

  async function handleImageUpload(file?: File | null) {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setImageNotice('The file must be an image.')
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setImageNotice('The image must be at most 4 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onQuestionImageUrlChange(question.id, reader.result)
        setImageNotice(`Upload ready: ${file.name}`)
      }
    }
    reader.onerror = () => {
      setImageNotice('Failed to read the image file.')
    }
    reader.readAsDataURL(file)
  }

  function handleClearImage() {
    onQuestionImageUrlChange(question.id, '')
    setImageNotice('')
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-black/15 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold text-white">Question {question.orderNo}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
            Corporate Multiple Choice
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Duration</span>
            <input
              type="number"
              min={5}
              value={question.durationSeconds}
              onChange={(event) => onDurationChange(question.id, Number(event.target.value))}
              className="w-20 bg-transparent text-right text-sm font-semibold text-white outline-none"
            />
          </div>
          <button
            type="button"
            disabled={!canRemove}
            onClick={() => onRemove(question.id)}
            className="rounded-2xl border border-white/10 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
          Question
        </label>
        <textarea
          value={question.text}
          rows={3}
          onChange={(event) => onQuestionTextChange(question.id, event.target.value)}
          className="w-full rounded-3xl border border-white/10 bg-ink/80 px-5 py-4 text-white outline-none transition focus:border-accent"
          placeholder="Write the question for participants."
        />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
          Inline Image
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setImageInputMode('link')
              setImageNotice('')
            }}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              imageInputMode === 'link'
                ? 'bg-white text-ink'
                : 'border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Link2 className="h-4 w-4" />
            <span>Link</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setImageInputMode('upload')
              setImageNotice('')
            }}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              imageInputMode === 'upload'
                ? 'bg-white text-ink'
                : 'border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </button>
          {question.imageUrl ? (
            <button
              type="button"
              onClick={handleClearImage}
              className="flex items-center gap-2 rounded-full border border-red-400/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-100 transition hover:bg-red-500/10"
            >
              <X className="h-4 w-4" />
              <span>Remove</span>
            </button>
          ) : null}
        </div>

        {imageInputMode === 'link' ? (
          <input
            type="url"
            value={question.imageUrl ?? ''}
            onChange={(event) => onQuestionImageUrlChange(question.id, event.target.value)}
            className="mt-4 w-full rounded-3xl border border-white/10 bg-ink/80 px-5 py-4 text-sm text-white outline-none transition focus:border-accent"
            placeholder="Paste an image URL for this question."
          />
        ) : (
          <div className="mt-4 rounded-[28px] border border-dashed border-white/10 bg-ink/40 p-5">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-5 py-8 text-center transition hover:bg-white/10">
              <Upload className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">Choose an image from your device</span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                JPG, PNG, WEBP up to 4 MB
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}

        {imageNotice ? (
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">{imageNotice}</p>
        ) : null}
        {question.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-ink/60">
            <img
              src={question.imageUrl}
              alt={`Question ${question.orderNo} preview`}
              className="h-56 w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(Object.entries(question.options) as [AnswerOption, string][]).map(([option, value]) => {
          const active = question.correctOption === option

          return (
            <div
              key={option}
              className={`rounded-3xl border p-4 transition ${
                active ? 'border-accent/40 bg-accent/10' : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-lg font-semibold text-white">{option}</p>
                <button
                  type="button"
                  onClick={() => onCorrectOptionChange(question.id, option)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    active
                      ? 'bg-white text-ink'
                      : 'border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {active ? 'Correct' : 'Set Key'}
                </button>
              </div>
              <textarea
                value={value}
                rows={3}
                onChange={(event) => onOptionChange(question.id, option, event.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-ink/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
                placeholder={`Fill in option ${option}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
