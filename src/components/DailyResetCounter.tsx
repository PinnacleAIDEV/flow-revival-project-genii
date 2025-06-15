
import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { useDailyReset } from '../hooks/useDailyReset';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface DailyResetCounterProps {
  onReset?: () => void;
  showForceReset?: boolean;
}

export const DailyResetCounter: React.FC<DailyResetCounterProps> = ({ 
  onReset, 
  showForceReset = false 
}) => {
  const { timeUntilReset, isResetting, forceReset } = useDailyReset(onReset);

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Reset Diário 00:00 UTC</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Próximo reset em:</span>
                <span className="font-mono text-lg font-bold text-blue-600">
                  {timeUntilReset}
                </span>
                {isResetting && (
                  <span className="text-xs text-orange-600 animate-pulse">
                    Resetando...
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {showForceReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={forceReset}
              disabled={isResetting}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Manual</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
