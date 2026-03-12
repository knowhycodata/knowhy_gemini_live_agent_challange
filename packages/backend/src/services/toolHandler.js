/**
 * Tool Calling Handler
 * 
 * Gemini Live API'den gelen tool call'ları işler.
 * Skorlama ve veritabanı kayıt işlemlerini yapar.
 * LLM asla hesaplama yapmaz — tüm skorlama burada gerçekleşir.
 */

const prisma = require('../lib/prisma');
const { createLogger } = require('../lib/logger');
const { scoreVerbalFluency } = require('./scoring/verbalFluency');

const log = createLogger('ToolHandler');
const { scoreStoryRecall } = require('./scoring/storyRecall');
const { scoreVisualRecognition } = require('./scoring/visualRecognition');
const { scoreOrientation } = require('./scoring/orientation');
const { getImagePipeline } = require('./imageGenerator');

// Multi-Agent: Test görselleri artık Nano Banana 2 Pro ile otomatik üretilir
// Koordinatör ajan subject parametresiyle ne üretileceğini belirler
const TEST_IMAGE_SUBJECTS = [
  { index: 0, subject: 'saat', correctAnswer: 'saat' },
  { index: 1, subject: 'anahtar', correctAnswer: 'anahtar' },
  { index: 2, subject: 'kalem', correctAnswer: 'kalem' },
];

// Gemini session'ları takip et (Brain Agent için hala gerekli olabilir)
const geminiSessions = new Map(); // sessionId -> GeminiLiveSession

function registerGeminiSession(sessionId, session) {
  geminiSessions.set(sessionId, session);
}

function unregisterGeminiSession(sessionId) {
  geminiSessions.delete(sessionId);
}

async function handleToolCall(toolName, args, clientWs = null, sessionId = null) {
  switch (toolName) {
    case 'submit_verbal_fluency':
      return await handleVerbalFluency(args);
    case 'submit_story_recall':
      return await handleStoryRecall(args);
    case 'generate_test_image':
      return await handleGenerateTestImage(args);
    case 'submit_visual_recognition':
      return await handleVisualRecognition(args);
    case 'submit_orientation':
      return await handleOrientation(args);
    case 'complete_session':
      return await handleCompleteSession(args);
    default:
      log.warn('Bilinmeyen tool call', { toolName, sessionId });
      return { error: `Bilinmeyen fonksiyon: ${toolName}` };
  }
}

async function handleVerbalFluency({ sessionId, words, targetLetter, durationSeconds }) {
  const result = scoreVerbalFluency(words, targetLetter);

  await prisma.testResult.upsert({
    where: { sessionId_testType: { sessionId, testType: 'VERBAL_FLUENCY' } },
    update: {
      rawData: { words, targetLetter, durationSeconds },
      score: result.score,
      maxScore: result.maxScore,
      details: result,
    },
    create: {
      sessionId,
      testType: 'VERBAL_FLUENCY',
      rawData: { words, targetLetter, durationSeconds },
      score: result.score,
      maxScore: result.maxScore,
      details: result,
    },
  });

  return {
    success: true,
    message: `Sözel akıcılık testi kaydedildi. ${result.details.validWords.length} geçerli kelime bulundu.`,
    validWordCount: result.details.validWords.length,
    score: result.score,
    maxScore: result.maxScore,
  };
}

async function handleStoryRecall({ sessionId, originalStory, recalledStory }) {
  const result = scoreStoryRecall(originalStory, recalledStory);

  await prisma.testResult.upsert({
    where: { sessionId_testType: { sessionId, testType: 'STORY_RECALL' } },
    update: {
      rawData: { originalStory, recalledStory },
      score: result.score,
      maxScore: result.maxScore,
      details: result,
    },
    create: {
      sessionId,
      testType: 'STORY_RECALL',
      rawData: { originalStory, recalledStory },
      score: result.score,
      maxScore: result.maxScore,
      details: result,
    },
  });

  return {
    success: true,
    message: `Hikaye hatırlama testi kaydedildi.`,
  };
}

