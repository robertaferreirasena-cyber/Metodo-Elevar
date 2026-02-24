import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BarChart3, Check } from 'lucide-react';

interface PollOption {
  text: string;
  votes: number;
}

interface PollMessageProps {
  question: string;
  options: PollOption[];
  userVote: number | null;
  totalVotes: number;
  onVote: (optionIndex: number) => void;
  endsAt?: string;
}

export function PollMessage({ question, options, userVote, totalVotes, onVote, endsAt }: PollMessageProps) {
  const hasVoted = userVote !== null;
  const isEnded = endsAt ? new Date(endsAt) < new Date() : false;
  const showResults = hasVoted || isEnded;

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="font-medium text-sm">{question}</p>
      </div>
      
      <div className="space-y-2">
        {options.map((option, index) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = userVote === index;
          
          return (
            <div key={index}>
              {showResults ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={cn("flex items-center gap-1", isSelected && "font-medium")}>
                      {isSelected && <Check className="h-3 w-3 text-primary" />}
                      {option.text}
                    </span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm h-auto py-2"
                  onClick={() => onVote(index)}
                >
                  {option.text}
                </Button>
              )}
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {totalVotes} voto{totalVotes !== 1 ? 's' : ''}
        {isEnded && ' • Enquete encerrada'}
      </p>
    </div>
  );
}
