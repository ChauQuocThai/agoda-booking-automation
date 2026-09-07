# TC-001 — Book the second room type for a family stay

| | |
|---|---|
| **Test case ID** | TC-001 |
| **Feature** | Hotel search and booking funnel |
| **Priority** | High — this is the revenue path |
| **Type** | End-to-end, functional |
| **Automated** | Yes — `tests/booking-flow.spec.ts` |

## Objective

Verify that a guest can search for a specific property, describe a family stay,
reach that property from the results, book the first rate of the second room
type, and arrive at a payment page that still reflects every earlier choice.

## Preconditions

- A browser with no Agoda session and no stored currency or region preference.
- The site is reachable at `https://www.agoda.com`.
- The stay dates are derived at run time, so the case never expires:
  check-in is today + 30 days and check-out is today + 31 days.

## Test data

| Field | Value |
|---|---|
| Search keyword | `Muong Thanh` |
| Property to select | `Muong Thanh Luxury Khanh Hoa, Nha Trang` |
| Check-in | current date + 30 days |
| Check-out | current date + 31 days |
| Rooms | 1 |
| Adults | 2 |
| Children | 2, aged 3 and 12 |
| Room type to book | the second one listed |
| Rate to book | the first "Book" button of that room type |

## Steps and expected results

| # | Step | Expected result |
|---|---|---|
| 1 | Open the home page and type `Muong Thanh` into the destination field | The auto-suggest panel opens and lists matching properties |
| 2 | Select `Muong Thanh Luxury Khanh Hoa, Nha Trang` from the panel | The destination field holds the selected property name |
| 3 | Set check-in to today + 30 days and check-out to today + 31 days | Both fields show the chosen days |
| 4 | Set 1 room, 2 adults and 2 children, then set the children's ages to 3 and 12 | The occupancy summary reads 2 adults, 2 children, 1 room |
| 5 | Submit the search | The results page opens and the first card is the selected property |
| 6 | Read the price advertised on that card | A price is displayed |
| 7 | Open the property from the results | The property page shows the same hotel name and a price |
| 8 | Scroll to the booking details section | The room grid loads and lists the available room types |
| 9 | Take the second room type and click its first **Book** button | The payment page opens |
| 10 | Compare the payment page against the earlier choices | Hotel name, room type, check-in date, check-out date and price all match what was selected |

## Alternative flow

**A1 — the selected property has no rooms for those dates.**
At step 8, if the room grid offers no bookable rate, or lists fewer room types
than the case needs, return to the results and repeat steps 7 to 10 with the
next property in the list. The remaining assertions then apply to that property
instead, and the run records which property was booked. The automated test
walks up to two results, which is what its three-minute timeout affords.

## Notes

- Prices and room names change daily, so the assertions check that a price is
  present and well formed, and that names carried forward match what was
  actually selected earlier in the same run — never a hard-coded amount.
- The test stops at the payment page. No booking is submitted and no personal
  or payment details are entered.
