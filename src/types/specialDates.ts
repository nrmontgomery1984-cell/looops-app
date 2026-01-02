// Special Dates tracking types for Family loop
// Track important dates like anniversaries, deaths, births for friends and family

export type SpecialDateType =
  | "birthday"
  | "wedding_anniversary"
  | "death_anniversary"
  | "birth_of_child"
  | "graduation"
  | "other";

export type SpecialDateCategory = "family" | "friend" | "colleague" | "other";

// A person associated with special dates
export type Person = {
  id: string;
  name: string;
  relationship: string; // e.g., "Mom", "Best Friend", "Brother-in-law"
  category: SpecialDateCategory;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

// A special date to remember
export type SpecialDate = {
  id: string;
  personId: string;
  personName: string; // Denormalized for display
  type: SpecialDateType;
  title: string; // e.g., "Mom's Birthday", "Dad's Passing"
  date: string; // YYYY-MM-DD (the actual date, year may vary by type)
  year?: number; // The year it happened (for anniversaries, deaths, births)
  recurring: boolean; // Should it remind every year?
  reminderAction?: "call" | "text" | "visit" | "gift" | "other";
  reminderMessage?: string; // Custom reminder text
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

// State slice for special dates tracking
export type SpecialDatesState = {
  people: Person[];
  dates: SpecialDate[];
};

// Get label for date type
export function getDateTypeLabel(type: SpecialDateType): string {
  switch (type) {
    case "birthday": return "Birthday";
    case "wedding_anniversary": return "Wedding Anniversary";
    case "death_anniversary": return "Remembrance Day";
    case "birth_of_child": return "Child's Birthday";
    case "graduation": return "Graduation";
    case "other": return "Special Date";
  }
}

// Get icon for date type
export function getDateTypeIcon(type: SpecialDateType): string {
  switch (type) {
    case "birthday": return "🎂";
    case "wedding_anniversary": return "💒";
    case "death_anniversary": return "🕯️";
    case "birth_of_child": return "👶";
    case "graduation": return "🎓";
    case "other": return "📅";
  }
}

// Get action verb for reminder
export function getReminderActionLabel(action?: SpecialDate["reminderAction"]): string {
  switch (action) {
    case "call": return "Call";
    case "text": return "Text";
    case "visit": return "Visit";
    case "gift": return "Send a gift to";
    case "other": return "Remember";
    default: return "Reach out to";
  }
}

// Factory function to create a new person
export function createPerson(
  name: string,
  relationship: string,
  category: SpecialDateCategory = "family",
  options?: Partial<Pick<Person, "phone" | "email" | "notes">>
): Person {
  return {
    id: `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    relationship,
    category,
    ...options,
    createdAt: new Date().toISOString(),
  };
}

// Factory function to create a new special date
export function createSpecialDate(
  personId: string,
  personName: string,
  type: SpecialDateType,
  title: string,
  date: string,
  options?: Partial<Pick<SpecialDate, "year" | "recurring" | "reminderAction" | "reminderMessage" | "notes">>
): SpecialDate {
  return {
    id: `specialdate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    personId,
    personName,
    type,
    title,
    date,
    recurring: options?.recurring ?? true, // Default to recurring
    ...options,
    createdAt: new Date().toISOString(),
  };
}

// Check if a special date is today
export function isSpecialDateToday(specialDate: SpecialDate, today?: Date): boolean {
  const checkDate = today || new Date();
  const todayMonth = checkDate.getMonth() + 1;
  const todayDay = checkDate.getDate();

  const [, month, day] = specialDate.date.split("-").map(Number);

  return month === todayMonth && day === todayDay;
}

// Check if a special date is within N days from today
export function isSpecialDateWithinDays(specialDate: SpecialDate, days: number, today?: Date): boolean {
  const checkDate = today || new Date();
  const currentYear = checkDate.getFullYear();

  // Parse the special date and set it to this year
  const [, month, day] = specialDate.date.split("-").map(Number);
  const specialDateThisYear = new Date(currentYear, month - 1, day);

  // If the date has already passed this year, check next year
  if (specialDateThisYear < checkDate) {
    specialDateThisYear.setFullYear(currentYear + 1);
  }

  const diffTime = specialDateThisYear.getTime() - checkDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= days;
}

// Get special dates happening today
export function getSpecialDatesToday(dates: SpecialDate[], today?: Date): SpecialDate[] {
  return dates.filter(d => d.recurring && isSpecialDateToday(d, today));
}

// Get upcoming special dates within N days
export function getUpcomingSpecialDates(dates: SpecialDate[], days: number = 7, today?: Date): SpecialDate[] {
  return dates
    .filter(d => d.recurring && isSpecialDateWithinDays(d, days, today))
    .sort((a, b) => {
      // Sort by how soon the date is
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      aDate.setFullYear(new Date().getFullYear());
      bDate.setFullYear(new Date().getFullYear());
      return aDate.getTime() - bDate.getTime();
    });
}

// Calculate years since event (for anniversaries)
export function getYearsSince(specialDate: SpecialDate, today?: Date): number | null {
  if (!specialDate.year) return null;
  const checkDate = today || new Date();
  return checkDate.getFullYear() - specialDate.year;
}

// Format the reminder message for today's stack
export function formatReminderMessage(specialDate: SpecialDate): string {
  const action = getReminderActionLabel(specialDate.reminderAction);
  const icon = getDateTypeIcon(specialDate.type);
  const years = getYearsSince(specialDate);

  let message = `${icon} ${action} ${specialDate.personName}`;

  if (specialDate.type === "birthday") {
    message = `${icon} ${action} ${specialDate.personName} - Happy Birthday!`;
  } else if (specialDate.type === "wedding_anniversary" && years) {
    message = `${icon} ${action} ${specialDate.personName} - ${years} year anniversary`;
  } else if (specialDate.type === "death_anniversary" && years) {
    message = `${icon} Remember ${specialDate.personName} - ${years} years`;
  } else if (specialDate.type === "birth_of_child" && years) {
    message = `${icon} ${specialDate.title} turns ${years}!`;
  }

  return message;
}

// Initial state
export const INITIAL_SPECIAL_DATES_STATE: SpecialDatesState = {
  people: [],
  dates: [],
};
