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
  elapsedTime: number // seconds
  error: string | null
  isSupported: boolean
  start: () => void
  stop: () => void
  cancel: () => void
  reset: () => void
}

// Type for the browser's SpeechRecognition API
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

  // Keep the callback ref up to date
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
  }, [clearTimer])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  const isSupported = typeof window !== 'undefined' && !!getSpeechRecognition()

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

    // Clean up any previous instance
    cleanup()

    const recognition = new SpeechRecognitionConstructor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    finalTranscriptRef.current = ''
    setTranscript('')
    setError(null)
    isStoppedRef.current = false

    recognition.onstart = () => {
      setState('listening')
      startTimer()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
      clearTimer()

      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          setState('permission_denied')
          setError('Microphone permission was denied. Please allow microphone access in your browser settings and try again.')
          break
        case 'no-speech':
          setState('cancelled')
          setError('No speech was detected. Please try again and speak clearly into your microphone.')
          break
        case 'audio-capture':
          setState('cancelled')
          setError('No microphone was found. Please connect a microphone and try again.')
          break
        case 'network':
          setState('cancelled')
          setError('A network error occurred during voice recognition. Please check your connection and try again.')
          break
        case 'aborted':
          // User cancelled, do nothing
          break
        default:
          setState('cancelled')
          setError(`Voice recognition failed: ${event.error}. Please try again.`)
          break
      }

      recognitionRef.current = null
    }

    recognition.onend = () => {
      clearTimer()

      // If we didn't explicitly stop, the recognition may have ended unexpectedly
      if (!isStoppedRef.current) {
        // Auto-restart if we're still in listening state (continuous recognition may stop)
        if (state === 'listening') {
          try {
            recognition.start()
            return
          } catch {
            // Failed to restart
          }
        }
      }

      // When explicitly stopped, finalize
      if (isStoppedRef.current) {
        const finalText = finalTranscriptRef.current.trim()
        if (finalText) {
          setState('completed')
          setTranscript(finalText)
          onTranscriptRef.current?.(finalText)
        } else {
          setState('cancelled')
          setError('No speech was detected. Please try again and speak clearly into your microphone.')
        }
        recognitionRef.current = null
      }
    }

    recognition.onspeechend = () => {
      // Speech ended but we might get more results, let the onend handle it
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (err) {
      setState('cancelled')
      setError('Failed to start voice recognition. Please try again.')
      recognitionRef.current = null
    }
  }, [cleanup, clearTimer, startTimer, state])

  const stop = useCallback(() => {
    isStoppedRef.current = true
    clearTimer()

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }

    // Set processing state briefly
    setState('processing')

    // Small delay to allow final results to come in
    setTimeout(() => {
      const finalText = finalTranscriptRef.current.trim()
      if (finalText) {
        setState('completed')
        setTranscript(finalText)
        onTranscriptRef.current?.(finalText)
      } else {
        setState('cancelled')
        setError('No speech was detected. Please try again and speak clearly into your microphone.')
      }
      recognitionRef.current = null
    }, 500)
  }, [clearTimer])

  const cancel = useCallback(() => {
    isStoppedRef.current = true
    cleanup()
    setState('cancelled')
    setTranscript('')
    setElapsedTime(0)
    setError(null)
  }, [cleanup])

  const reset = useCallback(() => {
    cleanup()
    setState('idle')
    setTranscript('')
    setElapsedTime(0)
    setError(null)
    finalTranscriptRef.current = ''
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