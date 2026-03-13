/**
 * Video Analysis Agent - Kamera Görüntüsü Analiz Ajanı
 * 
 * Test 4 (Yönelim) sırasında kullanıcının kamera görüntüsünü analiz eder:
 * - Mimik analizi (yüz ifadeleri)
 * - Göz hareketi takibi
 * - Genel davranış gözlemi (dikkat, odaklanma, kararsızlık)
 * - Kamera yönlendirme komutları (yakınlaş, uzaklaş, ortala)
 * 
 * Mimari:
 *   Frontend (kamera) → WS → Backend → Gemini Vision API → Analiz sonucu
 *   Ajan → send_camera_command → Frontend (kamera kontrolü)
 * 
 * NOT: Analiz sonuçları LLM'e gönderilmez, backend'de kaydedilir.
 * Sadece özet metinler Nöra'ya iletilir.
 */

const { GoogleGenAI } = require('@google/genai');
const { createLogger } = require('../lib/logger');

const log = createLogger('VideoAnalysisAgent');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

/**
 * Video frame analiz prompt'u
 */
const ANALYSIS_PROMPT = `Sen bir bilişsel tarama asistanının görüntü analiz modülüsün.
Kullanıcının kamera görüntüsünden aşağıdakileri analiz et:

1. YÜZ İFADESİ: Kullanıcının genel yüz ifadesi (rahat, gergin, endişeli, kararsız, düşünceli, mutlu, şaşkın vb.)
2. GÖZ HAREKETLERİ: Göz teması durumu (kameraya bakıyor mu, başka yere mi bakıyor, gözler kayıyor mu)
3. DİKKAT DÜZEYİ: Kullanıcı odaklanmış mı, dağınık mı, yorgun mu görünüyor
4. GENEL GÖZLEM: Başka dikkat çekici bir davranış var mı (baş eğme, el hareketleri vb.)

SADECE JSON formatında yanıt ver:
{
  "facialExpression": "ifade_türü",
  "eyeContact": "durum",
  "attentionLevel": "yüksek|orta|düşük",
  "confidence": 0.0-1.0,
  "observations": ["gözlem1", "gözlem2"],
  "summary": "Tek cümlelik özet"
}

Eğer yüz görünmüyorsa veya görüntü belirsizse:
{
  "facialExpression": "belirsiz",
  "eyeContact": "tespit edilemedi",
  "attentionLevel": "belirsiz",
  "confidence": 0.0,
  "observations": ["Yüz tespit edilemedi"],
  "summary": "Görüntüde yüz tespit edilemedi",
  "cameraCommand": "center"
}`;

class VideoAnalysisAgent {
  constructor(sessionId, sendToClient, sendTextToLive) {
    this.sessionId = sessionId;
    this.sendToClient = sendToClient;
    this.sendTextToLive = sendTextToLive;
    
    // Analiz state
    this.isActive = false;
    this.analysisResults = [];
    this.frameCount = 0;
    this.lastAnalysisTime = 0;
    this.ANALYSIS_INTERVAL_MS = 5000; // Her 5 saniyede bir analiz
    this.MAX_ANALYSES = 20; // Maksimum analiz sayısı
    
    // Kamera durumu
    this.cameraActive = false;
    this.currentZoom = 1.0;
    
    log.info('VideoAnalysisAgent oluşturuldu', { sessionId });
  }

  /**
   * Video analizi başlat (Test 4 başlangıcında)
   */
  startAnalysis() {
    this.isActive = true;
    this.analysisResults = [];
    this.frameCount = 0;
    this.lastAnalysisTime = 0;
    
    log.info('Video analizi başlatıldı', { sessionId: this.sessionId });
    
    // Frontend'e kamera açma komutu gönder
    this.sendToClient({
      type: 'camera_command',
      command: 'start',
      message: 'Kameranızı açmanız gerekiyor. Lütfen izin verin.',
    });
    
    return {
      success: true,
      message: 'Video analizi başlatıldı. Kullanıcının kamerası açılıyor.',
    };
  }

