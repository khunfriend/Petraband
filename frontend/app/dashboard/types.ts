export type CalendarPerformanceDate = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  performance: { id: string; name: string; location: string | null };
};

export type CalendarPracticeDay = {
  id: string;
  date: string;
  scheduleId: string;
  scheduleTitle: string;
  performanceId: string;
  performanceName: string;
  slots: { startTime: string; endTime: string; label: string; isSpecial: boolean }[];
};
