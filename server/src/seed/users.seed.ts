import { faker } from "@faker-js/faker";
import { prisma } from "../config";
import {
  genEmail,
  genName,
  genPassword,
  genPhoneNumber,
} from "../utils/common";

async function seedUsers() {
  const users = Array.from({ length: 10 }).map(() => ({
    name: genName(),
    email: genEmail(),
    password: genPassword(),
    phone: genPhoneNumber(),
  }));

  const result = await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log("Users seeded:", result);
}

seedUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
