import { describe, it, expect } from "vitest";
import { getPlayer } from "./playerUtils";

describe("getPlayer", () => {
  it("returns known player profile for Virat Kohli", () => {
    const profile = getPlayer("Virat Kohli");
    expect(profile.name).toBe("Virat Kohli");
    expect(profile.aggression).toBe(0.6);
    expect(profile.consistency).toBe(0.9);
  });

  it("returns known player profile for Pat Cummins", () => {
    const profile = getPlayer("Pat Cummins");
    expect(profile.name).toBe("Pat Cummins");
    expect(profile.wicketTaking).toBe(0.8);
  });

  it("returns known player profile for Mitchell Starc", () => {
    const profile = getPlayer("Mitchell Starc");
    expect(profile.wicketTaking).toBe(0.9);
  });

  it("returns a default profile for unknown player", () => {
    const profile = getPlayer("Unknown Player XYZ");
    expect(profile.name).toBe("Unknown Player XYZ");
    expect(profile.aggression).toBeGreaterThan(0);
    expect(profile.aggression).toBeLessThanOrEqual(0.95);
    expect(profile.consistency).toBeGreaterThan(0);
    expect(profile.wicketRisk).toBeGreaterThan(0);
  });

  it("returns consistent defaults for same name", () => {
    const p1 = getPlayer("Random Player");
    const p2 = getPlayer("Random Player");
    expect(p1.aggression).toBe(p2.aggression);
    expect(p1.consistency).toBe(p2.consistency);
  });

  it("returns different defaults for different names", () => {
    const p1 = getPlayer("Player Alpha");
    const p2 = getPlayer("Player Beta");
    const same = p1.aggression === p2.aggression && p1.consistency === p2.consistency;
    expect(same).toBe(false);
  });

  it("all 30 known players have valid profiles", () => {
    const knownPlayers = [
      "Virat Kohli", "Rohit Sharma", "Shubman Gill", "Hardik Pandya",
      "Ravindra Jadeja", "KL Rahul", "Suryakumar Yadav", "Jasprit Bumrah",
      "Mohammed Siraj", "Yuzvendra Chahal", "Mohammed Shami",
      "Pat Cummins", "Mitchell Starc", "David Warner", "Steve Smith",
      "Marnus Labuschagne", "Glenn Maxwell", "Travis Head", "Josh Inglis",
      "Josh Hazlewood", "Adam Zampa", "Marcus Stoinis",
      "Jos Buttler", "Ben Stokes", "Joe Root", "Jofra Archer",
      "Kane Williamson", "Trent Boult", "Quinton de Kock", "Kagiso Rabada",
      "Babar Azam", "Shaheen Afridi",
    ];

    for (const name of knownPlayers) {
      const profile = getPlayer(name);
      expect(profile.name).toBe(name);
      expect(profile.aggression).toBeGreaterThan(0);
      expect(profile.aggression).toBeLessThanOrEqual(1);
      expect(profile.consistency).toBeGreaterThan(0);
      expect(profile.consistency).toBeLessThanOrEqual(1);
    }
  });
});
