import { expect, test } from '../src/fixtures/booking';
import { MUONG_THANH_NHA_TRANG, PRICE_PATTERN, SECOND_ROOM_INDEX } from '../src/data/booking.data';
import { HotelOffer } from '../src/data/types';
import { PropertyPage } from '../src/pages/PropertyPage';
import { isoDateFromToday, toShortDate } from '../src/utils/date';

/** How far down the results to look when the searched hotel is fully booked. */
const MAX_HOTELS_TO_TRY = 4;

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
    expect(await homePage.occupancy.summary()).toContain('2 children');
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
      expect(candidateOffer.price, 'the card should advertise a price').toMatch(PRICE_PATTERN);

      const candidate: PropertyPage = await results.openProperty(index);
      await candidate.openBookingDetails();

      if (await candidate.hasBookableRooms()) {
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
    expect(await property.roomTypeCount()).toBeGreaterThan(SECOND_ROOM_INDEX);
    return property.roomTypeName(SECOND_ROOM_INDEX);
  });

  const payment = await property.bookFirstRateOf(SECOND_ROOM_INDEX);

  await test.step('Confirm the payment page carries every earlier choice', async () => {
    expect(payment.url).toContain('/book/');
    await expect(payment.hotelName).toContainText(offer.name);
    await expect(payment.roomHeading).toContainText(roomType);
    await expect(payment.checkInDate).toContainText(toShortDate(checkIn));
    await expect(payment.checkOutDate).toContainText(toShortDate(checkOut));
    await expect(payment.roomPrice).toContainText(PRICE_PATTERN);
  });
});
