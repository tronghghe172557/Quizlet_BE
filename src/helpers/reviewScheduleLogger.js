/**
 * 📚 Review Schedule Automation Logger
 * Debug và monitor automated review schedule system
 */

export class ReviewScheduleLogger {
  static logAutoCreation(userId, quizTitle, score, nextReviewDate) {
    console.log(`
🤖 [AUTO REVIEW SCHEDULE] - NEW CREATION
👤 User: ${userId}
📝 Quiz: ${quizTitle}
📊 Score: ${score}%
⏰ Next Review: ${nextReviewDate.toLocaleDateString()} (3 days)
✨ Status: AUTOMATION SUCCESSFUL
    `);
  }

  static logAutoUpdate(userId, quizTitle, score, oldInterval, newInterval, nextReviewDate) {
    const trend = newInterval > oldInterval ? '📈 HARDER' : 
                  newInterval < oldInterval ? '📉 EASIER' : 
                  '➡️ SAME';
    
    console.log(`
🤖 [AUTO REVIEW SCHEDULE] - UPDATE
👤 User: ${userId}
📝 Quiz: ${quizTitle}
📊 Score: ${score}%
🔄 Interval: ${oldInterval} → ${newInterval} days ${trend}
⏰ Next Review: ${nextReviewDate.toLocaleDateString()}
✨ Status: SPACED REPETITION APPLIED
    `);
  }

  static logError(operation, error, context = {}) {
    console.error(`
❌ [AUTO REVIEW SCHEDULE] - ERROR
🔧 Operation: ${operation}
📄 Error: ${error.message}
📋 Context: ${JSON.stringify(context, null, 2)}
⚠️ Impact: Submission still successful, automation failed
    `);
  }

  static logDailyReview(userId, quizzesCount) {
    console.log(`
🌅 [DAILY REVIEW CHECK]
👤 User: ${userId}
📚 Quizzes Due: ${quizzesCount}
📅 Date: ${new Date().toLocaleDateString()}
    `);
  }

  static logSpacedRepetitionTrend(score, intervalChange) {
    const algorithm = score >= 80 ? 'INCREASE interval (doing well)' :
                     score < 50 ? '🚨 IMMEDIATE RETRY (score too low!)' :
                     score < 60 ? 'DECREASE interval (needs practice)' :
                     'MAINTAIN interval (moderate performance)';

    console.log(`
🧠 [SPACED REPETITION ALGORITHM]
📊 Score: ${score}%
🎯 Strategy: ${algorithm}
🔄 Change: ${intervalChange}
💡 Logic: ${score < 50 ? 'Must retry today - no exceptions!' : 'Adaptive learning system active'}
    `);
  }

  static logImmediateRetry(userId, quizTitle, score, retryTime) {
    console.log(`
🚨 [IMMEDIATE RETRY TRIGGERED]
👤 User: ${userId}
📝 Quiz: ${quizTitle}
📊 Score: ${score}% (< 50% threshold)
⏰ Must Retry At: ${retryTime.toLocaleString()} (1 hour from now)
❌ Result: NO PASS - IMMEDIATE RETRY REQUIRED
🎯 Reason: Score too low for spaced repetition
    `);
  }
}

export default ReviewScheduleLogger;