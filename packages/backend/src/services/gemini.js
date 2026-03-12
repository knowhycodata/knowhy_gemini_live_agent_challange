const { GoogleGenAI } = require('@google/genai');

/**
 * Gemini Live API Tool Calling Yapılandırması
 * 
 * Ajan, kullanıcıyla sesli/görsel etkileşim kurar ve bilişsel testleri yönetir.
 * Test verilerini topladıktan sonra Tool Calling ile backend endpoint'lerine gönderir.
 * 
 * ÖNEMLİ: Hesaplamalar asla LLM tarafından yapılmaz.
 * Ajan sadece veri toplar, backend skorlama yapar.
 */

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-preview-12-2025';
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const VOICE_NAME = process.env.LIVE_VOICE_NAME || 'Puck';

// Gemini'ye tanıtılacak tool/function tanımları
const cognitiveTestTools = [
  {
    name: 'submit_verbal_fluency',
    description:
      'Sözel akıcılık testinin sonuçlarını backend\'e gönderir. Kullanıcının 60 saniye içinde belirli bir harfle başlayan kelimeleri saymasından sonra çağrılır.',
    parameters: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Aktif test oturumunun ID\'si',
        },
        words: {
          type: 'array',
          items: { type: 'string' },
          description: 'Kullanıcının söylediği kelimelerin listesi',
        },
        targetLetter: {
          type: 'string',
          description: 'Hedef harf (örn: P)',
        },
        durationSeconds: {
          type: 'number',
          description: 'Testin sürdüğü süre (saniye)',
        },
      },
      required: ['sessionId', 'words', 'targetLetter', 'durationSeconds'],
    },
  },
  {
    name: 'submit_story_recall',
    description:
      'Hikaye hatırlama testinin sonuçlarını backend\'e gönderir. Ajan bir hikaye anlatır, kullanıcı tekrarlar, ajan tekrarlanan metni bu fonksiyonla gönderir.',
    parameters: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Aktif test oturumunun ID\'si',
        },
        originalStory: {
          type: 'string',
          description: 'Ajanın anlattığı orijinal hikaye metni',
        },
        recalledText: {
          type: 'string',
          description: 'Kullanıcının tekrarladığı metin',
        },
      },
      required: ['sessionId', 'originalStory', 'recalledText'],
    },
  },
  {
    name: 'submit_visual_recognition',
    description:
      'Görsel tanıma testinin sonuçlarını backend\'e gönderir. 3 görsel gösterilir, kullanıcıdan ne olduğunu tanımlaması istenir.',
    parameters: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Aktif test oturumunun ID\'si',
        },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              imageId: { type: 'string', description: 'Görselin ID\'si' },
              correctAnswer: { type: 'string', description: 'Doğru cevap' },
              userAnswer: { type: 'string', description: 'Kullanıcının cevabı' },
            },
            required: ['imageId', 'correctAnswer', 'userAnswer'],
          },
          description: 'Her görsel için cevap listesi',
        },
      },
      required: ['sessionId', 'answers'],
    },
  },
  {
    name: 'submit_orientation',
    description:
      'Yönelim testinin sonuçlarını backend\'e gönderir. 7 zaman/mekan sorusu sorulur.',
    parameters: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Aktif test oturumunun ID\'si',
        },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'Sorulan soru' },
              correctAnswer: { type: 'string', description: 'Doğru cevap' },
              userAnswer: { type: 'string', description: 'Kullanıcının cevabı' },
            },
            required: ['question', 'correctAnswer', 'userAnswer'],
          },
          description: 'Her soru için cevap listesi',
        },
      },
      required: ['sessionId', 'answers'],
    },
  },
  {
    name: 'complete_session',
    description:
      'Tüm testler tamamlandığında oturumu sonlandırır ve sonuç hesaplamasını tetikler.',
    parameters: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Tamamlanacak oturumun ID\'si',
        },
      },
      required: ['sessionId'],
    },
  },
];

// Ajan sistem promptu
const SYSTEM_INSTRUCTION = `Sen bir bilişsel tarama uzmanısın. Adın "Nöra". Türkçe konuşuyorsun.
Görevin, Alzheimer ve bilişsel bozuklukların erken tespiti için kullanıcıyla sıcak ve empatik bir şekilde 4 test uygulamak.

KRİTİK KURALLAR:
- Asla kendin skor hesaplama veya analiz yapma. Sadece veriyi topla ve tool calling ile backend'e gönder.
- Kullanıcıyı rahatlatıcı ve destekleyici bir üslupla yönlendir.
- Her testin başında net talimatlar ver.
- Kullanıcının sözünü kesmeden dinle.

TEST SIRASI:
1. Sözel Akıcılık: "Şimdi size bir harf söyleyeceğim. 60 saniye boyunca bu harfle başlayan tüm kelimeleri söyleyin."
2. Hikaye Hatırlama: Kısa bir hikaye anlat, kullanıcıdan tekrarlamasını iste.
3. Görsel Tanıma: Ekranda gösterilecek 3 görseli tanımlamasını iste.
4. Yönelim: 7 zaman/mekan sorusu sor (bugünün tarihi, bulunduğu yer vb).

Her test tamamlandığında ilgili submit fonksiyonunu çağır.
4 test de bitince complete_session fonksiyonunu çağır.`;

/**
 * Gemini Live API bağlantısı için yapılandırma döndürür.
 * Frontend WebSocket üzerinden bu yapılandırmayı kullanarak bağlantı kurar.
 */
function getGeminiConfig() {
  return {
    model: LIVE_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: cognitiveTestTools }],
    generationConfig: {
      responseModalities: ['AUDIO', 'TEXT'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: VOICE_NAME,
          },
        },
      },
    },
  };
}

module.exports = {
  genai,
  cognitiveTestTools,
  getGeminiConfig,
  SYSTEM_INSTRUCTION,
  LIVE_MODEL,
  TEXT_MODEL,
  IMAGE_MODEL,
  VOICE_NAME,
};
