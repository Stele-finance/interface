"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, Trophy, Calendar } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface ChallengeTypeModalProps {
  onCreateChallenge: (challengeType: number) => Promise<void>;
  isCreating: boolean;
  activeChallenges?: Array<{
    challengeType: number;
    status: "active" | "pending" | "completed" | "end";
  }>;
}

export function ChallengeTypeModal({ onCreateChallenge, isCreating }: ChallengeTypeModalProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false);

  // Always create 1 week challenge (challengeType: 0)
  const handleCreate = async () => {
    try {
      await onCreateChallenge(0); // 0 = One Week Challenge
      setOpen(false);
    } catch (error) {
      console.error("Error creating challenge:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
        >
          <Plus className="mr-3 h-5 w-5" />
          {t('createChallenge')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] bg-muted/80 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            {t('createNewChallenge')}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {t('createNewChallenge')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-2 border-orange-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-100">{t('oneWeek')} {t('challenge')}</h3>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{t('duration')}: 7 {t('days')}</span>
                </div>
              </div>
              <div className="bg-orange-500/20 px-4 py-2 rounded-full">
                <span className="text-orange-400 font-semibold">{t('oneWeek')}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="text-base bg-muted/40 border-gray-600 hover:bg-muted/60"
            disabled={isCreating}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="text-base bg-orange-500 hover:bg-orange-600"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('creating')}...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {t('create')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 