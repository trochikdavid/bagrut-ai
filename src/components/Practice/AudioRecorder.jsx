import { useState, useRef, useEffect } from 'react'
import { FiMic, FiSquare, FiPause, FiPlay, FiTrash2, FiCheck } from 'react-icons/fi'

export default function AudioRecorder({ onRecordingComplete, disabled }) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioBlob, setAudioBlob] = useState(null)
    const [audioUrl, setAudioUrl] = useState(null)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const timerRef = useRef(null)
    const streamRef = useRef(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [audioUrl])

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            // Determine supported mime type
            const mimeType = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg',
                ''
            ].find(type => MediaRecorder.isTypeSupported(type))

            console.log('🎤 Using mimeType:', mimeType)

            const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                // Use the same mimeType for the blob, or default if empty
                const blobType = mimeType || 'audio/webm'
                const blob = new Blob(chunksRef.current, { type: blobType })
                console.log('🎤 Finished recording. Blob size:', blob.size, 'Type:', blob.type)
                setAudioBlob(blob)
                setAudioUrl(URL.createObjectURL(blob))

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                }
            }

            mediaRecorder.start()
            setIsRecording(true)
            setIsPaused(false)
            setRecordingTime(0)

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (err) {
            console.error('Error accessing microphone:', err)
            alert('לא ניתן לגשת למיקרופון. אנא אשר/י גישה למיקרופון בהגדרות הדפדפן.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsPaused(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume()
                timerRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1)
                }, 1000)
            } else {
                mediaRecorderRef.current.pause()
                if (timerRef.current) clearInterval(timerRef.current)
            }
            setIsPaused(!isPaused)
        }
    }

    const deleteRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioBlob(null)
        setAudioUrl(null)
        setRecordingTime(0)
    }

    const submitRecording = () => {
        if (audioBlob && onRecordingComplete) {
            onRecordingComplete(audioBlob, recordingTime)
            setIsSubmitted(true)
        }
    }

    return (
        <div className="recorder-container">
            {!audioUrl ? (
                <div className={`recorder-card card ${isRecording ? 'recording' : ''}`}>
                    <div className="recorder-visualizer">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="visualizer-bar"
                                style={{
                                    '--i': i,
                                    height: isRecording && !isPaused ? `${20 + Math.random() * 40}px` : '20px'
                                }}
                            />
                        ))}
                    </div>

                    <div className="recorder-status">
                        {!isRecording && 'לחץ/י להתחלת הקלטה'}
                        {isRecording && !isPaused && '🔴 מקליט...'}
                        {isRecording && isPaused && '⏸️ מושהה'}
                    </div>

                    <div className="recorder-time">{formatTime(recordingTime)}</div>

                    <div className="recorder-controls">
                        {!isRecording ? (
                            <button
                                className="record-btn record-btn-start"
                                onClick={startRecording}
                                disabled={disabled}
                            >
                                <FiMic />
                            </button>
                        ) : (
                            <>
                                <button
                                    className="btn btn-secondary btn-icon"
                                    onClick={pauseRecording}
                                >
                                    {isPaused ? <FiPlay /> : <FiPause />}
                                </button>
                                <button
                                    className="record-btn record-btn-stop"
                                    onClick={stopRecording}
                                >
                                    <FiSquare />
                                </button>
                            </>
                        )}
                    </div>

                    {isRecording && (
                        <p className="mt-md text-muted" style={{ fontSize: '0.75rem' }}>
                            ניתן לעשות השהייה אחת במהלך ההקלטה
                        </p>
                    )}
                </div>
            ) : (
                <div className="recording-preview card">
                    <div className="preview-header">
                        <h4>{isSubmitted ? '✓ הקלטה נשמרה' : 'הקלטה מוכנה'}</h4>
                        <span className="text-muted">{formatTime(recordingTime)}</span>
                    </div>

                    <audio controls className="audio-player" src={audioUrl}>
                        הדפדפן שלך לא תומך בהשמעת אודיו
                    </audio>

                    {!isSubmitted && (
                        <div className="preview-actions">
                            <button className="btn btn-secondary" onClick={deleteRecording}>
                                <FiTrash2 />
                                הקלט מחדש
                            </button>
                            <button className="btn btn-primary" onClick={submitRecording}>
                                <FiCheck />
                                אשר הקלטה
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
