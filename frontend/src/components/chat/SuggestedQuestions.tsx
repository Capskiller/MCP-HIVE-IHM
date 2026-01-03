import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUGGESTED_QUESTIONS } from '@/lib/constants';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-2xl font-semibold">MCP-HIVE SmartHub</h2>
        </div>
        <p className="text-muted-foreground max-w-md">
          Interrogez vos bases de données Hive en langage naturel.
          Posez une question ou choisissez une suggestion ci-dessous.
        </p>
      </div>

      {/* Suggestions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
        {SUGGESTED_QUESTIONS.map(question => (
          <Button
            key={question.id}
            variant="outline"
            className="h-auto py-4 px-4 text-left justify-start whitespace-normal"
            onClick={() => onSelect(question.text)}
          >
            <span className="line-clamp-2">{question.text}</span>
          </Button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-xs text-muted-foreground">
        Appuyez sur <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Entrée</kbd> pour envoyer,{' '}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift+Entrée</kbd> pour un saut de ligne
      </p>
    </div>
  );
}
