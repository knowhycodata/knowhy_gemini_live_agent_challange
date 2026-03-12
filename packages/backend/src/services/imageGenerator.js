/**
 * Image Generator Service - Multi-Agent: ImageGenerator Sub-Agent
 * 
 * Gemini Nano Banana 2 Pro (gemini-3-pro-image-preview) modeli ile görsel üretir.
 * ADK multi-agent pattern'ini Node.js'de simüle eder.
 * 
 * Multi-Agent Yapısı:
 *   Coordinator (Nöra Live) → PromptRefiner → ImageGenerator → FeedbackPresenter
 * 
 * Bu servis ImageGenerator sub-agent rolündedir.
 */

const { GoogleGenAI } = require('@google/genai');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-exp';

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

/**
 * Multi-Agent Orchestrator
 * ADK SequentialAgent pattern'ini simüle eder:
 *   Step 1: PromptRefiner - Kullanıcı isteğini profesyonel prompt'a çevirir
 *   Step 2: ImageGenerator - Nano Banana ile görsel üretir
 *   Step 3: ResultPresenter - Sonucu formatlar
 */
class ImageGenerationPipeline {
  constructor() {
    this.state = {};
  }

  /**
   * Sub-Agent 1: Prompt Refiner
   * Kullanıcının doğal dil isteğini profesyonel bir image generation prompt'a çevirir.
   */
  async refinePrompt(userRequest) {
    console.log('[PromptRefiner] Refining prompt:', userRequest);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Sen bir profesyonel görsel prompt mühendisisin. 
Kullanıcının Türkçe isteğini, Gemini Nano Banana 2 Pro modeli için optimize edilmiş, 
detaylı bir İngilizce image generation prompt'a çevir.

Kurallar:
- Prompt İngilizce olmalı
- Detaylı ve betimleyici ol (ışık, kompozisyon, stil, renk paleti)
- Negatif unsurları belirt
- Kısa ve öz ol, 2-3 cümle

Kullanıcı isteği: "${userRequest}"

Sadece prompt'u yaz, başka bir şey ekleme.`,
    });

    const refinedPrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    this.state.refinedPrompt = refinedPrompt || userRequest;
    this.state.userRequest = userRequest;

    console.log('[PromptRefiner] Refined:', this.state.refinedPrompt);
    return this.state.refinedPrompt;
  }

  /**
   * Sub-Agent 2: Image Generator
   * Nano Banana 2 Pro ile görsel üretir.
   */
  async generateImage(prompt, options = {}) {
    console.log('[ImageGenerator] Generating image with model:', IMAGE_MODEL);

    const config = {
      responseModalities: ['Text', 'Image'],
    };

    if (options.aspectRatio) {
      config.imageConfig = { aspectRatio: options.aspectRatio };
    }

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config,
    });

    let imageData = null;
    let textResponse = null;

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageData = {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          };
        }
        if (part.text) {
          textResponse = part.text;
        }
      }
    }

    this.state.imageData = imageData;
    this.state.textResponse = textResponse;

    console.log('[ImageGenerator] Image generated:', imageData ? 'success' : 'no image');
    return { imageData, textResponse };
  }

  /**
   * Sub-Agent 3: Result Presenter
   * Sonucu formatlar ve istemciye gönderilebilir hale getirir.
   */
  formatResult() {
    return {
      success: !!this.state.imageData,
      userRequest: this.state.userRequest,
      refinedPrompt: this.state.refinedPrompt,
      image: this.state.imageData,
      description: this.state.textResponse,
    };
  }

  /**
   * Pipeline'ı çalıştırır (ADK SequentialAgent.run() benzeri)
   */
  async run(userRequest, options = {}) {
    this.state = {};

    // Step 1: Prompt Refine
    const refinedPrompt = await this.refinePrompt(userRequest);

    // Step 2: Image Generation
    await this.generateImage(refinedPrompt, options);

    // Step 3: Format Result
    return this.formatResult();
  }

  /**
   * Feedback ile yeniden üretim (ADK LoopAgent benzeri)
   */
  async regenerateWithFeedback(feedback, options = {}) {
    const previousPrompt = this.state.refinedPrompt || '';
    const newRequest = `Önceki prompt: "${previousPrompt}". Kullanıcı geri bildirimi: "${feedback}". Bu geri bildirime göre görseli iyileştir.`;

    return await this.run(newRequest, options);
  }
}

/**
 * Singleton pipeline instance
 */
let pipelineInstance = null;

function getImagePipeline() {
  if (!pipelineInstance) {
    pipelineInstance = new ImageGenerationPipeline();
  }
  return pipelineInstance;
}

module.exports = {
  ImageGenerationPipeline,
  getImagePipeline,
};
