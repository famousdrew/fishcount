'use client';

interface ScoreDotsProps {
  score: number;
  maxScore: number;
}

export function ScoreDots({ score, maxScore }: ScoreDotsProps) {
  const dots = [];

  for (let i = 0; i < maxScore; i++) {
    dots.push(
      <span
        key={i}
        className={`
          w-2.5 h-2.5 rounded-full
          ${i < score ? 'bg-blue-600' : 'bg-gray-300'}
        `}
      />
    );
  }

  return (
    <div className="flex items-center gap-1" title={`Score: ${score}/${maxScore}`}>
      {dots}
    </div>
  );
}
