
export const getDailyResetTime = (): Date => {
  const now = new Date();
  const utcMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
  return utcMidnight;
};

export const getNextResetTime = (): Date => {
  const today = getDailyResetTime();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  return tomorrow;
};

export const getTimeUntilReset = (): number => {
  const nextReset = getNextResetTime();
  const now = new Date();
  return nextReset.getTime() - now.getTime();
};

export const formatTimeUntilReset = (): string => {
  const msUntilReset = getTimeUntilReset();
  const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
  const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((msUntilReset % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const shouldResetData = (lastResetTime: string | null): boolean => {
  if (!lastResetTime) return true;
  
  const lastReset = new Date(lastResetTime);
  const currentResetTime = getDailyResetTime();
  
  return lastReset < currentResetTime;
};
