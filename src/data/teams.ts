export type Player = {
  name: string;
  role: "BAT" | "BOWL" | "AR" | "WK";
};

export type Team = {
  name: string;
  short: string;
  squad: Player[];
};

export const teams: Team[] = [
  {
    name: "India",
    short: "IND",
    squad: [
      { name: "Rohit Sharma", role: "BAT" },
      { name: "Virat Kohli", role: "BAT" },
      { name: "Shubman Gill", role: "BAT" },
      { name: "KL Rahul", role: "WK" },
      { name: "Hardik Pandya", role: "AR" },
      { name: "Ravindra Jadeja", role: "AR" },
      { name: "Axar Patel", role: "AR" },
      { name: "Jasprit Bumrah", role: "BOWL" },
      { name: "Mohammed Shami", role: "BOWL" },
      { name: "Mohammed Siraj", role: "BOWL" },
      { name: "Kuldeep Yadav", role: "BOWL" },
      { name: "Ishan Kishan", role: "WK" },
      { name: "Surya Kumar Yadav", role: "BAT" },
      { name: "Ruturaj Gaikwad", role: "BAT" },
      { name: "Shardul Thakur", role: "AR" },
    ],
  },

  {
    name: "Australia",
    short: "AUS",
    squad: [
      { name: "David Warner", role: "BAT" },
      { name: "Travis Head", role: "BAT" },
      { name: "Steve Smith", role: "BAT" },
      { name: "Marnus Labuschagne", role: "BAT" },
      { name: "Glenn Maxwell", role: "AR" },
      { name: "Marcus Stoinis", role: "AR" },
      { name: "Alex Carey", role: "WK" },
      { name: "Pat Cummins", role: "BOWL" },
      { name: "Mitchell Starc", role: "BOWL" },
      { name: "Josh Hazlewood", role: "BOWL" },
      { name: "Adam Zampa", role: "BOWL" },
      { name: "Cameron Green", role: "AR" },
      { name: "Josh Inglis", role: "WK" },
      { name: "Ashton Agar", role: "AR" },
      { name: "Sean Abbott", role: "BOWL" },
    ],
  },

  {
    name: "England",
    short: "ENG",
    squad: [
      { name: "Jos Buttler", role: "WK" },
      { name: "Joe Root", role: "BAT" },
      { name: "Ben Stokes", role: "AR" },
      { name: "Jonny Bairstow", role: "WK" },
      { name: "Jason Roy", role: "BAT" },
      { name: "Moeen Ali", role: "AR" },
      { name: "Sam Curran", role: "AR" },
      { name: "Chris Woakes", role: "AR" },
      { name: "Mark Wood", role: "BOWL" },
      { name: "Jofra Archer", role: "BOWL" },
      { name: "Adil Rashid", role: "BOWL" },
      { name: "Liam Livingstone", role: "AR" },
      { name: "Phil Salt", role: "WK" },
      { name: "Reece Topley", role: "BOWL" },
      { name: "Harry Brook", role: "BAT" },
    ],
  },

  {
    name: "Pakistan",
    short: "PAK",
    squad: [
      { name: "Babar Azam", role: "BAT" },
      { name: "Mohammad Rizwan", role: "WK" },
      { name: "Fakhar Zaman", role: "BAT" },
      { name: "Imam-ul-Haq", role: "BAT" },
      { name: "Shadab Khan", role: "AR" },
      { name: "Iftikhar Ahmed", role: "AR" },
      { name: "Shaheen Afridi", role: "BOWL" },
      { name: "Haris Rauf", role: "BOWL" },
      { name: "Naseem Shah", role: "BOWL" },
      { name: "Mohammad Nawaz", role: "AR" },
      { name: "Asif Ali", role: "BAT" },
      { name: "Abdullah Shafique", role: "BAT" },
      { name: "Usama Mir", role: "BOWL" },
      { name: "Agha Salman", role: "AR" },
      { name: "Zaman Khan", role: "BOWL" },
    ],
  },

  {
    name: "South Africa",
    short: "SA",
    squad: [
      { name: "Quinton de Kock", role: "WK" },
      { name: "Temba Bavuma", role: "BAT" },
      { name: "Aiden Markram", role: "BAT" },
      { name: "Rassie van der Dussen", role: "BAT" },
      { name: "David Miller", role: "BAT" },
      { name: "Marco Jansen", role: "AR" },
      { name: "Andile Phehlukwayo", role: "AR" },
      { name: "Kagiso Rabada", role: "BOWL" },
      { name: "Anrich Nortje", role: "BOWL" },
      { name: "Tabraiz Shamsi", role: "BOWL" },
      { name: "Lungi Ngidi", role: "BOWL" },
      { name: "Reeza Hendricks", role: "BAT" },
      { name: "Heinrich Klaasen", role: "WK" },
      { name: "Bjorn Fortuin", role: "AR" },
      { name: "Gerald Coetzee", role: "BOWL" },
    ],
  },

  {
    name: "New Zealand",
    short: "NZ",
    squad: [
      { name: "Kane Williamson", role: "BAT" },
      { name: "Devon Conway", role: "WK" },
      { name: "Daryl Mitchell", role: "AR" },
      { name: "Glenn Phillips", role: "BAT" },
      { name: "Tom Latham", role: "WK" },
      { name: "James Neesham", role: "AR" },
      { name: "Mitchell Santner", role: "AR" },
      { name: "Trent Boult", role: "BOWL" },
      { name: "Tim Southee", role: "BOWL" },
      { name: "Lockie Ferguson", role: "BOWL" },
      { name: "Ish Sodhi", role: "BOWL" },
      { name: "Finn Allen", role: "BAT" },
      { name: "Will Young", role: "BAT" },
      { name: "Rachin Ravindra", role: "AR" },
      { name: "Matt Henry", role: "BOWL" },
    ],
  },
];