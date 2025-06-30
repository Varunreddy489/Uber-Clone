import { prisma } from "../config";
import {
  genCarModel,
  genCarNumber,
  genIsAvailable,
  genName,
  genPhoneNumber,
} from "../utils/common";

async function seedDrivers() {
  const drivers = Array.from({ length: 10 }).map(() => ({
    name: genName(),
    phone: genPhoneNumber(),
    carModel: genCarModel(),
    carNumber: genCarNumber(),
    isAvailable: genIsAvailable(),
  }));

  const result = await prisma.driver.createMany({
    data: drivers,
    skipDuplicates: true,
  });

  console.log("Drivers seeded:", result);
}

seedDrivers()
  .catch((e) => {
    console.error("Error seeding drivers:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
