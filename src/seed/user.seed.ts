import { logger, prisma } from "../config";
import {
  genEmail,
  genIsActive,
  genLatitude,
  genLongitude,
  genName,
  genPassword,
  genPhoneNumber,
} from "../helper";

const seedUsers = async () => {
  try {
    const users = Array.from({ length: 10 }).map(() => {
      const longitude = genLongitude();
      const latitude = genLatitude();

      return {
        name: genName(),
        email: genEmail(),
        password: genPassword(),
        phone_number: genPhoneNumber(),
        isActive: genIsActive(),
        curr_longitude: Number.isFinite(longitude) ? longitude : null,
        curr_latitude: Number.isFinite(latitude) ? latitude : null,
      };
    });

    console.log("Sample user:", users[0]);

    const result = await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    logger.info(`Seeded ${result.count} users with Indian data`);
    console.log(`Seeded ${result.count} users with Indian data`);
  } catch (error) {
    logger.error("Error seeding users:", error);
    console.error("Error seeding users:", error);
  }
};

seedUsers();
