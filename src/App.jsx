import React, { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState([])
  const [selectedRecordingId, setSelectedRecordingId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editingField, setEditingField] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const editInputRef = useRef(null)

  const selectedRecording = recordings.find(r => r.id === selectedRecordingId)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      // Cleanup all audio URLs
      recordings.forEach(r => {
        if (r.url) {
          URL.revokeObjectURL(r.url)
        }
      })
    }
  }, [])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId, editingField])

  const startRecording = async () => {
    try {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5)
        
        const newRecording = {
          id: Date.now().toString(),
          name: `Recording ${recordings.length + 1}`,
          blob,
          url,
          date: dateStr,
          time: timeStr
        }

        setRecordings(prev => [...prev, newRecording])
        setSelectedRecordingId(newRecording.id)
        setRecordingTime(0)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please allow microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const playBeepSound = () => {
    return new Promise((resolve) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.onended = resolve
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    })
  }

  const handleSelectRecording = (id) => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    setSelectedRecordingId(id)
  }

  const handlePlay = async () => {
    if (audioRef.current && selectedRecording) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await playBeepSound()
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleRewind = async () => {
    if (audioRef.current && selectedRecording) {
      audioRef.current.currentTime = 0
      if (!isPlaying) {
        await playBeepSound()
        setIsPlaying(true)
        audioRef.current.play()
      }
    }
  }

  const handleDelete = (id) => {
    setShowDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      const recordingToDelete = recordings.find(r => r.id === showDeleteConfirm)
      if (recordingToDelete) {
        if (audioRef.current && selectedRecordingId === showDeleteConfirm) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
        if (recordingToDelete.url) {
          URL.revokeObjectURL(recordingToDelete.url)
        }
        
        setRecordings(prev => prev.filter(r => r.id !== showDeleteConfirm))
        if (selectedRecordingId === showDeleteConfirm) {
          setSelectedRecordingId(null)
        }
      }
      setShowDeleteConfirm(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(null)
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startEditing = (id, field) => {
    setEditingId(id)
    setEditingField(field)
  }

  const handleEditChange = (id, field, value) => {
    setRecordings(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ))
  }

  const handleEditBlur = () => {
    setEditingId(null)
    setEditingField(null)
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditBlur()
    } else if (e.key === 'Escape') {
      handleEditBlur()
    }
  }

  return (
    <div className="app">
      <div className="app-container">
        <div className="cassette-recorder">
          <div className="cassette-body">
            {/* Cassette top label */}
            <div className="cassette-label">
              <div className="label-text">VOICEMAIL</div>
              <div className="label-holes">
                <div className="hole"></div>
                <div className="hole"></div>
              </div>
            </div>

            {/* Cassette window showing reels */}
            <div className="cassette-window">
              <div className={`reels ${isPlaying || isRecording ? 'spinning' : ''}`}>
                <div className="reel-left">
                  <div className="reel-spokes"></div>
                </div>
                <div className="reel-right">
                  <div className="reel-spokes"></div>
                </div>
              </div>
              {!selectedRecording && !isRecording && (
                <div className="empty-state">No recording</div>
              )}
            </div>

            {/* Controls panel */}
            <div className="controls-panel">
              <div className="button-row">
                <button
                  className="control-btn play-btn"
                  onClick={handlePlay}
                  disabled={!selectedRecording || isRecording}
                  title="Listen to this message."
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    {isPlaying ? (
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    ) : (
                      <path d="M8 5v14l11-7z"/>
                    )}
                  </svg>
                  <span>Play</span>
                </button>

                <button
                  className="control-btn rewind-btn"
                  onClick={handleRewind}
                  disabled={!selectedRecording || isRecording}
                  title="Go back to the start."
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                  </svg>
                  <span>Rewind</span>
                </button>

                <button
                  className="control-btn delete-btn"
                  onClick={() => selectedRecording && handleDelete(selectedRecording.id)}
                  disabled={!selectedRecording || isRecording}
                  title="Permanently remove this message."
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  <span>Delete</span>
                </button>
              </div>

              <button
                className={`control-btn record-btn ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                title="Record a fresh voicemail."
              >
                <div className={`record-dot ${isRecording ? 'pulsing' : ''}`}></div>
                <span>{isRecording ? 'Recording…' : 'Record New'}</span>
              </button>

              {isRecording && (
                <div className="recording-time">
                  {formatTime(recordingTime)}
                </div>
              )}
            </div>

            {/* Hidden audio element */}
            {selectedRecording && selectedRecording.url && (
              <audio
                ref={audioRef}
                src={selectedRecording.url}
                onEnded={handleAudioEnded}
                onPause={() => setIsPlaying(false)}
              />
            )}
          </div>
        </div>

        {/* Recordings List Sidebar */}
        <div className="recordings-sidebar">
          <div className="sidebar-header">
            <h2>Recordings</h2>
            <span className="recording-count">{recordings.length}</span>
          </div>
          
          <div className="recordings-list">
            {recordings.length === 0 ? (
              <div className="empty-list">No recordings yet</div>
            ) : (
              recordings.map(recording => (
                <div
                  key={recording.id}
                  className={`recording-item ${selectedRecordingId === recording.id ? 'selected' : ''}`}
                  onClick={() => handleSelectRecording(recording.id)}
                >
                  <div className="recording-content">
                    <div className="recording-name-section">
                      {editingId === recording.id && editingField === 'name' ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={recording.name}
                          onChange={(e) => handleEditChange(recording.id, 'name', e.target.value)}
                          onBlur={handleEditBlur}
                          onKeyDown={handleEditKeyDown}
                          className="edit-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className="recording-name"
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            startEditing(recording.id, 'name')
                          }}
                          title="Double-click to rename"
                        >
                          {recording.name}
                        </div>
                      )}
                    </div>

                    <div className="recording-meta">
                      {editingId === recording.id && editingField === 'date' ? (
                        <input
                          ref={editInputRef}
                          type="date"
                          value={recording.date}
                          onChange={(e) => handleEditChange(recording.id, 'date', e.target.value)}
                          onBlur={handleEditBlur}
                          onKeyDown={handleEditKeyDown}
                          className="edit-input date-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className="recording-date"
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            startEditing(recording.id, 'date')
                          }}
                          title="Double-click to edit date"
                        >
                          {recording.date}
                        </div>
                      )}

                      {editingId === recording.id && editingField === 'time' ? (
                        <input
                          ref={editInputRef}
                          type="time"
                          value={recording.time}
                          onChange={(e) => handleEditChange(recording.id, 'time', e.target.value)}
                          onBlur={handleEditBlur}
                          onKeyDown={handleEditKeyDown}
                          className="edit-input time-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className="recording-time-meta"
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            startEditing(recording.id, 'time')
                          }}
                          title="Double-click to edit time"
                        >
                          {recording.time}
                        </div>
                      )}
                    </div>

                    <button
                      className="delete-item-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(recording.id)
                      }}
                      title="Delete this recording"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="modal-message">
              Are you sure you want to delete this recording?
            </p>
            <div className="modal-buttons">
              <button className="modal-btn cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="modal-btn confirm-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
