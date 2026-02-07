import { useState, useRef, useEffect } from 'react'
import { FiMic, FiSquare, FiPause, FiPlay, FiCheck, FiRefreshCw, FiArrowLeft, FiHeadphones } from 'react-icons/fi'
import './RecordingCard.css'

export default function AudioRecorder({ onRecordingComplete, disabled, submitLabel = "אשר ושלח", initialAudioBlob, initialDuration }) {
    // State Machine: 'idle' | 'recording' | 'review' | 'completed'
    const [status, setStatus] = useState(initialAudioBlob ? 'review' : 'idle')
    const [isPaused, setIsPaused] = useState(false)
    const [hasUsedPause, setHasUsedPause] = useState(false) // Track if pause was used

    // Recording State

    // Recording State
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState(null)
    const [audioUrl, setAudioUrl] = useState(null)

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [totalDuration, setTotalDuration] = useState(0)

    // Refs
    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const timerRef = useRef(null)
    const streamRef = useRef(null)
    const audioPlayerRef = useRef(null)
    const durationRef = useRef(0)

    // Cleanup on mount/unmount
    useEffect(() => {
        return () => {
            stopTimer()
            stopTracks()
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [audioUrl])

    // Handle initial recording from props
    useEffect(() => {
        if (initialAudioBlob) {
            // Avoid recreating URL if blob hasn't changed (though blob reference might change even if content is same)
            // But we always want to reflect the prop if it's provided.
            const url = URL.createObjectURL(initialAudioBlob)
            setAudioBlob(initialAudioBlob)
            setAudioUrl(url)
            setTotalDuration(initialDuration || 0)
            setStatus('review')
            setCurrentTime(0)
        }
    }, [initialAudioBlob, initialDuration])

    // --- Media Recorder Logic ---

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mimeType = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg',
                ''
            ].find(type => MediaRecorder.isTypeSupported(type))

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
            mediaRecorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setAudioBlob(blob)
                setAudioUrl(url)
                setTotalDuration(durationRef.current) // Use ref for accurate final duration
                setStatus('review') // Transition to Review
                stopTracks()
            }

            recorder.start()
            setStatus('recording')
            setIsPaused(false)
            setHasUsedPause(false) // Reset pause tracking for new recording
            setRecordingTime(0)
            durationRef.current = 0
            startTimer()

        } catch (err) {
            console.error('Microphone error:', err)
            alert('Unable to access microphone. Please check permissions.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop()
            stopTimer()
        }
    }

    const togglePause = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            if (isPaused) {
                mediaRecorderRef.current.resume()
                startTimer()
            } else {
                mediaRecorderRef.current.pause()
                stopTimer()
                setHasUsedPause(true) // Mark that pause was used
            }
            setIsPaused(!isPaused)
        }
    }

    const resetRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioBlob(null)
        setAudioUrl(null)
        setRecordingTime(0)
        setCurrentTime(0)
        setHasUsedPause(false) // Reset pause tracking
        durationRef.current = 0
        setStatus('idle')
    }

    const confirmSubmission = () => {
        if (audioBlob && onRecordingComplete) {
            // Show success state first
            setStatus('completed')

            // Wait for animation to play before notifying parent
            setTimeout(() => {
                onRecordingComplete(audioBlob, recordingTime)
            }, 1500)
        }
    }

    // --- Timer Helpers ---
    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            durationRef.current += 1
            setRecordingTime(durationRef.current)
        }, 1000)
    }

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current)
    }

    const stopTracks = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
        }
    }

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "00:00"
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // --- Audio Player Logic ---
    const togglePlayback = () => {
        if (!audioPlayerRef.current) return
        if (isPlaying) {
            audioPlayerRef.current.pause()
        } else {
            audioPlayerRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleTimeUpdate = () => {
        if (audioPlayerRef.current) {
            setCurrentTime(audioPlayerRef.current.currentTime)
        }
    }

    const handleSeek = (e) => {
        const time = Number(e.target.value)
        setCurrentTime(time)
        if (audioPlayerRef.current) {
            audioPlayerRef.current.currentTime = time
        }
    }

    const handleAudioEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
    }

    // --- Render States ---

    const renderIdle = () => (
        <div className="rc-content">
            <button className="rc-start-btn" onClick={startRecording} disabled={disabled} title="התחל הקלטה">
                <FiMic />
            </button>
            <div className="rc-instruction">לחצו על המיקרופון כדי להתחיל להקליט</div>
        </div>
    )

    const renderRecording = () => (
        <div className="rc-content">
            <div className="rc-status-indicator">
                {!isPaused && <div className="rc-dot"></div>}
                <span>{isPaused ? 'מושהה' : 'מקליט...'}</span>
            </div>

            <div className="rc-timer">{formatTime(recordingTime)}</div>

            {/* Pause tip - shows after first pause */}
            {hasUsedPause && (
                <div className="rc-pause-tip animate-fade-in">
                    <span className="rc-pause-tip-icon">💡</span>
                    <span className="rc-pause-tip-text">
                        <strong>שימו לב:</strong> במבחן האמיתי אפשר לעצור רק פעם אחת, אז תכננו טוב את המשך ההקלטה!
                    </span>
                </div>
            )}

            <div className="rc-controls-row">
                <button className="rc-control-btn pause" onClick={togglePause} title={isPaused ? "המשך" : "השהה"}>
                    {isPaused ? <FiPlay /> : <FiPause />}
                    {isPaused ? "המשך" : "השהה"}
                </button>
                <button className="rc-control-btn stop" onClick={stopRecording}>
                    <FiSquare />
                    סיום הקלטה
                </button>
            </div>
        </div>
    )

    const renderReview = () => (
        <div className="rc-content">
            <div className="rc-review-title">בדיקת הקלטה</div>
            <div className="rc-instruction" style={{ fontSize: '0.9rem' }}>האזינו להקלטה לפני השליחה</div>

            <div className="rc-playback-container">
                <button className="rc-play-btn" onClick={togglePlayback}>
                    {isPlaying ? <FiPause /> : <FiPlay style={{ marginLeft: '2px' }} />}
                </button>

                <input
                    type="range"
                    min="0"
                    max={totalDuration > 0 ? totalDuration : 0}
                    step="0.1" // Allow smoother seeking
                    value={currentTime}
                    onChange={handleSeek}
                    className="rc-scrubber"
                    style={{
                        background: `linear-gradient(to right, var(--primary) ${Math.min((currentTime / (totalDuration || 1)) * 100, 100)}%, #CBD5E1 ${Math.min((currentTime / (totalDuration || 1)) * 100, 100)}%)`
                    }}
                />

                <div className="rc-time-display">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                </div>
            </div>

            <div className="rc-controls-row">
                <button className="btn btn-ghost text-muted" onClick={resetRecording}>
                    <FiRefreshCw className="icon-right" />
                    הקלט מחדש
                </button>
                <button className="btn btn-primary text-white" onClick={confirmSubmission}>
                    <FiCheck className="icon-right" />
                    {submitLabel}
                </button>
            </div>

            {/* Hidden Audio Element */}
            <audio
                ref={audioPlayerRef}
                key={audioUrl} // Force re-mount on new recording to fix first-play issues
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnded}
                onLoadedMetadata={(e) => {
                    const duration = e.target.duration
                    if (isFinite(duration) && duration > 0) {
                        setTotalDuration(duration)
                    }
                }}
            />
        </div>
    )

    const renderCompleted = () => (
        <div className="rc-content">
            <div className="rc-success-icon">
                <FiCheck />
            </div>
            <div className="rc-success-title">ההקלטה נשמרה!</div>
            <div className="rc-success-sub">מיד ממשיכים...</div>
        </div>
    )

    return (
        <div className="recording-card">
            {status === 'idle' && renderIdle()}
            {status === 'recording' && renderRecording()}
            {status === 'review' && renderReview()}
            {status === 'completed' && renderCompleted()}
        </div>
    )
}
