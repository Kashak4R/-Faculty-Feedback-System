import Sentiment from 'sentiment';

const analyzer = new Sentiment();

export type SentimentResult = 'Positive' | 'Neutral' | 'Negative';

export function analyzeSentiment(text: string): SentimentResult {
  const result = analyzer.analyze(text);
  
  if (result.score > 0) {
    return 'Positive';
  } else if (result.score < 0) {
    return 'Negative';
  } else {
    return 'Neutral';
  }
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'Positive':
      return 'success';
    case 'Negative':
      return 'destructive';
    case 'Neutral':
      return 'neutral';
    default:
      return 'muted';
  }
}
