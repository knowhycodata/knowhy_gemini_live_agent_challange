const stringSimilarity = require('string-similarity');

/**
 * Hikaye Hatırlama Testi Skorlama
 * Orijinal hikaye ile kullanıcının tekrarladığı metin arasındaki benzerliği ölçer.
 */
function scoreStoryRecall(originalStory, recalledText) {
  const maxScore = 25;

  if (!recalledText || recalledText.trim().length === 0) {
    return {
      score: 0,
      maxScore,
      details: { similarity: 0, keywordsFound: [], keywordsMissed: [], recalledLength: 0 },
    };
  }

  const normalizedOriginal = originalStory.toLocaleLowerCase('tr').trim();
  const normalizedRecalled = recalledText.toLocaleLowerCase('tr').trim();

  // Genel metin benzerliği (Dice coefficient)
  const similarity = stringSimilarity.compareTwoStrings(normalizedOriginal, normalizedRecalled);

  // Anahtar kelime analizi - hikayedeki önemli kelimeleri çıkar (4+ karakter)
  const stopWords = ['ve', 'bir', 'bu', 'da', 'de', 'ile', 'için', 'çok', 'daha', 'olan'];
  const originalWords = normalizedOriginal
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.includes(w));

  const uniqueKeywords = [...new Set(originalWords)];

  const keywordsFound = uniqueKeywords.filter((kw) => normalizedRecalled.includes(kw));
  const keywordsMissed = uniqueKeywords.filter((kw) => !normalizedRecalled.includes(kw));

  const keywordRatio = uniqueKeywords.length > 0 ? keywordsFound.length / uniqueKeywords.length : 0;

  // Ağırlıklı skor: %60 benzerlik + %40 anahtar kelime eşleşmesi
  const weightedScore = similarity * 0.6 + keywordRatio * 0.4;
  const score = Math.round(weightedScore * maxScore * 100) / 100;

  return {
    score: Math.min(score, maxScore),
    maxScore,
    details: {
      similarity: Math.round(similarity * 100) / 100,
      keywordRatio: Math.round(keywordRatio * 100) / 100,
      keywordsFound,
      keywordsMissed,
      totalKeywords: uniqueKeywords.length,
      recalledLength: recalledText.trim().length,
    },
  };
}

module.exports = { scoreStoryRecall };
