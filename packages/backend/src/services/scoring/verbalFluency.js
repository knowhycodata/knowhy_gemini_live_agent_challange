/**
 * Sözel Akıcılık Testi Skorlama
 * Kullanıcıdan belirli bir harfle başlayan kelimeleri 60 saniye içinde saymasını ister.
 * Skor: Geçerli benzersiz kelime sayısı
 */
function scoreVerbalFluency(words, targetLetter, durationSeconds) {
  const normalizedLetter = targetLetter.toLocaleLowerCase('tr');

  // Kelimeleri normalize et ve filtrele
  const normalizedWords = words.map((w) => w.trim().toLocaleLowerCase('tr'));

  // Benzersiz kelimeler
  const uniqueWords = [...new Set(normalizedWords)];

  // Hedef harfle başlayan geçerli kelimeler
  const validWords = uniqueWords.filter(
    (w) => w.length > 0 && w.startsWith(normalizedLetter)
  );

  // Geçersiz kelimeler (hedef harfle başlamayan)
  const invalidWords = uniqueWords.filter(
    (w) => w.length > 0 && !w.startsWith(normalizedLetter)
  );

  // Tekrar eden kelimeler
  const duplicates = normalizedWords.length - uniqueWords.length;

  // Skor: Geçerli kelime sayısı, max 25
  const maxScore = 25;
  const score = Math.min(validWords.length, maxScore);

  return {
    score,
    maxScore,
    details: {
      totalWordsSpoken: words.length,
      uniqueWords: uniqueWords.length,
      validWords,
      invalidWords,
      duplicateCount: duplicates,
      targetLetter: normalizedLetter,
      durationSeconds,
    },
  };
}

module.exports = { scoreVerbalFluency };
