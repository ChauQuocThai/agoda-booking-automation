# Agoda booking flow automation

End-to-end automation of the booking funnel on [agoda.com](https://www.agoda.com):
search for a specific property, describe a family stay, open the property from
the results, book the first rate of the second room type, and verify that the
payment page still reflects every earlier choice.

The test stops at the payment page. Nothing is booked and no personal or
payment details are entered.

## Technology stack

| | |
|---|---|
| Test runner | Playwright Test |
| Language | TypeScript, `strict` mode |
| Design | Page objects, with reusable component objects for the composite widgets |
| Reporting | Playwright HTML report, plus trace, screenshot and video on failure |

## Required tools and versions

| Tool | Version used | Notes |
|---|---|---|
| Node.js | 24.14.0 | 18 or newer is enough |
| npm | 11.6.1 | ships with Node |
| `@playwright/test` | 1.55.0 | pinned in `package.json` |
| TypeScript | 5.6.3 | type checking only; Playwright transpiles the tests |
| Git | 2.51 | |

## Setup

```bash
git clone <repository-url>
cd agoda-booking-automation
npm install
npx playwright install chromium
```

No environment variables and no configuration file are needed. The stay dates
are derived from the current date at run time, so the test data never expires.

## Project structure

```
├── playwright.config.ts          Timeouts, reporters, browser projects
├── tsconfig.json                 Strict compiler settings
├── test-cases/
│   └── TC-001-family-booking-flow.md    The test case in prose, including the alternative flow
├── src/
│   ├── data/
│   │   ├── types.ts              Occupancy, StayDates, BookingSearch, HotelOffer
│   │   └── booking.data.ts       The one booking scenario, as typed data
│   ├── utils/
│   │   ├── date.ts               Offsets from today, and the date formats the site prints
│   │   └── locators.ts           Named wrappers for Agoda's three hook attributes
│   ├── components/
│   │   ├── DestinationAutosuggest.ts   The search field and its suggestion panel
│   │   ├── StayDatePicker.ts           The two-month calendar
│   │   └── OccupancyPicker.ts          Rooms, adults, children and each child's age
│   ├── pages/
│   │   ├── BasePage.ts           Overlay dismissal and cross-tab navigation
│   │   ├── HomePage.ts           Composes the three form components
│   │   ├── SearchResultsPage.ts  Result cards, their names and prices
│   │   ├── PropertyPage.ts       Room grid, room types and their Book buttons
│   │   └── PaymentPage.ts        Read-only view of the booking summary
│   └── fixtures/
│       └── booking.ts            Supplies a home page that is loaded and clear of overlays
└── tests/
    └── booking-flow.spec.ts      TC-001, written as named steps
```

Locators and actions live in the page and component objects; assertions live in
the test. The page objects return state and never judge it, so the same methods
serve a positive and a negative check.

## Running the tests

The suite runs in two modes.

### Headless — no browser window

```bash
npm test
```

The browser runs without a visible window. This is the default in
`playwright.config.ts`, and the mode to use for CI and for a quick check: it is
the faster of the two and does not need a desktop session. A run takes roughly
45 seconds.

### Headed — a real browser window on screen

```bash
npm run test:headed
```

Chromium opens on screen and the test drives it while you watch, which is the
mode to use when demonstrating the flow or working out why a step behaves
oddly. It is pinned to a single worker so there is only ever one window to
follow, and it is a little slower than headless because the browser is actually
painting frames.

`--headed` on the command line overrides the config, so
`npx playwright test --headed` does the same thing.

### Other commands

```bash
npm run test:debug        # step through with the Playwright inspector
npm run typecheck         # tsc --noEmit
npm run report            # open the last HTML report
```

## Supported browsers and platforms

Verified on **Chromium** on Windows 10, five consecutive passing runs.

Firefox and WebKit are configured but excluded from a default run, because
Agoda serves them a different auto-suggest response and the property selection
does not complete. They can be enabled explicitly:

```bash
ALL_BROWSERS=1 npx playwright test
npx playwright install firefox webkit   # first time only
```

The suite claims only what has actually been measured; see *Known behaviour of
the site* below for why the site itself is the variable here.

## Test report

`npm test` writes an HTML report to `playwright-report/`; open it with
`npm run report`. Each test appears as the ten named steps of TC-001, so a
failure points at the step that broke rather than at a line number.

On failure Playwright also keeps, under `test-results/`:

- a trace, openable with `npx playwright show-trace <path>`, holding the DOM and
  network at the moment of failure
- a screenshot of every open tab
- a video of the run

## Known behaviour of the site

Agoda is A/B tested and personalised, which shapes several decisions in this
suite. These were measured, not assumed.

- **The search field is renamed between variants.** Its accessible name is
  either *"Enter a destination or property"* or *"Where would you like to go?"* —
  across five fresh sessions, both appeared. The field is therefore reached
  through the surrounding box, which was present in all five.
- **Suggestions are ranked per session.** Typing `Muong Thanh` does not always
  offer the wanted property. When it is missing, the component types the full
  property name and looks again.
- **Counter buttons are relabelled as their value changes.** *"Add Children"*
  becomes *"Add Child"* after the first click, so both forms are matched.
- **The child age fields are not `<select>` elements.** Each is a button that
  opens its own list, and the option reads *"3 years old"* rather than *"3"*.
  A decorative *"(Required)"* hint is painted over the control until an age is
  chosen, which is why that one click is forced.
- **Room rows load only when the grid enters the viewport,** and a tab opened in
  the background is throttled by the browser so they never load there. Every
  destination page is brought to the front, and the grid is scrolled to.
- **"The second room type" is not "the second Book button".** One room type
  offers several rates, so the first room type alone can hold four Book buttons.
  The room's block is resolved from its name to be sure the right rate is used.
- **Prices and room names change daily.** Assertions check that a price is
  present and well formed, and that names carried between pages match what was
  selected earlier in the same run. No amount is hard-coded.

## Waiting strategy

There is no fixed sleep anywhere in this repository, and no polling loop written
by hand.

Playwright waits for an element to be attached, visible, stable, enabled and
able to receive events before it acts on it, so a separate wait before each
action would be redundant. Where a condition is not a single element — a room
grid that has to fetch its rows, or a destination that may open in either the
current tab or a new one — the wait is expressed with a web-first assertion or
with `expect.poll`, both of which retry until the condition holds or the
timeout in `playwright.config.ts` expires. Timeouts live in that one file rather
than being spread through the page objects.
