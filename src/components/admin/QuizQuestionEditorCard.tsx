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
      setImageNotice('The selected file must be an image.')
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

  const durationInputId = `question-duration-${question.id}`
  const textInputId = `question-text-${question.id}`
  const imageUrlInputId = `question-image-url-${question.id}`

  return (
    <div className="panel-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold text-slate-950">Question {question.orderNo}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-600">
            Corporate Multiple Choice
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <label htmlFor={durationInputId} className="text-xs uppercase tracking-[0.2em] text-slate-700">
              Duration
            </label>
            <input
              id={durationInputId}
              type="number"
              min={5}
              value={question.durationSeconds}
              onChange={(event) => onDurationChange(question.id, Number(event.target.value))}
              className="w-20 bg-transparent text-right text-sm font-semibold text-slate-950 outline-none"
            />
          </div>
          <button
            type="button"
            disabled={!canRemove}
            onClick={() => onRemove(question.id)}
            className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={textInputId} className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-700">
          Question
        </label>
        <textarea
          id={textInputId}
          value={question.text}
          rows={3}
          onChange={(event) => onQuestionTextChange(question.id, event.target.value)}
          className="brand-input"
          placeholder="Write the question shown to participants."
        />
      </div>

      <div className="mt-5">
        <label htmlFor={imageUrlInputId} className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-700">
          Supporting Image
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
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </button>
          {question.imageUrl ? (
            <button
              type="button"
              onClick={handleClearImage}
              className="status-chip-danger flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-red-100"
            >
              <X className="h-4 w-4" />
              <span>Remove</span>
            </button>
          ) : null}
        </div>

        {imageInputMode === 'link' ? (
          <input
            id={imageUrlInputId}
            type="url"
            value={question.imageUrl ?? ''}
            onChange={(event) => onQuestionImageUrlChange(question.id, event.target.value)}
            className="brand-input mt-4 text-sm"
            placeholder="Paste an image URL for this question."
          />
        ) : (
          <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-5">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-slate-200 bg-white px-5 py-8 text-center transition hover:border-slate-300 hover:bg-slate-50">
              <Upload className="h-5 w-5 text-slate-900" />
              <span className="text-sm font-semibold text-slate-950">Choose an image from your device</span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">
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
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-700">{imageNotice}</p>
        ) : null}
        {question.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
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
                active
                  ? 'border-emerald-300 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white shadow-[0_22px_52px_rgba(5,150,105,0.22)]'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={`font-display text-lg font-semibold ${active ? 'text-white' : 'text-slate-950'}`}>
                  {option}
                </p>
                <button
                  type="button"
                  onClick={() => onCorrectOptionChange(question.id, option)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]'
                      : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {active ? 'Correct' : 'Set Key'}
                </button>
              </div>
              <textarea
                value={value}
                rows={3}
                onChange={(event) => onOptionChange(question.id, option, event.target.value)}
                className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                  active
                    ? 'border-emerald-100/90 bg-white/96 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] placeholder:text-slate-500'
                    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'
                }`}
                placeholder={`Fill in option ${option}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
