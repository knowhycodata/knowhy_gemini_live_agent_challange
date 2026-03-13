/**
 * DateTime Agent - Tarih/Saat Sorgulama Ajanı (Multi-Agent)
 * 
 * Yönelim testi (Test 4) sırasında ana ajandan bağımsız çalışır.
 * Görevleri:
 * - Güncel saat bilgisini sağlar
 * - Güncel tarih bilgisini sağlar (gün, ay, yıl, mevsim)
 * - Kullanıcının verdiği yönelim cevaplarını doğrular
 * - Şehir/ülke bilgisi doğrulama (IP bazlı yaklaşık konum)
 * 
 * Multi-Agent Mimarisi:
 *   Nöra (Ana Ajan) → tool call → DateTimeAgent → harici API/lokal saat
 *                                                → doğrulama sonucu → Nöra
 * 
 * NOT: Bu ajan LLM kullanmaz, tamamen deterministik çalışır.
 * Doğru cevap üretimi backend'de yapılır, LLM'e bırakılmaz.
 */

const { createLogger } = require('../lib/logger');

const log = createLogger('DateTimeAgent');

// Türkçe ay ve gün isimleri
const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const TURKISH_DAYS = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];

const SEASONS = {
  // Ay indeksi (0-11) → mevsim
  0: 'Kış', 1: 'Kış', 2: 'İlkbahar',
  3: 'İlkbahar', 4: 'İlkbahar', 5: 'Yaz',
  6: 'Yaz', 7: 'Yaz', 8: 'Sonbahar',
  9: 'Sonbahar', 10: 'Sonbahar', 11: 'Kış'
};

class DateTimeAgent {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.timezone = 'Europe/Istanbul'; // Varsayılan Türkiye
    this.verificationResults = [];
    
