import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { AnswerOption } from '@shared/types/game'
import { AppShell } from '@/components/common/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { AnswerOptionCard } from '@/components/participant/AnswerOptionCard'
import { CountdownOverlay } from '@/components/participant/CountdownOverlay'
import { useCountdown } from '@/hooks/useCountdown'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useParticipantStore } from '@/stores/useParticipantStore'
import { getPlayerState } from '@/utils/api'
import { formatRemainingTime } from '@/utils/format'
import { deriveParticipantResult } from '@/utils/result'
import { formatScore } from '@/utils/score'
import { sound } from '@/utils/sound'

export default function PlayPage() {
  const navigate = useNavigate()
  const { sessionId = 'session-truevindo-001' } = useParams()
  const {
    participantId,
    sessionState,
    selectedOption,
    setLatestResult,
    setLastAnswer,
    setSelectedOption,
    setSessionState,
  } = useParticipantStore()

  const status = sessionState?.status
  const activeQuestion = sessionState?.activeQuestion
  const countdown = useCountdown(activeQuestion?.deadlineAt ?? null, activeQuestion?.durationSeconds ?? 20)
  const lastTickRef = useRef<number>(Number.POSITIVE_INFINITY)
  const submittingRef = useRef(false)
  const secondsLeft = Math.max(0, Math.ceil(countdown.remainingMs / 1000))
  const me = useMemo(
    () => sessionState?.leaderboard.find((participant) => participant.id === participantId) ?? null,
    [participantId, sessionState],
  )

  const { submitAnswer } = useSessionSocket({
    sessionId,
    onState: setSessionState,
    onQuestionResult: (state) => {
      setSessionState(state)
      // Rebuild the result straight from this authoritative reveal broadcast so
      // it is never lost to the answer-ack race. Read the freshest answer from
      // the store to avoid a stale closure.
      const { lastAnswer, participantId: pid } = useParticipantStore.getState()
      const derived = deriveParticipantResult(state, lastAnswer, pid)
      if (derived) {
        setLatestResult(derived)
      }
      // Don't navigate away mid-submit: handleSubmit will navigate once it has
      // the participant result. Navigating here would unmount + disconnect the
      // socket before the answer acknowledgement arrives.
      if (submittingRef.current) {
        return
      }
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

  // Reset per-question state ONLY when a genuinely new question goes live.
  // Crucially, do NOT reset when the question ends (activeQuestion becomes null
  // in the result phase) — that would wipe the result/answer we just captured.
  useEffect(() => {
    if (!activeQuestion?.questionId) {
      return
    }
    setSelectedOption(null)
    setLatestResult(null)
    setLastAnswer(null)
    lastTickRef.current = Number.POSITIVE_INFINITY
    submittingRef.current = false
    sound.whoosh()
  }, [activeQuestion?.questionId, setLastAnswer, setLatestResult, setSelectedOption])

  // Gentle tick during the final five seconds to build tension.
  useEffect(() => {
    if (selectedOption) {
      return
    }
    const remaining = Math.ceil(countdown.remainingMs / 1000)
    if (remaining > 0 && remaining <= 5 && remaining < lastTickRef.current) {
      lastTickRef.current = remaining
      sound.tick()
    }
  }, [countdown.remainingMs, selectedOption])

  // Server-driven 3-2-1 standby before the first question — synchronized for
  // everyone, and the question timer only starts once it finishes.
  if (status === 'countdown') {
    return <CountdownOverlay />
  }

  // While a submit is in flight, the question may end (activeQuestion becomes
  // null). Show a brief "locked in" screen instead of the empty-state message.
  if (submittingRef.current && !activeQuestion) {
    return (
      <AppShell
        eyebrow="Answer Received"
        title="Answer locked in."
        description="Revealing your result…"
      >
        <div className="panel-elevated animate-pop-in mx-auto max-w-md p-8 text-center">
          <p className="font-display text-2xl font-semibold text-slate-950">Answer locked in ✓</p>
          <p className="mt-2 text-sm text-slate-600">Hang tight — revealing your result.</p>
        </div>
      </AppShell>
    )
  }

  if (!sessionState || !activeQuestion) {
    return (
      <AppShell
        eyebrow="Gameplay"
        title="No question is active yet."
        description="Open a live session from the host screen first, then participants move in automatically once the question begins."
      >
        <Link to="/" className="text-sm text-slate-700 underline underline-offset-4">
          Back to join screen
        </Link>
      </AppShell>
    )
  }

  async function handleSubmit(option: AnswerOption) {
    if (submittingRef.current || selectedOption) {
      return
    }
    submittingRef.current = true
    sound.select()
    sound.vibrate(25)
    setSelectedOption(option)

    if (participantId && activeQuestion) {
      // Record the answer locally so the result can be rebuilt even if the
      // server acknowledgement is ever lost (safety net for the result screen).
      setLastAnswer({
        questionId: activeQuestion.questionId,
        selectedOption: option,
        scoreBefore: me?.score ?? 0,
      })

      // Measure the real response time from when the question went live so the
      // server can award more points for faster answers.
      const durationMs = Math.max(activeQuestion.durationSeconds ?? 20, 1) * 1000
      const questionStart = new Date(activeQuestion.deadlineAt).getTime() - durationMs
      const responseTimeMs = Math.min(Math.max(Date.now() - questionStart, 0), durationMs)

      // Wait for the server acknowledgement (carries the participant result),
      // with a timeout fallback so we never get stuck if the ack is lost.
      const response = await Promise.race([
        submitAnswer({
          sessionId,
          participantId,
          questionId: activeQuestion.questionId,
          selectedOption: option,
          responseTimeMs,
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]).catch(() => null)

      // Prefer the ack's exact result when present, but never overwrite the
      // live session state here — incoming broadcasts (with the revealed answer)
      // are newer than the ack's snapshot.
      if (response?.participantResult) {
        setLatestResult(response.participantResult)
      }
      // Brief beat so the "locked in" confirmation and checkmark are visible.
      await new Promise((resolve) => setTimeout(resolve, 450))
    }

    navigate(`/result/${sessionId}`)
  }

  return (
    <AppShell
      eyebrow="Live Question"
      title={activeQuestion.text}
      description="Choose one answer before the countdown ends. The server controls the master timer so every device stays synchronized."
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
                className="mx-auto h-auto max-h-[55vh] w-full object-contain md:max-h-[420px]"
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
          <div className="panel-elevated p-5 text-center">
            <p className="kicker">Time Left</p>
            <p
              className={`mt-1 font-display text-6xl font-bold tabular-nums transition-colors ${
                selectedOption
                  ? 'text-slate-400'
                  : secondsLeft <= 5
                    ? 'animate-pulse text-red-600'
                    : secondsLeft <= 10
                      ? 'text-amber-600'
                      : 'text-slate-950'
              }`}
            >
              {secondsLeft}
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  secondsLeft <= 5
                    ? 'bg-red-500'
                    : secondsLeft <= 10
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-accent to-signal'
                }`}
                style={{ width: `${countdown.progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="panel-elevated p-4 text-center">
              <p className="kicker">Your Score</p>
              <p className="mt-1 font-display text-2xl font-bold text-slate-950">
                {formatScore(me?.score ?? 0)}
              </p>
            </div>
            <div className="panel-elevated p-4 text-center">
              <p className="kicker">Your Rank</p>
              <p className="mt-1 font-display text-2xl font-bold text-slate-950">
                {me ? `#${me.rank}` : '—'}
              </p>
            </div>
          </div>

          {selectedOption ? (
            <div className="panel-elevated animate-pop-in p-5 text-center">
              <p className="font-display text-lg font-semibold text-slate-950">Answer locked in</p>
              <p className="mt-1 text-sm text-slate-600">Hang tight — revealing your result…</p>
            </div>
          ) : (
            <div className="panel-elevated p-5 text-center text-sm leading-7 text-slate-700">
              Answer fast — the quicker your correct answer, the more points you earn.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
