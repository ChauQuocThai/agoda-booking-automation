import { expect, test } from '../src/fixtures/booking';
import { MUONG_THANH_NHA_TRANG, PRICE_PATTERN, SECOND_ROOM_INDEX } from '../src/data/booking.data';
import { HotelOffer } from '../src/data/types';
import { PropertyPage } from '../src/pages/PropertyPage';
import { isoDateFromToday, toPaymentDate } from '../src/utils/date';

/** Two candidates is what the three-minute test timeout affords; see TC-001 A1. */
const MAX_HOTELS_TO_TRY = 2;

const booking = MUONG_THANH_NHA_TRANG;

test('a family of two adults and two children books the second room type', async ({ homePage }) => {
  const checkIn = isoDateFromToday(booking.dates.checkInOffsetDays);
  const checkOut = isoDateFromToday(booking.dates.checkOutOffsetDays);

  await test.step('Search for "Muong Thanh" and select the exact property from the auto-suggest', async () => {
    await homePage.destination.chooseProperty(booking.searchKeyword, booking.expectedSuggestion);
  });

  await test.step('Set the stay to 30 nights ahead for one room, two adults and two children aged 3 and 12', async () => {
    await homePage.dates.selectStay(checkIn, checkOut);
    await homePage.occupancy.apply(booking.occupancy);
    await expect(homePage.occupancy.box).toContainText(
      // String.raw, because a plain template literal would swallow the \s.
      new RegExp(String.raw`${booking.occupancy.childAges.length}\s*children`, 'i'),
    );
  });

  const results = await test.step('Search and confirm the selected hotel is listed', async () => {
    const searchResults = await homePage.submitSearch();
    await searchResults.waitForResults();
    await expect(searchResults.cardTitle(0)).toContainText(booking.hotelName);
    return searchResults;
  });

  const { property, offer } = await test.step('Open a listed hotel that has rooms for these dates', async () => {
    for (let index = 0; index < MAX_HOTELS_TO_TRY; index++) {
      const candidateOffer: HotelOffer = await results.offerAt(index);
      expect(candidateOffer.name, 'the card should name a hotel').not.toHaveLength(0);
      expect(candidateOffer.price, 'the card should advertise a price').toMatch(PRICE_PATTERN);

      const candidate: PropertyPage = await results.openProperty(index);
      const listsEnoughRoomTypes = await candidate.openBookingDetails(SECOND_ROOM_INDEX + 1);

      if (listsEnoughRoomTypes && (await candidate.hasBookableRooms())) {
        // A substituted property must never be silent in the report.
        test.info().annotations.push({ type: 'property booked', description: candidateOffer.name });
        return { property: candidate, offer: candidateOffer };
      }
      await candidate.dispose();
    }
    throw new Error(`No hotel in the first ${MAX_HOTELS_TO_TRY} results had a room available for ${checkIn}`);
  });

  await test.step('Confirm the property page shows the same hotel and a price', async () => {
    await expect(property.hotelName).toContainText(offer.name);
    await expect(property.price).toContainText(PRICE_PATTERN);
  });

  const roomType = await test.step('Take the second room type and book its first rate', async () => {
    const name = await property.roomTypeName(SECOND_ROOM_INDEX);
    expect(name, 'the second room type should be named').not.toHaveLength(0);
    return name;
  });

  const payment = await property.bookFirstRateOf(SECOND_ROOM_INDEX);

  await test.step('Confirm the payment page carries every earlier choice', async () => {
    await expect(payment.hotelName).toContainText(offer.name);
    await expect(payment.roomHeading).toContainText(roomType);
    await expect(payment.checkInDate).toContainText(toPaymentDate(checkIn));
    await expect(payment.checkOutDate).toContainText(toPaymentDate(checkOut));
    await expect(payment.roomPrice).toContainText(PRICE_PATTERN);
  });
});
