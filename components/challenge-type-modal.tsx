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
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trophy } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface ChallengeTypeModalProps {
  onCreateChallenge: (challengeType: number) => Promise<void>;
  isCreating: boolean;
  activeChallenges?: Array<{
    challengeType: number;
    status: "active" | "pending" | "completed" | "finished";
  }>;
}

export function ChallengeTypeModal({ onCreateChallenge, isCreating, activeChallenges = [] }: ChallengeTypeModalProps) {
  const { t } = useLanguage()
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  // Challenge type definitions with translations
  const CHALLENGE_TYPES = [
    {
      id: 0,
      name: `${t('oneWeek')} ${t('challenge')}`,
      duration: t('oneWeek')
    },
    {
      id: 1,
      name: `${t('oneMonth')} ${t('challenge')}`,
      duration: t('oneMonth')
    },
    {
      id: 2,
      name: `${t('threeMonths')} ${t('challenge')}`,
      duration: t('threeMonths')
    },
    {
      id: 3,
      name: `${t('sixMonths')} ${t('challenge')}`,
      duration: t('sixMonths')
    },
    {
      id: 4,
      name: `${t('oneYear')} ${t('challenge')}`,
      duration: t('oneYear')
    }
  ];

  // Check if a challenge type is already active
  const isTypeActive = (challengeType: number) => {
    return activeChallenges.some(challenge => 
      challenge.challengeType === challengeType && challenge.status === "active"
    );
  };

  // Check if the selected type is active
  const selectedTypeIsActive = selectedType !== null ? isTypeActive(selectedType) : false;

  const handleCreate = async () => {
    if (selectedType !== null && !selectedTypeIsActive) {
      try {
        await onCreateChallenge(selectedType);
        // Close the modal when transaction is confirmed or rejected
        setOpen(false);
      } catch (error) {
        // Keep the modal open if there's an error to allow retrying
        console.error("Error creating challenge:", error);
      }
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
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('createNewChallenge')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('selectChallengeType')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup 
            value={selectedType?.toString() || ""} 
            onValueChange={(value) => setSelectedType(parseInt(value))}
            className="space-y-3"
          >
            {CHALLENGE_TYPES.map((type) => {
              const typeIsActive = isTypeActive(type.id);
              return (
                <div
                  key={type.id}
                  className={`flex items-start space-x-2 rounded-md border p-3 ${
                    selectedType === type.id 
                      ? "border-primary bg-primary/5" 
                      : typeIsActive 
                      ? "border-muted bg-muted/20 opacity-50" 
                      : "border-border"
                  }`}
                >
                  <RadioGroupItem 
                    value={type.id.toString()} 
                    id={`type-${type.id}`} 
                    className="mt-1"
                    disabled={typeIsActive}
                  />
                  <div className="flex-1 space-y-1">
                    <Label 
                      htmlFor={`type-${type.id}`} 
                      className={`flex items-center justify-between ${
                        typeIsActive ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-medium text-base ${typeIsActive ? "text-muted-foreground" : ""}`}>
                          {type.name}
                        </span>
                        {typeIsActive && (
                          <span className="text-sm text-orange-500 font-medium mt-1">
                            {t('alreadyActive')}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {type.duration}
                      </span>
                    </Label>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="text-base">
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={selectedType === null || isCreating || selectedTypeIsActive}
            className="text-base"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('creating')}...
              </>
            ) : selectedTypeIsActive ? (
              t('challengeAlreadyActive')
            ) : (
              t('createChallenge')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 