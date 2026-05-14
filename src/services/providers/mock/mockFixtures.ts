import type { ProviderMatch } from "@/services/matches/types";

export type MockFixturePack = {
  key:
    | "ipl-chase"
    | "super-over"
    | "collapse"
    | "low-scoring-thriller"
    | "odi-chase"
    | "t20-death-overs";
  match: ProviderMatch;
};

const now = Date.now();

function isoAfter(minutes: number) {
  return new Date(now + minutes * 60_000).toISOString();
}

export const mockFixturePacks: MockFixturePack[] = [
  {
    key: "ipl-chase",
    match: {
      id: "mock-ipl-chase-1",
      name: "Mumbai Indians vs Chennai Super Kings",
      matchType: "t20",
      status: "Live",
      venue: "Wankhede",
      dateTimeGMT: isoAfter(-10),
      teams: ["Mumbai Indians", "Chennai Super Kings"],
      teamInfo: [
        { name: "Mumbai Indians", shortname: "MI" },
        { name: "Chennai Super Kings", shortname: "CSK" },
      ],
      matchStarted: true,
      matchEnded: false,
    },
  },
  {
    key: "super-over",
    match: {
      id: "mock-super-over-1",
      name: "India vs Pakistan",
      matchType: "t20",
      status: "Live - Super Over",
      venue: "Dubai",
      dateTimeGMT: isoAfter(-20),
      teams: ["India", "Pakistan"],
      teamInfo: [
        { name: "India", shortname: "IND" },
        { name: "Pakistan", shortname: "PAK" },
      ],
      matchStarted: true,
      matchEnded: false,
    },
  },
  {
    key: "collapse",
    match: {
      id: "mock-collapse-1",
      name: "England vs Australia",
      matchType: "t20",
      status: "Live",
      venue: "Lords",
      dateTimeGMT: isoAfter(-35),
      teams: ["England", "Australia"],
      teamInfo: [
        { name: "England", shortname: "ENG" },
        { name: "Australia", shortname: "AUS" },
      ],
      matchStarted: true,
      matchEnded: false,
    },
  },
  {
    key: "low-scoring-thriller",
    match: {
      id: "mock-low-thriller-1",
      name: "Sri Lanka vs Bangladesh",
      matchType: "t20",
      status: "Live",
      venue: "Colombo",
      dateTimeGMT: isoAfter(-30),
      teams: ["Sri Lanka", "Bangladesh"],
      teamInfo: [
        { name: "Sri Lanka", shortname: "SL" },
        { name: "Bangladesh", shortname: "BAN" },
      ],
      matchStarted: true,
      matchEnded: false,
    },
  },
  {
    key: "odi-chase",
    match: {
      id: "mock-odi-chase-1",
      name: "India vs Australia",
      matchType: "odi",
      status: "Live",
      venue: "Ahmedabad",
      dateTimeGMT: isoAfter(-40),
      teams: ["India", "Australia"],
      teamInfo: [
        { name: "India", shortname: "IND" },
        { name: "Australia", shortname: "AUS" },
      ],
      matchStarted: true,
      matchEnded: false,
    },
  },
  {
    key: "t20-death-overs",
    match: {
      id: "mock-t20-death-1",
      name: "South Africa vs New Zealand",
      matchType: "t20",
      status: "Live",
      venue: "Cape Town",
      dateTimeGMT: isoAfter(-15),
      teams: ["South Africa", "New Zealand"],
      teamInfo: [
        { name: "South Africa", shortname: "SA" },
        { name: "New Zealand", shortname: "NZ" },
      ],
      matchStarted: true,
      matchEnded: false,
    },
  },
];

export const mockFixtures: ProviderMatch[] = mockFixturePacks.map((pack) => pack.match);
