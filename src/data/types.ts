/** Ages of the children travelling, one entry per child. */
export type ChildAges = readonly number[];

export interface Occupancy {
  rooms: number;
  adults: number;
  childAges: ChildAges;
}

export interface StayDates {
  /** Nights offset from today, so the data never goes stale. */
  checkInOffsetDays: number;
  checkOutOffsetDays: number;
}

export interface BookingSearch {
  searchKeyword: string;
  /** Full label as rendered in the auto-suggest dropdown. */
  expectedSuggestion: string;
  /** Hotel name on its own, used to match headings on later pages. */
  hotelName: string;
  dates: StayDates;
  occupancy: Occupancy;
}

export interface SelectedRoom {
  name: string;
  price: string;
}
