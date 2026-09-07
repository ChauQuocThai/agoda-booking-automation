/** Ages of the children travelling, one entry per child. */
export type ChildAges = readonly number[];

export interface Occupancy {
  rooms: number;
  adults: number;
  childAges: ChildAges;
}

export interface StayDates {
  /** Offsets from today, so the data never goes stale. */
  checkInOffsetDays: number;
  checkOutOffsetDays: number;
}

export interface BookingSearch {
  searchKeyword: string;
  /** Property name as rendered in the auto-suggest dropdown. */
  expectedSuggestion: string;
  /** Name used to match headings on the results, property and payment pages. */
  hotelName: string;
  dates: StayDates;
  occupancy: Occupancy;
}

/** What a search result card advertises before the property page is opened. */
export interface HotelOffer {
  name: string;
  price: string;
}