/**
 * Multi-Agent: generate_test_image
 * Koordinatör ajan (Nöra) → PromptRefiner → ImageGenerator (Nano Banana 2 Pro) → Presenter
 * 
 * Akış:
 * 1. Koordinatör ajan Test 3'e geldiğinde bu fonksiyonu çağırır
 * 2. Backend: subject'i alır, PromptRefiner ile İngilizce prompt'a çevirir
 * 3. Nano Banana 2 Pro ile görsel üretir
 * 4. base64 görsel + correctAnswer frontend'e gönderilir
 * 5. Frontend otomatik olarak görseli gösterir
 * 6. Kullanıcı ne gördüğünü söyler (tam otonom)
 */
async function handleGenerateTestImage({ imageIndex, subject }) {
  console.log(`[MultiAgent] generate_test_image: index=${imageIndex}, subject=${subject}`);

  const pipeline = getImagePipeline();
  const prompt = `Basit, net ve tanınabilir bir ${subject} görseli. Minimalist, temiz arka plan.`;

  try {
    const result = await pipeline.run(prompt, { aspectRatio: '1:1' });

    if (!result.success || !result.image) {
      console.log('[MultiAgent] Image generation failed, using fallback');
      return {
        success: true,
        imageIndex,
        correctAnswer: subject,
        generatedByAI: false,
        message: `Görsel ${imageIndex + 1} gösteriliyor. Kullanıcıya ne gördüğünü sor.`,
      };
    }

    return {
      success: true,
      imageIndex,
      imageBase64: result.image.data,
      mimeType: result.image.mimeType,
      correctAnswer: subject,
      generatedByAI: true,
      message: `Nano Banana 2 Pro ile görsel ${imageIndex + 1} üretildi. Kullanıcıya gösteriliyor. Ne gördüğünü sor.`,
    };
  } catch (error) {
    console.error('[MultiAgent] Image generation error:', error.message);
    return {
      success: true,
      imageIndex,
      correctAnswer: subject,
      generatedByAI: false,
      message: `Görsel ${imageIndex + 1} gösteriliyor. Kullanıcıya ne gördüğünü sor.`,
    };
  }
}

async function handleVisualRecognition({ sessionId, answers }) {
  const result = scoreVisualRecognition(answers);

  await prisma.testResult.upsert({
    where: { sessionId_testType: { sessionId, testType: 'VISUAL_RECOGNITION' } },
    update: {
      rawData: { answers },
      score: result.score,
      maxScore: result.maxScore,
      details: result,
    },
    create: {
      sessionId,
      testType: 'VISUAL_RECOGNITION',
      rawData: { answers },
      score: result.score,
      maxScore: result.maxScore,
      details: result,
    },
  });

  return {
    success: true,
    message: `Görsel tanıma testi kaydedildi.`,
  };
}

async function handleOrientation({ sessionId, answers }) {
  const result = scoreOrientation(answers);

  await prisma.testResult.upsert({
    where: { sessionId_testType: { sessionId, testType: 'ORIENTATION' } },
    update: {
      rawData: { answers },
      score: result.score,
      maxScore: result.maxScore,
      details: result,
    },
    create: {
      sessionId,
      testType: 'ORIENTATION',
      rawData: { answers },
      score: result.score,
      maxScore: result.maxScore,
      details: result,
    },
  });

  return {
    success: true,
    message: `Yönelim testi kaydedildi.`,
  };
}

async function handleCompleteSession({ sessionId }) {
  const testResults = await prisma.testResult.findMany({
    where: { sessionId },
  });

  const totalScore = testResults.reduce((sum, t) => sum + t.score, 0);
  const maxPossible = testResults.reduce((sum, t) => sum + t.maxScore, 0);
  const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

  let riskLevel = 'LOW';
  if (percentage < 50) riskLevel = 'HIGH';
  else if (percentage < 75) riskLevel = 'MODERATE';

  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      totalScore,
      riskLevel,
      completedAt: new Date(),
    },
  });

  return {
    success: true,
    totalScore,
    maxPossible,
    percentage: Math.round(percentage),
    riskLevel,
    message: `Oturum tamamlandı. Toplam puan: ${totalScore}/${maxPossible}`,
  };
}

module.exports = { 
  handleToolCall, 
  registerGeminiSession, 
  unregisterGeminiSession,
  TEST_IMAGE_SUBJECTS 
};
