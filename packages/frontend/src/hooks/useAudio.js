/**
 * Audio Hook - Mikrofon kaydı ve ses oynatma yönetimi
 * AudioWorklet tabanlı düşük gecikmeli ses işleme
 */
import { useRef, useCallback, useState } from 'react';
import { createLogger } from '../lib/logger';

const log = createLogger('useAudio');

export function useAudio() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recorderContextRef = useRef(null);
  const recorderNodeRef = useRef(null);
  const micStreamRef = useRef(null);

  const playerContextRef = useRef(null);
  const playerNodeRef = useRef(null);

  const onAudioChunkRef = useRef(null);

  const startRecording = useCallback(async (onAudioChunk) => {
    onAudioChunkRef.current = onAudioChunk;

    try {
      const audioContext = new AudioContext({ sampleRate: 16000 });
      await audioContext.audioWorklet.addModule('/audio/pcm-recorder-processor.js');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1 },
      });

      const source = audioContext.createMediaStreamSource(stream);
      const recorderNode = new AudioWorkletNode(audioContext, 'pcm-recorder-processor');

      source.connect(recorderNode);
      recorderNode.port.onmessage = (event) => {
        if (onAudioChunkRef.current) {
          onAudioChunkRef.current(event.data);
        }
      };

      recorderContextRef.current = audioContext;
      recorderNodeRef.current = recorderNode;
      micStreamRef.current = stream;
      setIsRecording(true);
    } catch (error) {
      log.error('Mikrofon başlatma hatası', { error: error.message });
      throw error;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (recorderNodeRef.current) {
      recorderNodeRef.current.disconnect();
      recorderNodeRef.current = null;
    }
    if (recorderContextRef.current) {
      recorderContextRef.current.close();
      recorderContextRef.current = null;
    }
    onAudioChunkRef.current = null;
    setIsRecording(false);
  }, []);

  const initPlayer = useCallback(async () => {
    if (playerContextRef.current) return;

    const audioContext = new AudioContext({ sampleRate: 24000 });
    await audioContext.audioWorklet.addModule('/audio/pcm-player-processor.js');

    const playerNode = new AudioWorkletNode(audioContext, 'pcm-player-processor');
    playerNode.connect(audioContext.destination);

    playerContextRef.current = audioContext;
    playerNodeRef.current = playerNode;
  }, []);

  const playAudio = useCallback(async (base64Data) => {
    if (!playerNodeRef.current) {
      await initPlayer();
    }

    if (playerContextRef.current?.state === 'suspended') {
      await playerContextRef.current.resume();
    }

    const binaryString = atob(base64Data.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    playerNodeRef.current.port.postMessage(bytes.buffer);
    setIsSpeaking(true);
  }, [initPlayer]);

  const clearAudioBuffer = useCallback(() => {
    if (playerNodeRef.current) {
      playerNodeRef.current.port.postMessage('clear');
    }
    setIsSpeaking(false);
  }, []);

  const cleanup = useCallback(() => {
    stopRecording();
    if (playerNodeRef.current) {
      playerNodeRef.current.disconnect();
      playerNodeRef.current = null;
    }
    if (playerContextRef.current) {
      playerContextRef.current.close();
      playerContextRef.current = null;
    }
  }, [stopRecording]);

  return {
    isRecording,
    isSpeaking,
    setIsSpeaking,
    startRecording,
    stopRecording,
    initPlayer,
    playAudio,
    clearAudioBuffer,
    cleanup,
  };
}
