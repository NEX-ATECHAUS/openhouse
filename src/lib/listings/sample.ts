import type { Listing, SearchQuery } from "../types.ts";
import { findSuburb } from "../suburbs.ts";
import { weekdayOf } from "../time.ts";

// Sample listings for demo mode. Every one is made up: the streets do
// not exist and no home here is for sale. They are shaped like a real
// weekend in Croydon and Ringwood (units and townhouses near the budget,
// most open on Saturday in half-hour windows, a few midweek) so the
// planner can be tried with nothing connected. The screen marks them as
// sample data wherever they appear.

type Seed = {
  n: number;
  address: string;
  suburb: string;
  // Offset from the suburb centre, in degrees.
  dLat: number;
  dLng: number;
  beds: number;
  baths: number;
  cars: number;
  type: string;
  price: string;
  from: number | null;
  // weekday (0 Sunday to 6 Saturday), open, close.
  opens: [number, number, number][];
};

const h = (hour: number, minute = 0) => hour * 60 + minute;

const SEEDS: Seed[] = [
  { n: 1, address: "3/14 Wattlebird Lane", suburb: "Croydon", dLat: 0.004, dLng: -0.006, beds: 2, baths: 1, cars: 1, type: "Unit", price: "$540,000 - $590,000", from: 540000, opens: [[6, h(10), h(10, 30)], [3, h(17, 30), h(18)]] },
  { n: 2, address: "2/7 Ironbark Rise", suburb: "Croydon", dLat: -0.005, dLng: 0.007, beds: 2, baths: 1, cars: 1, type: "Unit", price: "$560,000 - $610,000", from: 560000, opens: [[6, h(10, 30), h(11)]] },
  { n: 3, address: "5/21 Lyrebird Court", suburb: "Croydon", dLat: 0.008, dLng: 0.004, beds: 3, baths: 1, cars: 1, type: "Townhouse", price: "$595,000 - $625,000", from: 595000, opens: [[6, h(11), h(11, 30)], [0, h(11), h(11, 30)]] },
  { n: 4, address: "1/9 Sugargum Walk", suburb: "Croydon South", dLat: 0.002, dLng: -0.004, beds: 2, baths: 1, cars: 2, type: "Unit", price: "$575,000", from: 575000, opens: [[6, h(11, 15), h(11, 45)]] },
  { n: 5, address: "4/30 Boobook Street", suburb: "Ringwood East", dLat: -0.003, dLng: 0.005, beds: 2, baths: 2, cars: 1, type: "Apartment", price: "$510,000 - $550,000", from: 510000, opens: [[6, h(12), h(12, 30)], [4, h(18), h(18, 30)]] },
  { n: 6, address: "12/2 Mannagum Parade", suburb: "Ringwood", dLat: 0.003, dLng: 0.006, beds: 2, baths: 2, cars: 1, type: "Apartment", price: "$495,000 - $540,000", from: 495000, opens: [[6, h(12, 30), h(13)]] },
  { n: 7, address: "6/45 Rosella Avenue", suburb: "Ringwood", dLat: -0.006, dLng: -0.005, beds: 3, baths: 2, cars: 1, type: "Townhouse", price: "Contact agent", from: null, opens: [[6, h(13), h(13, 30)]] },
  { n: 8, address: "2/18 Blackwood Close", suburb: "Ringwood", dLat: 0.007, dLng: -0.008, beds: 2, baths: 1, cars: 1, type: "Unit", price: "$600,000 - $640,000", from: 600000, opens: [[6, h(13, 30), h(14)], [0, h(13), h(13, 30)]] },
  { n: 9, address: "8 Correa Crescent", suburb: "Croydon", dLat: -0.009, dLng: -0.003, beds: 3, baths: 1, cars: 2, type: "House", price: "$720,000 - $790,000", from: 720000, opens: [[6, h(11), h(11, 30)]] },
  { n: 10, address: "9/3 Banksia Mews", suburb: "Ringwood East", dLat: 0.005, dLng: -0.004, beds: 1, baths: 1, cars: 1, type: "Apartment", price: "$380,000 - $410,000", from: 380000, opens: [[6, h(10), h(10, 30)]] },
  { n: 11, address: "3/11 Kurrajong Way", suburb: "Mooroolbark", dLat: -0.002, dLng: -0.006, beds: 2, baths: 1, cars: 1, type: "Unit", price: "$545,000 - $595,000", from: 545000, opens: [[6, h(10), h(10, 30)]] },
  { n: 12, address: "1/26 Heathbell Road", suburb: "Heathmont", dLat: 0.004, dLng: 0.003, beds: 2, baths: 1, cars: 1, type: "Unit", price: "$610,000 - $650,000", from: 610000, opens: [[6, h(14), h(14, 30)]] },
  { n: 13, address: "7/5 Silvereye Place", suburb: "Croydon South", dLat: -0.004, dLng: 0.006, beds: 2, baths: 1, cars: 1, type: "Unit", price: "Auction", from: null, opens: [[6, h(12), h(12, 30)]] },
  { n: 14, address: "10/60 Peppermint Grove, The Stringybark Residences, Building C", suburb: "Ringwood", dLat: -0.002, dLng: 0.009, beds: 2, baths: 1, cars: 1, type: "Apartment", price: "$470,000 - $515,000", from: 470000, opens: [[6, h(14, 30), h(15)], [3, h(17), h(17, 30)]] },
  { n: 15, address: "2/33 Quandong Street", suburb: "Kilsyth", dLat: 0.003, dLng: -0.005, beds: 3, baths: 2, cars: 2, type: "Townhouse", price: "$615,000 - $625,000", from: 615000, opens: [[6, h(13), h(13, 30)]] },
];

export function sampleListings(query: SearchQuery, suburbs: string[]): Listing[] {
  const weekday = weekdayOf(query.date);
  const wanted = new Set(suburbs.map((s) => s.toLowerCase()));
  const out: Listing[] = [];
  for (const seed of SEEDS) {
    if (!wanted.has(seed.suburb.toLowerCase())) continue;
    const centre = findSuburb(seed.suburb);
    if (centre === null) continue;
    const inspections = seed.opens
      .filter(([day]) => day === weekday)
      .map(([, open, close]) => ({ date: query.date, open, close }));
    if (inspections.length === 0) continue;
    out.push({
      id: `sample-${seed.n}`,
      source: "sample",
      address: `${seed.address}, ${seed.suburb}`,
      suburb: seed.suburb,
      lat: centre.lat + seed.dLat,
      lng: centre.lng + seed.dLng,
      approximate: false,
      bedrooms: seed.beds,
      bathrooms: seed.baths,
      carSpaces: seed.cars,
      propertyType: seed.type,
      priceText: seed.price,
      priceFrom: seed.from,
      url: null,
      inspections,
    });
  }
  return out;
}
