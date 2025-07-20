import { useState } from 'react';
import { EchoQuestGame } from '@/components/EchoQuest/EchoQuestGame';
import { Button } from '@/components/ui/button';

const difficulties = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

const Index = () => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>("easy");
  const [selected, setSelected] = useState(false);

  if (!selected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">Select Difficulty</h1>
        <div className="flex gap-4">
          {difficulties.map((d) => (
            <Button
              key={d.value}
              onClick={() => {
                setDifficulty(d.value as 'easy' | 'medium' | 'hard');
                setSelected(true);
              }}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return <EchoQuestGame difficulty={difficulty} />;
};

export default Index;
