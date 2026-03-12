/**
 * PCM Recorder AudioWorklet Processor
 * Mikrofon ses verisini 16-bit PCM formatına dönüştürür
 * Giriş: Float32Array [-1.0, 1.0]
 * Çıkış: Int16Array [-32768, 32767] → ArrayBuffer
 */
class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    if (inputs.length > 0 && inputs[0].length > 0) {
      const inputChannel = inputs[0][0];
      const pcm16 = new Int16Array(inputChannel.length);
      for (let i = 0; i < inputChannel.length; i++) {
        pcm16[i] = Math.max(-1, Math.min(1, inputChannel[i])) * 0x7fff;
      }
      this.port.postMessage(pcm16.buffer);
    }
    return true;
  }
}

registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);
