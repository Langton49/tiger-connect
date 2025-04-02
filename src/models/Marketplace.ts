export interface MarketplaceItem {
    id: string;
    title: string;
    description: string;
    price: number;
    condition: "New" | "Like New" | "Good" | "Fair" | "Poor";
    images: string[];
    category: string;
    sellerId: string;
    createdAt: Date;
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

export const mockListings: MarketplaceItem[] = [
    {
        id: "1",
        title: "Calculus Textbook - 11th Edition",
        description:
            "Barely used calculus textbook. No highlighting or notes inside. Perfect condition.",
        price: 45,
        condition: "Like New",
        images: [
            "https://m.media-amazon.com/images/I/91o9bkgthTL._SL1500_.jpg",
        ],
        category: "Textbooks",
        sellerId: "1",
        createdAt: new Date(2023, 8, 10),
        status: "Available",
    },
    {
        id: "2",
        title: "Twin XL Bed Sheets - Black & Gold",
        description:
            "Grambling colors! Used for one semester. Freshly washed and in great condition.",
        price: 25,
        condition: "Good",
        images: [
            "https://m.media-amazon.com/images/I/71P1TSBPpfL.__AC_SX300_SY300_QL70_FMwebp_.jpg",
        ],
        category: "Housing",
        sellerId: "2",
        createdAt: new Date(2023, 7, 28),
        status: "Available",
    },
    {
        id: "3",
        title: "TI-84 Plus Calculator",
        description:
            "Required for many math classes. Works perfectly. Comes with charging cable.",
        price: 80,
        condition: "Good",
        images: [
            "https://i.etsystatic.com/39116723/r/il/bb8c09/6249058423/il_1588xN.6249058423_bg91.jpg",
        ],
        category: "Electronics",
        sellerId: "3",
        createdAt: new Date(2023, 9, 2),
        status: "Available",
    },
];
