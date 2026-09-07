import { BookingSearch } from './types';

export const MUONG_THANH_NHA_TRANG: BookingSearch = {
  searchKeyword: 'Muong Thanh',
  expectedSuggestion: 'Muong Thanh Luxury Khanh Hoa',
  hotelName: 'Muong Thanh Luxury Khanh Hoa',
  dates: {
    checkInOffsetDays: 30,
    checkOutOffsetDays: 31,
  },
  occupancy: {
    rooms: 1,
    adults: 2,
    childAges: [3, 12],
  },
};

/** Room index used in step 5 of the test case; the list is 0-based. */
export const SECOND_ROOM_INDEX = 1;

/**
 * Two digits at minimum, so the pattern rejects the stray single digits that
 * appear all over a property card — "Sleeps 2", "5 still available", "0".
 */
export const PRICE_PATTERN = /\d[\d.,]*\d/;