  /**
   * Video analizi durdur
   */
  stopAnalysis() {
    this.isActive = false;
    
    log.info('Video analizi durduruldu', { 
      sessionId: this.sessionId, 
      totalAnalyses: this.analysisResults.length 
    });
    
    // Frontend'e kamera kapatma komutu gönder
    this.sendToClient({
      type: 'camera_command',
      command: 'stop',
    });
    
    // Özet oluştur
    const summary = this._generateSummary();
    
    return {
      success: true,
      totalAnalyses: this.analysisResults.length,
      summary,
      analyses: this.analysisResults,
    };
  }

  /**
   * Frontend'den gelen video frame'i analiz et
   * @param {string} frameBase64 - Base64 encoded JPEG frame
   */
  async analyzeFrame(frameBase64) {
    if (!this.isActive) return null;
    
    const now = Date.now();
    if (now - this.lastAnalysisTime < this.ANALYSIS_INTERVAL_MS) {
      return null; // Çok sık analiz yapma
    }
    
    if (this.analysisResults.length >= this.MAX_ANALYSES) {
      log.info('Maksimum analiz sayısına ulaşıldı', { sessionId: this.sessionId });
      return null;
    }
    
    this.lastAnalysisTime = now;
    this.frameCount++;
    
    try {
      log.info('Frame analiz ediliyor', { 
        sessionId: this.sessionId, 
        frameNum: this.frameCount,
        dataSize: frameBase64.length 
      });

      const result = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { text: ANALYSIS_PROMPT },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: frameBase64,
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 512,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const responseText = result.text || '';
      let analysis;
      
      try {
        // JSON parse et
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSON bulunamadı');
        }
      } catch (parseError) {
        log.warn('Analiz JSON parse hatası', { 
          sessionId: this.sessionId, 
          response: responseText.substring(0, 200) 
        });
        analysis = {
          facialExpression: 'belirsiz',
          eyeContact: 'tespit edilemedi',
          attentionLevel: 'belirsiz',
          confidence: 0,
          observations: ['Analiz sonucu parse edilemedi'],
          summary: 'Görüntü analizi tamamlanamadı',
        };
      }

      // Timestamp ekle
      analysis.timestamp = now;
      analysis.frameNumber = this.frameCount;
      
      this.analysisResults.push(analysis);
      
      log.info('Frame analiz tamamlandı', { 
        sessionId: this.sessionId, 
        expression: analysis.facialExpression,
        attention: analysis.attentionLevel,
        confidence: analysis.confidence 
      });

      // Frontend'e analiz sonucunu gönder (görsel overlay için)
      this.sendToClient({
        type: 'video_analysis_result',
        analysis: {
          facialExpression: analysis.facialExpression,
          eyeContact: analysis.eyeContact,
          attentionLevel: analysis.attentionLevel,
          confidence: analysis.confidence,
          summary: analysis.summary,
        },
      });

      // Kamera komutu varsa frontend'e gönder
      if (analysis.cameraCommand) {
        this.sendCameraCommand(analysis.cameraCommand);
      }

      // Dikkat düşükse Nöra'ya bildir
      if (analysis.attentionLevel === 'düşük' && analysis.confidence > 0.6) {
        this.sendTextToLive(
          `VIDEO_ANALYSIS: Kullanıcının dikkati düşük görünüyor. ` +
          `Gözlem: ${analysis.summary}. ` +
          `Kullanıcıyı nazikçe teşvik et veya dikkatini toplamak için kısa bir mola öner.`
        );
      }

      return analysis;
    } catch (error) {
      log.error('Frame analiz hatası', { 
        sessionId: this.sessionId, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Kamera yönlendirme komutu gönder
   * @param {string} command - 'zoom_in' | 'zoom_out' | 'center' | 'start' | 'stop'
   * @param {object} params - Ek parametreler (zoom level vb.)
   */
  sendCameraCommand(command, params = {}) {
    const validCommands = ['zoom_in', 'zoom_out', 'center', 'start', 'stop'];
    
    if (!validCommands.includes(command)) {
      log.warn('Geçersiz kamera komutu', { command, sessionId: this.sessionId });
      return { success: false, message: `Geçersiz kamera komutu: ${command}` };
    }

    // Zoom seviyesini güncelle
    if (command === 'zoom_in') {
      this.currentZoom = Math.min(3.0, this.currentZoom + (params.step || 0.5));
    } else if (command === 'zoom_out') {
      this.currentZoom = Math.max(1.0, this.currentZoom - (params.step || 0.5));
    } else if (command === 'center') {
      this.currentZoom = 1.0;
    }

    log.info('Kamera komutu gönderiliyor', { 
      sessionId: this.sessionId, 
      command, 
      zoom: this.currentZoom 
    });

    this.sendToClient({
      type: 'camera_command',
      command,
      zoom: this.currentZoom,
      params,
    });

    return { 
      success: true, 
      command, 
      currentZoom: this.currentZoom,
      message: `Kamera komutu uygulandı: ${command}` 
    };
  }

  /**
   * Analiz sonuçlarından özet rapor oluştur
   */
  _generateSummary() {
    if (this.analysisResults.length === 0) {
      return {
        overallAttention: 'veri yok',
        dominantExpression: 'veri yok',
        eyeContactRate: 0,
        observations: [],
        riskIndicators: [],
      };
    }

    // Dikkat seviyeleri
    const attentionCounts = { yüksek: 0, orta: 0, düşük: 0, belirsiz: 0 };
    const expressions = {};
    let eyeContactPositive = 0;
    const allObservations = [];

    for (const r of this.analysisResults) {
      // Dikkat
      const attn = r.attentionLevel || 'belirsiz';
      attentionCounts[attn] = (attentionCounts[attn] || 0) + 1;

      // Yüz ifadesi
      const expr = r.facialExpression || 'belirsiz';
      expressions[expr] = (expressions[expr] || 0) + 1;

      // Göz teması
      if (r.eyeContact && r.eyeContact.includes('bakıyor')) {
        eyeContactPositive++;
      }

      // Gözlemler
      if (r.observations) {
        allObservations.push(...r.observations);
      }
    }

    const total = this.analysisResults.length;
    
    // Baskın dikkat seviyesi
    const overallAttention = Object.entries(attentionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Baskın ifade
    const dominantExpression = Object.entries(expressions)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Göz teması oranı
    const eyeContactRate = Math.round((eyeContactPositive / total) * 100);

    // Risk göstergeleri
    const riskIndicators = [];
    if (attentionCounts.düşük / total > 0.4) {
      riskIndicators.push('Sık dikkat dağılması gözlemlendi');
    }
    if (eyeContactRate < 30) {
      riskIndicators.push('Düşük göz teması oranı');
    }
    if (expressions['kararsız'] && expressions['kararsız'] / total > 0.3) {
      riskIndicators.push('Sık kararsızlık ifadesi');
    }
    if (expressions['endişeli'] && expressions['endişeli'] / total > 0.3) {
      riskIndicators.push('Endişeli görünüm');
    }

    return {
      overallAttention,
      dominantExpression,
      eyeContactRate,
      attentionBreakdown: attentionCounts,
      expressionBreakdown: expressions,
      totalFramesAnalyzed: total,
      observations: [...new Set(allObservations)].slice(0, 10),
      riskIndicators,
    };
  }

  /**
   * Temizlik
   */
  destroy() {
    this.isActive = false;
    log.info('VideoAnalysisAgent temizlendi', { 
      sessionId: this.sessionId,
      totalAnalyses: this.analysisResults.length 
    });
  }
}

module.exports = { VideoAnalysisAgent };
