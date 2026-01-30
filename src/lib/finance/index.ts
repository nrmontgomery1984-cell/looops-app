// Finance module exports
// Export from service (main API for components)
export {
  connectSimplefin,
  syncSimplefin,
  categorizeTransactions,
  deduplicateTransactions,
  mergeAccounts,
  performFullSync,
  // Babysitter payment matching
  matchBabysitterPayments,
  getCurrentWeekReferenceCode,
} from "./service";

// Export SimpleFIN helpers if needed elsewhere
export {
  parseSetupToken,
  parseAccessUrl,
  cleanTransactionDescription,
  detectRecurringTransactions,
} from "./simplefin";
