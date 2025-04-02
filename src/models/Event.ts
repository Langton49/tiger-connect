export interface Event {
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    organizer: string;
    image?: string;
    attendeeCount: number;
    category: string;
    studentOnly: boolean;
}

export const eventCategories = [
    "Academic",
    "Sports",
    "Cultural",
    "Social",
    "Career",
    "Club",
    "Other",
];

export const mockEvents: Event[] = [
    {
        id: "1",
        title: "Homecoming Week",
        description:
            "Join us for the annual Grambling State University Homecoming celebration! Events include parade, tailgating, football game, step show, and more.",
        startDate: new Date(2023, 10, 14),
        endDate: new Date(2023, 10, 20),
        location: "Various Locations on Campus",
        organizer: "GSU Student Activities",
        image: "https://wp.clutchpoints.com/wp-content/uploads/2023/10/Alabama-AM-spoils-Grambling-State_s-homecoming-celebration-45-24.jpeg?w=700",
        attendeeCount: 450,
        category: "Social",
        studentOnly: false,
    },
    {
        id: "2",
        title: "Business School Career Fair",
        description:
            "Connect with top employers looking to hire Grambling graduates. Bring your resume and dress professionally.",
        startDate: new Date(2023, 9, 28),
        endDate: new Date(2023, 9, 28),
        location: "Business Building, Main Hall",
        organizer: "College of Business",
        image: "https://marvel-b1-cdn.bc0a.com/f00000000290162/images.ctfassets.net/2htm8llflwdx/6WeV3DZlr9QuBzniZ2HUZV/27deecb53c2eb3bd2bfb8bd1b7839389/Shorelight_Career_Fair_Explainer.jpg?fit=thumb",
        attendeeCount: 120,
        category: "Career",
        studentOnly: true,
    },
    {
        id: "3",
        title: "World Famous Tiger Marching Band Performance",
        description:
            "Special performance by Grambling's legendary marching band before the big game.",
        startDate: new Date(2023, 10, 5),
        endDate: new Date(2023, 10, 5),
        location: "Eddie G. Robinson Stadium",
        organizer: "Music Department",
        image: "https://www.thenewsstar.com/gcdn/presto/2019/03/06/PMON/3c89bb78-da76-4d14-921b-a1dfd6dc1d55-MONBrd_07-09-2015_NewsStar_1_B001__2015_07_08_IMG_SHR_1019_GSU6.jpg_1_1_HOBA1HGB_L640429114_IMG_SHR_1019_GSU6.jpg_1_1_HOBA1HGB.jpg?width=640&height=425&fit=crop&format=pjpg&auto=webp",
        attendeeCount: 275,
        category: "Cultural",
        studentOnly: false,
    },
];
