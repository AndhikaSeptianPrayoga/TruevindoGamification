import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { AnswerOption } from '@shared/types/game'
import { AppShell } from '@/components/common/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { AnswerOptionCard } from '@/components/participant/AnswerOptionCard'
import { useCountdown } from '@/hooks/useCountdown'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useParticipantStore } from '@/stores/useParticipantStore'
import { getPlayerState } from '@/utils/api'
import { formatRemainingTime } from '@/utils/format'
import { sound } from '@/utils/sound'

export default function PlayPage() {
  const navigate = useNavigate()
  const { sessionId = 'session-truevindo-001' } = useParams()
  const {
    participantId,
    sessionState,
    selectedOption,
    setLatestResult,
    setSelectedOption,
    setSessionState,
  } = useParticipantStore()

  const activeQuestion = sessionState?.activeQuestion
  const countdown = useCountdown(activeQuestion?.deadlineAt ?? null, activeQuestion?.durationSeconds ?? 20)
  const lastTickRef = useRef<number>(Number.POSITIVE_INFINITY)

  const { submitAnswer } = useSessionSocket({
    sessionId,
    onState: setSessionState,
    onQuestionResult: (state) => {
      setSessionState(state)
      navigate(`/result/${sessionId}`)
    },
  })

  useEffect(() => {
    if (!sessionState) {
      getPlayerState(sessionId)
        .then(setSessionState)
        .catch(() => undefined)
    }
  }, [sessionId, sessionState, setSessionState])

  // Reset selection and play a "new question" cue whenever the question changes.
  useEffect(() => {
    setSelectedOption(null)
    lastTickRef.current = Number.POSITIVE_INFINITY
    if (activeQuestion?.questionId) {
      sound.whoosh()
    }
  }, [activeQuestion?.questionId, setSelectedOption])

  // Gentle tick during the final five seconds to build tension.
  useEffect(() => {
    if (selectedOption) {
      return
    }
    const secondsLeft = Math.ceil(countdown.remainingMs / 1000)
    if (secondsLeft > 0 && secondsLeft <= 5 && secondsLeft < lastTickRef.current) {
      lastTickRef.current = secondsLeft
      sound.tick()
    }
  }, [countdown.remainingMs, selectedOption])

  if (!sessionState || !activeQuestion) {
    return (
      <AppShell
        eyebrow="Gameplay"
        title="Belum ada pertanyaan yang aktif."
        description="Buka sesi live dari layar host terlebih dulu, lalu peserta akan masuk otomatis saat pertanyaan dimulai."
      >
        <Link to="/" className="text-sm text-slate-700 underline underline-offset-4">
          Back to join screen
        </Link>
      </AppShell>
    )
  }

  async function handleSubmit(option: AnswerOption) {
    sound.select()
    setSelectedOption(option)
    if (participantId && activeQuestion) {
      // Measure the real response time from when the question went live so the
      // server can award more points for faster answers.
      const durationMs = Math.max(activeQuestion.durationSeconds ?? 20, 1) * 1000
      const questionStart = new Date(activeQuestion.deadlineAt).getTime() - durationMs
      const responseTimeMs = Math.min(Math.max(Date.now() - questionStart, 0), durationMs)

      const response = await submitAnswer({
        sessionId,
        participantId,
        questionId: activeQuestion.questionId,
        selectedOption: option,
        responseTimeMs,
      })

      setSessionState(response.sessionState)
      if (response.participantResult) {
        setLatestResult(response.participantResult)
      }
      navigate(`/result/${sessionId}`)
    }
  }

  return (
    <AppShell
      eyebrow="Live Question"
      title={activeQuestion.text}
      description="Pilih satu jawaban sebelum countdown berakhir. Timer utama dikendalikan server agar semua perangkat tetap sinkron."
      aside={
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Time" value={formatRemainingTime(countdown.remainingMs)} />
          <StatCard
            label="Question"
            value={`${activeQuestion.questionNumber}/${activeQuestion.totalQuestions}`}
          />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.38fr]">
        <section className="space-y-4">
          {activeQuestion.imageUrl ? (
            <div className="panel-elevated overflow-hidden">
              <img
                src={activeQuestion.imageUrl}
                alt={activeQuestion.text}
                className="h-72 w-full object-cover"
              />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {(Object.entries(activeQuestion.options) as [AnswerOption, string][]).map(
              ([option, text]) => (
                <AnswerOptionCard
                  key={option}
                  option={option}
                  text={text}
                  selected={selectedOption === option}
                  disabled={Boolean(selectedOption)}
                  onClick={() => handleSubmit(option)}
                />
              ),
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="panel-elevated p-5">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Timer sync</span>
              <span>{countdown.progress}%</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-signal"
                style={{ width: `${countdown.progress}%` }}
              />
            </div>
          </div>

          <div className="panel-elevated p-5 text-sm leading-7 text-slate-600">
            <p>Participant ID: {participantId ?? 'guest-mode'}</p>
            <p>Respons disimpan secara lokal terlebih dulu sebelum server mengirim konfirmasi.</p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
