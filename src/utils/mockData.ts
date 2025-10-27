// Temporary mock data while API issues are resolved
export const mockListings = [
  {
    id: '1',
    image: "/sandbox/IMG-SANDBOX_1.jpg",
    price: "$1,249,000",
    beds: 3,
    baths: 2,
    sqft: "1,650",
    address: "123 Maple St",
    hood: "Vancouver",
    status: "for-sale" as const,
    agent: "Sarah Johnson",
    latitude: 49.2827,
    longitude: -123.1207
  },
  {
    id: '2',
    image: "/sandbox/IMG-SANDBOX_2.jpg", 
    price: "$749,000",
    beds: 2,
    baths: 2,
    sqft: "980",
    address: "88 Queen St",
    hood: "Toronto",
    status: "price-reduced" as const,
    agent: "Mike Chen",
    latitude: 43.6532,
    longitude: -79.3832
  }
]

export const mockMarketData = [
  { month: "2024-01", median_price: 800000, sold_count: 45 },
  { month: "2024-02", median_price: 820000, sold_count: 52 },
  { month: "2024-03", median_price: 815000, sold_count: 48 }
]
