'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Square, X, Loader2, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceRecognition, type VoiceState } from '@/hooks/use-voice-recognition'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

// Pulsing ring animation for the recording state
function RecordingPulse() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
    </span>
  )
}

// Animated microphone icon
function AnimatedMicIcon() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="inline-flex"
    >
      <Mic className="h-5 w-5 text-red-500" />
    </motion.div>
  )
}

// Map states to accessible labels
function getStateLabel(state: VoiceState): string {
  switch (state) {
    case 'idle': return 'Voice input ready'
    case 'listening': return 'Recording in progress'
    case 'processing': return 'Processing voice input'
    case 'completed': return 'Voice input completed'
    case 'cancelled': return 'Voice input cancelled'
    case 'permission_denied': return 'Microphone permission denied'
    case 'unsupported': return 'Voice input not supported'
  }
}

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const {
    state,
    transcript,
    elapsedTime,
    error,
    isSupported,
    start,
    stop,
    cancel,
    reset,
  } = useVoiceRecognition(onTranscript)

  const stopButtonRef = useRef<HTMLButtonElement>(null)

  // Focus the stop button when recording starts for keyboard accessibility
  useEffect(() => {
    if (state === 'listening' && stopButtonRef.current) {
      // Small delay to let animation settle
      const t = setTimeout(() => stopButtonRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [state])

  // Don't render if unsupported and we haven't tried yet
  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200" role="alert">
        <Info className="h-4 w-4 text-amber-500 shrink-0" />
        <p className="text-xs text-amber-700">
          Voice input is not supported in your browser. Please type your report manually.
        </p>
      </div>
    )
  }

  // Idle state: just the mic button
  if (state === 'idle') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-[#0B1F6D] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0B1F6D]/20 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Start voice recording"
          title="Record with voice"
        >
          <Mic className="h-4 w-4" />
        </button>
        <span className="text-xs text-gray-400">or speak your report</span>
      </div>
    )
  }

  // Listening / Recording state
  if (state === 'listening') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3"
        role="region"
        aria-label="Voice recording in progress"
        aria-live="polite"
      >
        {/* Recording header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AnimatedMicIcon />
            <div>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                Recording
                <RecordingPulse />
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Speak clearly into your microphone...</p>
            </div>
          </div>
          <span className="text-lg font-mono font-bold text-red-600 tabular-nums" aria-label={`Recording time: ${formatTime(elapsedTime)}`}>
            {formatTime(elapsedTime)}
          </span>
        </div>

        {/* Live transcript preview */}
        {transcript && (
          <div className="rounded-lg bg-white border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Live transcription</p>
            <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            ref={stopButtonRef}
            type="button"
            onClick={stop}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
            aria-label="Stop recording"
          >
            <Square className="mr-2 h-3.5 w-3.5" />
            Stop Recording
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={cancel}
            className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="Cancel recording"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    )
  }

  // Processing state
  if (state === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-center justify-center gap-3"
        role="status"
        aria-label="Processing voice input"
      >
        <Loader2 className="h-5 w-5 text-[#0B1F6D] animate-spin" />
        <p className="text-sm font-medium text-[#0B1F6D]">Processing voice input...</p>
      </motion.div>
    )
  }

  // Completed state
  if (state === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-3"
        role="region"
        aria-label="Voice transcription completed"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-green-700">Voice transcription complete</p>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:underline"
            aria-label="Record again"
          >
            Record again
          </button>
        </div>
        <div className="rounded-lg bg-white border border-green-100 p-3">
          <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
        </div>
        <p className="text-xs text-green-600">The text above has been added to the activity field. You can edit it before submitting.</p>
      </motion.div>
    )
  }

  // Error states (cancelled, permission_denied)
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-amber-800">
            {state === 'permission_denied' ? 'Microphone Access Required' : 'Voice Input Issue'}
          </p>
          {error && (
            <p className="text-xs text-amber-700 leading-relaxed">{error}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reset}
          className="rounded-lg border-amber-200 text-amber-700 hover:bg-amber-100"
          aria-label="Try voice input again"
        >
          <Mic className="mr-1.5 h-3.5 w-3.5" />
          Try Again
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Dismiss"
        >
          Dismiss
        </Button>
      </div>
    </motion.div>
  )
}