import { logger, prisma } from "../config";
import {
  genEmail,
  genIsActive,
  genLatitude,
  genLongitude,
  genName,
  genPassword,
  genPhoneNumber,
  genRating,
  genTotalDistance,
  genTotalEarnings,
  genTotalRides,
  genTotalTime,
  genUserId,
} from "../helper";

const seedDriver = async () => {
  try {
    const drivers = Array.from({ length: 10 }).map(() => {
      const longitude = genLongitude();
      const latitude = genLatitude();

      return {
        userId: genUserId(),
        phone_number: genPhoneNumber(),
        rating: String(genRating()),
        isActive: genIsActive(),
        curr_longitude: Number.isFinite(longitude) ? longitude : null,
        curr_latitude: Number.isFinite(latitude) ? latitude : null,

        total_rides: genTotalRides(),
        total_earnings: genTotalEarnings(),
        total_distance: genTotalDistance(),
        total_time: genTotalTime(),
      };
    });

    console.log("Sample user:", drivers[0]);

    const result = await prisma.driver.createMany({
      data: drivers,
      skipDuplicates: true,
    });

    logger.info(`Seeded ${result.count} users with Indian data`);
    console.log(`Seeded ${result.count} users with Indian data`);
  } catch (error) {
    logger.error("Error seeding users:", error);
    console.error("Error seeding users:", error);
  }
};

seedDriver();
