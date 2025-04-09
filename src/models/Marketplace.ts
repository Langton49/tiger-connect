import { supabaseCon } from "@/db_api/connection";

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: "New" | "Like New" | "Good" | "Fair" | "Poor";
  images: string[];
  category: string;
  seller_id: string;
  created_at: Date;
  status: "Available" | "Pending" | "Sold";
}

export const categories = [
  "Textbooks",
  "Electronics",
  "Furniture",
  "Clothing",
  "School Supplies",
  "Housing",
  "Transportation",
  "Other",
];

export const setListings = async (): Promise<MarketplaceItem[]> => {
  const newListing = await supabaseCon.getMarketPlaceListings();
  return newListing.data;
};

export const mockListings: MarketplaceItem[] = [];
//   {
//     id: "1",
//     title: "Calculus Textbook - 11th Edition",
//     description:
//       "Barely used calculus textbook. No highlighting or notes inside. Perfect condition.",
//     price: 45,
//     condition: "Like New",
//     images: ["https://m.media-amazon.com/images/I/91o9bkgthTL._SL1500_.jpg"],
//     category: "Textbooks",
//     sellerId: "1",
//     createdAt: new Date(2023, 8, 10),
//     status: "Available",
//   },
//   {
//     id: "2",
//     title: "Twin XL Bed Sheets - Black & Gold",
//     description:
//       "Grambling colors! Used for one semester. Freshly washed and in great condition.",
//     price: 25,
//     condition: "Like New",
//     images: ["https://m.media-amazon.com/images/I/71P1TSBPpfL._AC_SL1500_.jpg"],
//     category: "Housing",
//     sellerId: "2",
//     createdAt: new Date(2023, 7, 28),
//     status: "Available",
//   },
//   {
//     id: "3",
//     title: "TI-84 Plus Calculator",
//     description:
//       "Required for many math classes. Works perfectly. Comes with charging cable.",
//     price: 80,
//     condition: "Like New",
//     images: [
//       "https://i.etsystatic.com/39116723/r/il/bb8c09/6249058423/il_1588xN.6249058423_bg91.jpg",
//     ],
//     category: "Electronics",
//     sellerId: "3",
//     createdAt: new Date(2023, 9, 2),
//     status: "Available",
//   },
//   {
//     id: "4",
//     title: "MacBook Pro 2021 - 14 inch",
//     description:
//       "Lightly used MacBook Pro with M1 Pro chip, 16GB RAM, and 512GB SSD. Comes with original charger.",
//     price: 1800,
//     condition: "Like New",
//     images: ["/src/images/placeholder.png"],
//     category: "Electronics",
//     sellerId: "4",
//     createdAt: new Date(2023, 6, 15),
//     status: "Available",
//   },
//   {
//     id: "5",
//     title: "iPhone 13 Pro Max - 256GB",
//     description:
//       "Sierra Blue iPhone 13 Pro Max in excellent condition. No scratches or dents. Unlocked.",
//     price: 950,
//     condition: "Like New",
//     images: ["/src/images/placeholder.png"],
//     category: "Electronics",
//     sellerId: "5",
//     createdAt: new Date(2023, 5, 20),
//     status: "Available",
//   },
//   {
//     id: "6",
//     title: "Sony WH-1000XM4 Wireless Headphones",
//     description:
//       "Industry-leading noise canceling headphones. Barely used and in perfect working condition.",
//     price: 280,
//     condition: "Like New",
//     images: ["https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg"],
//     category: "Electronics",
//     sellerId: "6",
//     createdAt: new Date(2023, 4, 5),
//     status: "Available",
//   },
//   {
//     id: "7",
//     title: "Dell XPS 13 Laptop",
//     description:
//       "2021 model with Intel i7 processor, 16GB RAM, and 512GB SSD. Sleek and lightweight design.",
//     price: 1200,
//     condition: "Like New",
//     images: [
//       "https://i.dell.com/sites/csimages/App-Merchandizing_Images/all/xps-13-9310-laptop.jpg",
//     ],
//     category: "Electronics",
//     sellerId: "7",
//     createdAt: new Date(2023, 3, 10),
//     status: "Available",
//   },
//   {
//     id: "8",
//     title: "Nintendo Switch Console",
//     description:
//       "Neon Blue and Red Joy-Con. Comes with original box and all accessories.",
//     price: 300,
//     condition: "Like New",
//     images: ["https://m.media-amazon.com/images/I/61-PblYntsL._AC_SL1500_.jpg"],
//     category: "Gaming",
//     sellerId: "8",
//     createdAt: new Date(2023, 2, 22),
//     status: "Available",
//   },
//   {
//     id: "9",
//     title: "Kindle Paperwhite - 8GB",
//     description:
//       "Waterproof e-reader with adjustable warm light. Comes with a leather cover.",
//     price: 100,
//     condition: "Like New",
//     images: ["/src/images/placeholder.png"],
//     category: "Electronics",
//     sellerId: "9",
//     createdAt: new Date(2023, 1, 15),
//     status: "Available",
//   },
//   {
//     id: "10",
//     title: "GoPro HERO10 Black",
//     description:
//       "Latest model with 5.3K video recording. Includes extra battery and carrying case.",
//     price: 400,
//     condition: "Like New",
//     images: ["/src/images/placeholder.png"],
//     category: "Electronics",
//     sellerId: "10",
//     createdAt: new Date(2023, 0, 5),
//     status: "Available",
//   },
//   {
//     id: "11",
//     title: "Samsung Galaxy Tab S7 - 128GB",
//     description:
//       "11-inch Android tablet with S Pen included. Great for work and entertainment.",
//     price: 500,
//     condition: "Like New",
//     images: ["https://m.media-amazon.com/images/I/61VfL-aiToL._AC_SL1500_.jpg"],
//     category: "Electronics",
//     sellerId: "11",
//     createdAt: new Date(2022, 11, 20),
//     status: "Available",
//   },
// ];