    log.info('DateTimeAgent oluşturuldu', { sessionId });
  }

  /**
   * Güncel tarih/saat bilgisini al
   * Harici API çağrısı simülasyonu + lokal saat
   */
  getCurrentDateTime() {
    const now = new Date();
    
    // Türkiye saatine çevir
    const trDate = new Date(now.toLocaleString('en-US', { timeZone: this.timezone }));
    
    const result = {
      year: trDate.getFullYear(),
      month: trDate.getMonth() + 1,
      monthName: TURKISH_MONTHS[trDate.getMonth()],
      day: trDate.getDate(),
      dayOfWeek: TURKISH_DAYS[trDate.getDay()],
      hour: trDate.getHours(),
      minute: trDate.getMinutes(),
      season: SEASONS[trDate.getMonth()],
      formattedDate: `${trDate.getDate()} ${TURKISH_MONTHS[trDate.getMonth()]} ${trDate.getFullYear()}`,
      formattedTime: `${String(trDate.getHours()).padStart(2, '0')}:${String(trDate.getMinutes()).padStart(2, '0')}`,
      timestamp: now.toISOString(),
      timezone: this.timezone,
    };
    
    log.info('Güncel tarih/saat', { 
      sessionId: this.sessionId, 
      date: result.formattedDate, 
      time: result.formattedTime,
      season: result.season 
    });
    
    return result;
  }

  /**
   * Kullanıcının yönelim cevabını doğrula
   * @param {string} questionType - 'day' | 'month' | 'year' | 'season' | 'city' | 'country' | 'time'
   * @param {string} userAnswer - Kullanıcının cevabı
   * @param {object} context - Ek bağlam (city, country vb.)
   */
  verifyOrientationAnswer(questionType, userAnswer, context = {}) {
    const dt = this.getCurrentDateTime();
    const normalizedAnswer = (userAnswer || '').toLocaleLowerCase('tr').trim();
    
    let correctAnswer = '';
    let isCorrect = false;
    let tolerance = '';

    switch (questionType) {
      case 'day': {
        // Gün - bugünün günü
        correctAnswer = dt.dayOfWeek;
        const dayLower = correctAnswer.toLocaleLowerCase('tr');
        isCorrect = normalizedAnswer.includes(dayLower) || dayLower.includes(normalizedAnswer);
        break;
      }
      
      case 'month': {
        // Ay
        correctAnswer = dt.monthName;
        const monthLower = correctAnswer.toLocaleLowerCase('tr');
        isCorrect = normalizedAnswer.includes(monthLower) || monthLower.includes(normalizedAnswer);
        // Ay numarası ile de kabul et
        if (!isCorrect && normalizedAnswer.includes(String(dt.month))) {
          isCorrect = true;
        }
        break;
      }
      
      case 'year': {
        // Yıl
        correctAnswer = String(dt.year);
        isCorrect = normalizedAnswer.includes(correctAnswer);
        break;
      }
      
      case 'season': {
        // Mevsim
        correctAnswer = dt.season;
        const seasonLower = correctAnswer.toLocaleLowerCase('tr');
        isCorrect = normalizedAnswer.includes(seasonLower) || seasonLower.includes(normalizedAnswer);
        // Mevsim geçişlerinde tolerans
        const monthIdx = dt.month - 1;
        const transitionMonths = [2, 5, 8, 11]; // Mart, Haziran, Eylül, Aralık
        if (!isCorrect && transitionMonths.includes(monthIdx)) {
          // Bir önceki mevsimi de kabul et
          const prevSeasonMonth = (monthIdx + 11) % 12;
          const prevSeason = SEASONS[prevSeasonMonth].toLocaleLowerCase('tr');
          if (normalizedAnswer.includes(prevSeason)) {
            isCorrect = true;
            tolerance = 'Mevsim geçiş dönemi toleransı';
          }
        }
        break;
      }
      
      case 'time': {
        // Saat - ±1 saat tolerans
        correctAnswer = dt.formattedTime;
        const hourMatch = normalizedAnswer.match(/(\d{1,2})/);
        if (hourMatch) {
          const userHour = parseInt(hourMatch[1]);
          isCorrect = Math.abs(userHour - dt.hour) <= 1;
          tolerance = '±1 saat tolerans';
        }
        // "öğleden sonra", "akşam" gibi yaklaşık cevapları da kontrol et
        if (!isCorrect) {
          const timeRanges = {
            'sabah': [6, 11],
            'öğle': [11, 14],
            'öğleden sonra': [12, 17],
            'akşam': [17, 21],
            'gece': [21, 6],
          };
          for (const [label, [start, end]] of Object.entries(timeRanges)) {
            if (normalizedAnswer.includes(label)) {
              if (start <= end) {
                isCorrect = dt.hour >= start && dt.hour <= end;
              } else {
                isCorrect = dt.hour >= start || dt.hour <= end;
              }
              if (isCorrect) {
                tolerance = `Yaklaşık zaman dilimi kabul edildi (${label})`;
              }
              break;
            }
          }
        }
        break;
      }
      
      case 'city': {
        // Şehir - context'ten veya varsayılan
        correctAnswer = context.city || 'belirsiz';
        if (correctAnswer !== 'belirsiz') {
          const cityLower = correctAnswer.toLocaleLowerCase('tr');
          isCorrect = normalizedAnswer.includes(cityLower) || cityLower.includes(normalizedAnswer);
        } else {
          // Şehir bilgisi yoksa, kullanıcının verdiği cevabı doğru kabul et
          // (ajan doğrulayamaz, bu genel bir yönelim sorusudur)
          isCorrect = normalizedAnswer.length > 1;
          correctAnswer = userAnswer; // Kullanıcının cevabını kabul et
          tolerance = 'Şehir doğrulanamadı - cevap kabul edildi';
        }
        break;
      }
      
      case 'country': {
        // Ülke
        correctAnswer = context.country || 'Türkiye';
        const countryLower = correctAnswer.toLocaleLowerCase('tr');
        isCorrect = normalizedAnswer.includes(countryLower) || 
                    normalizedAnswer.includes('türkiye') || 
                    normalizedAnswer.includes('turkey') ||
                    countryLower.includes(normalizedAnswer);
        break;
      }
      
      default:
        log.warn('Bilinmeyen soru tipi', { questionType, sessionId: this.sessionId });
        correctAnswer = 'bilinmeyen';
        isCorrect = false;
    }

    const verification = {
      questionType,
      userAnswer,
      correctAnswer,
      isCorrect,
      tolerance: tolerance || null,
      timestamp: new Date().toISOString(),
    };
    
    this.verificationResults.push(verification);
    
    log.info('Yönelim cevabı doğrulandı', { 
      sessionId: this.sessionId, 
      questionType,
      userAnswer: normalizedAnswer.substring(0, 50),
      correctAnswer,
      isCorrect 
    });
    
    return verification;
  }

  /**
   * Tüm yönelim sorularının doğru cevaplarını üret
   * Bu, submit_orientation'dan önce çağrılır.
   */
  generateCorrectAnswers(context = {}) {
    const dt = this.getCurrentDateTime();
    
    return {
      day: dt.dayOfWeek,
      month: dt.monthName,
      year: String(dt.year),
      season: dt.season,
      time: dt.formattedTime,
      city: context.city || 'belirsiz',
      country: context.country || 'Türkiye',
      generatedAt: dt.timestamp,
    };
  }

  /**
   * Doğrulama sonuçlarını getir
   */
  getVerificationResults() {
    return {
      results: this.verificationResults,
      totalQuestions: this.verificationResults.length,
      correctCount: this.verificationResults.filter(v => v.isCorrect).length,
    };
  }

  destroy() {
    log.info('DateTimeAgent temizlendi', { sessionId: this.sessionId });
  }
}

module.exports = { DateTimeAgent };
