import { useState, useRef } from 'react';

export function useAudioRecorder(onExtractionComplete) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await sendAudioToBackend(audioBlob);
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'speech.webm');

      const res = await fetch('http://localhost:8002/api/extract-from-audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Extraction failed');
      const data = await res.json();
      onExtractionComplete(data);
    } catch (err) {
      console.error(err);
      alert('Failed to extract information from audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { isRecording, isLoading, startRecording, stopRecording };
}
