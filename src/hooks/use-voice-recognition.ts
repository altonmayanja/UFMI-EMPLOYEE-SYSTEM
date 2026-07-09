'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'permission_denied'
  | 'unsupported'

export interface VoiceRecognitionResult {
  state: VoiceState
  transcript: string
  elapsedTime: number
  error: string | null
  isSupported: boolean
  start: () => void
  stop: () => void
  cancel: () => void
  reset: () => void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  onspeechend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const MAX_NO_SPEECH_RETRIES = 3

export function useVoiceRecognition(onTranscript?: (text: string) => void): VoiceRecognitionResult {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finalTranscriptRef = useRef('')
  const isStoppedRef = useRef(false)
  const onTranscriptRef = useRef(onTranscript)
  const isListeningRef = useRef(false)
  const noSpeechCountRef = useRef(0)

  // Guard: prevent onerror AND onend from both restarting (Bug #1 fix)
  const restartScheduledRef = useRef(false)
  // Guard: prevent double onTranscript call from onend + stop timeout (Bug #2 fix)
  const transcriptDeliveredRef = useRef(false)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    setElapsedTime(0)
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
  }, [clearTimer])

  const cleanup = useCallback(() => {
    clearTimer()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
    isListeningRef.current = false
    restartScheduledRef.current = false
  }, [clearTimer])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const isSupported = typeof window !== 'undefined' && !!getSpeechRecognition()

  const deliverTranscript = useCallback(() => {
    // Only deliver once per recording session (Bug #2 fix)
    if (transcriptDeliveredRef.current) return
    transcriptDeliveredRef.current = true

    const finalText = finalTranscriptRef.current.trim()
    if (finalText) {
      setState('completed')
      setTranscript(finalText)
      onTranscriptRef.current?.(finalText)
    } else {
      setState('cancelled')
      setError('No speech was detected. Please try again and speak clearly into your microphone.')
    }
  }, [])

  const start = useCallback(() => {
    if (typeof window === 'undefined') {
      setState('unsupported')
      setError('Voice input is not supported in your browser. Please type your report manually.')
      return
    }

    const SpeechRecognitionConstructor = getSpeechRecognition()
    if (!SpeechRecognitionConstructor) {
      setState('unsupported')
      setError('Voice input is not supported in your browser. Please type your report manually.')
      return
    }

    cleanup()

    const recognition = new SpeechRecognitionConstructor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    finalTranscriptRef.current = ''
    setTranscript('')
    setError(null)
    isStoppedRef.current = false
    isListeningRef.current = true
    noSpeechCountRef.current = 0
    restartScheduledRef.current = false
    transcriptDeliveredRef.current = false

    recognition.onstart = () => {
      setState('listening')
      startTimer()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      noSpeechCountRef.current = 0

      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }

      finalTranscriptRef.current += final
      const full = (finalTranscriptRef.current + interim).trim()
      setTranscript(full)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          clearTimer()
          isListeningRef.current = false
          recognitionRef.current = null
          setState('permission_denied')
          setError('Microphone permission was denied. Please allow microphone access in your browser settings and try again.')
          return

        case 'no-speech': {
          noSpeechCountRef.current += 1
          if (noSpeechCountRef.current < MAX_NO_SPEECH_RETRIES && !isStoppedRef.current) {
            // Mark that we're restarting so onend won't also restart (Bug #1 fix)
            restartScheduledRef.current = true
            try {
              recognitionRef.current = null
              const newRec = new SpeechRecognitionConstructor()
              newRec.continuous = true
              newRec.interimResults = true
              newRec.lang = 'en-US'
              newRec.onstart = () => {}
              newRec.onresult = recognition.onresult
              newRec.onerror = recognition.onerror
              newRec.onend = recognition.onend
              newRec.onspeechend = recognition.onspeechend
              recognitionRef.current = newRec
              newRec.start()
              return
            } catch {
              restartScheduledRef.current = false
            }
          }
          clearTimer()
          isListeningRef.current = false
          recognitionRef.current = null
          setState('cancelled')
          setError('No speech was detected. Please make sure your microphone is working and try again.')
          return
        }

        case 'audio-capture':
          clearTimer()
          isListeningRef.current = false
          recognitionRef.current = null
          setState('cancelled')
          setError('No microphone was found. Please connect a microphone and try again.')
          return

        case 'network':
          clearTimer()
          isListeningRef.current = false
          recognitionRef.current = null
          setState('cancelled')
          setError('A network error occurred during voice recognition. Please check your connection and try again.')
          return

        case 'aborted':
          return

        default:
          clearTimer()
          isListeningRef.current = false
          recognitionRef.current = null
          setState('cancelled')
          setError(`Voice recognition failed: ${event.error}. Please try again.`)
          return
      }
    }

    recognition.onend = () => {
      // If onerror already scheduled a restart, don't restart again (Bug #1 fix)
      if (restartScheduledRef.current) {
        restartScheduledRef.current = false
        return
      }

      // If explicitly stopped, deliver the transcript
      if (isStoppedRef.current) {
        clearTimer()
        isListeningRef.current = false
        recognitionRef.current = null
        deliverTranscript()
        return
      }

      // If still supposed to be listening, auto-restart
      if (isListeningRef.current && !isStoppedRef.current) {
        try {
          const newRec = new SpeechRecognitionConstructor()
          newRec.continuous = true
          newRec.interimResults = true
          newRec.lang = 'en-US'
          newRec.onstart = () => {}
          newRec.onresult = recognition.onresult
          newRec.onerror = recognition.onerror
          newRec.onend = recognition.onend
          newRec.onspeechend = recognition.onspeechend
          recognitionRef.current = newRec
          newRec.start()
          return
        } catch {
          // Failed to restart
        }
      }

      // Fell through — finalize
      clearTimer()
      isListeningRef.current = false
      recognitionRef.current = null
    }

    recognition.onspeechend = () => {
      // Let onend handle it
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      isListeningRef.current = false
      setState('cancelled')
      setError('Failed to start voice recognition. Please try again.')
      recognitionRef.current = null
    }
  }, [cleanup, clearTimer, startTimer, deliverTranscript])

  const stop = useCallback(() => {
    isStoppedRef.current = true
    isListeningRef.current = false
    clearTimer()

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }

    setState('processing')

    // Fallback: if onend doesn't fire within 1s, deliver manually
    setTimeout(() => {
      if (!transcriptDeliveredRef.current) {
        recognitionRef.current = null
        deliverTranscript()
      }
    }, 1000)
  }, [clearTimer, deliverTranscript])

  const cancel = useCallback(() => {
    isStoppedRef.current = true
    isListeningRef.current = false
    cleanup()
    setState('cancelled')
    setTranscript('')
    setElapsedTime(0)
    setError(null)
  }, [cleanup])

  const reset = useCallback(() => {
    isStoppedRef.current = false
    isListeningRef.current = false
    cleanup()
    setState('idle')
    setTranscript('')
    setElapsedTime(0)
    setError(null)
    finalTranscriptRef.current = ''
    noSpeechCountRef.current = 0
    transcriptDeliveredRef.current = false
    restartScheduledRef.current = false
  }, [cleanup])

  return {
    state,
    transcript,
    elapsedTime,
    error,
    isSupported,
    start,
    stop,
    cancel,
    reset,
  }
}