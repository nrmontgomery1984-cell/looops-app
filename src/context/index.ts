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
  useHealth,
  useCalendar,
} from "./AppContext";

export type { UserProfile, AppState, AppAction } from "./AppContext";

// Firebase sync
export { FirebaseSyncProvider, useSyncStatus } from "./FirebaseSyncProvider";
