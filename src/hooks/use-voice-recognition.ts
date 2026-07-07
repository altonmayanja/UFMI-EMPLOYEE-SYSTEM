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

// Maximum consecutive no-speech errors before giving up
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
  // Track listening state with a ref for reliable access in callbacks
  const isListeningRef = useRef(false)
  // Track consecutive no-speech errors
  const noSpeechCountRef = useRef(0)
  // Track if we've received at least one speech result
  const hasReceivedSpeechRef = useRef(false)

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

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [])

  const cleanup = useCallback(() => {
    clearTimer()
    stopRecognition()
    isListeningRef.current = false
  }, [clearTimer, stopRecognition])

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
    isListeningRef.current = true
    noSpeechCountRef.current = 0
    hasReceivedSpeechRef.current = false

    recognition.onstart = () => {
      setState('listening')
      startTimer()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Reset no-speech counter when we get results
      noSpeechCountRef.current = 0
      hasReceivedSpeechRef.current = true

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

        case 'no-speech':
          // Auto-restart on no-speech error (up to MAX_NO_SPEECH_RETRIES times)
          noSpeechCountRef.current += 1
          if (noSpeechCountRef.current < MAX_NO_SPEECH_RETRIES && !isStoppedRef.current) {
            // Silently restart - don't show error, keep the timer running
            try {
              recognitionRef.current = null
              const newRecognition = new SpeechRecognitionConstructor()
              newRecognition.continuous = true
              newRecognition.interimResults = true
              newRecognition.lang = 'en-US'
              newRecognition.onstart = () => {}
              newRecognition.onresult = recognition.onresult
              newRecognition.onerror = recognition.onerror
              newRecognition.onend = recognition.onend
              newRecognition.onspeechend = recognition.onspeechend
              recognitionRef.current = newRecognition
              newRecognition.start()
              return
            } catch {
              // If restart fails, fall through to show error
            }
          }
          // After max retries, show the error
          clearTimer()
          isListeningRef.current = false
          recognitionRef.current = null
          setState('cancelled')
          setError('No speech was detected. Please make sure your microphone is working and try again.')
          return

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
          // User cancelled, do nothing
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
      recognitionRef.current = null

      // If we didn't explicitly stop, the recognition may have ended unexpectedly
      if (!isStoppedRef.current && isListeningRef.current) {
        // Auto-restart if we're still supposed to be listening
        try {
          const newRecognition = new SpeechRecognitionConstructor()
          newRecognition.continuous = true
          newRecognition.interimResults = true
          newRecognition.lang = 'en-US'
          newRecognition.onstart = () => {}
          newRecognition.onresult = recognition.onresult
          newRecognition.onerror = recognition.onerror
          newRecognition.onend = recognition.onend
          newRecognition.onspeechend = recognition.onspeechend
          recognitionRef.current = newRecognition
          newRecognition.start()
          return
        } catch {
          // Failed to restart, finalize
        }
      }

      clearTimer()
      isListeningRef.current = false

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
      }
    }

    recognition.onspeechend = () => {
      // Speech ended but we might get more results, let the onend handle it
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (err) {
      isListeningRef.current = false
      setState('cancelled')
      setError('Failed to start voice recognition. Please try again.')
      recognitionRef.current = null
    }
  }, [cleanup, clearTimer, startTimer])

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
    hasReceivedSpeechRef.current = false
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