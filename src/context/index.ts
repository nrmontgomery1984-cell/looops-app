// Re-export context

export {
  AppProvider,
  useApp,
  useUser,
  useLoops,
  useTasks,
  useProjects,
  useLabels,
  useGoals,
  useRoutines,
  useChallenges,
  useUI,
  useSystems,
  useHabits,
  useIntentions,
  useDashboards,
  useNotes,
  useChecklists,
  useJournal,
  useBabysitter,
  useBabysitterPortal,
  useHealth,
  useCalendar,
  useSmartSchedule,
  useMealPrep,
  useKitchenProfile,
  useRecipes,
  useWorkout,
  useGymProfile,
  useExercises,
  // Finance
  useFinance,
  useFinanceConnections,
  useFinanceAccounts,
  useFinanceTransactions,
  useFinanceCategories,
  useFinanceRules,
  useFinanceExpenses,
  useLoopBudgets,
  useMonthlyIncome,
  // Decisions
  useDecisions,
  useDecisionsList,
  useQuickDecisions,
} from "./AppContext";

export type { UserProfile, AppState, AppAction } from "./AppContext";

// Firebase sync
export { FirebaseSyncProvider, useSyncStatus } from "./FirebaseSyncProvider";
