import { faker } from "@faker-js/faker";

export const genName = () => {
  return faker.person.fullName();
};

export const genEmail = () => {
  return faker.internet.email();
};

export const genPhoneNumber = () => {
  const firstDigit = faker.helpers.arrayElement(["6", "7", "8", "9"]);
  const remainingDigits = faker.string.numeric(9);
  return firstDigit + remainingDigits;
};

export const genPassword = () => {
  return faker.internet.password({ length: 8, memorable: true });
};

export const genIsActive = () => {
  return faker.datatype.boolean();
};

export const genLongitude = (): number => {
  return parseFloat(faker.number.float({ min: 68.7, max: 97.25 }).toFixed(6));
};

export const genLatitude = (): number => {
  return parseFloat(faker.number.float({ min: 8.4, max: 37.6 }).toFixed(6));
};

export const genUserId = () => {
  const id = [
    "cmdwuixdw0002tudorkhwiexf",
    "cmdwuixdw0003tudobqgj7hr3",
    "cmdwuixdw0004tudokdtnob32",
    "cmdwuixdw0006tudo5kag578v",
    "cmdwuixdw0009tudobggonomd",
  ];

  const number = Math.floor(Math.random() * id.length);
  return id[number];
};

export const genRating = () => {
  return faker.number.int({ min: 1, max: 5 });
};

export const genTotalRides = () => {
  return faker.number.int({ min: 0, max: 100 });
};

export const genTotalEarnings = () => {
  return faker.number.int({ min: 0, max: 1000000 }) / 100;
};

export const genTotalDistance = () => {
  return faker.number.int({ min: 0, max: 100 }) / 10;
};

export const genTotalTime = () => {
  return faker.number.int({ min: 1000, max: 1000000 }) / 10;
};

export const genVehicleType = () => {
  return faker.helpers.arrayElement(["ECONOMY", "PREMIUM", "LUXURY"]);
};

export const genVehicleNo = () => {
  return faker.number.int({ min: 1000, max: 9999 });
};

export const seatCapacity = () => {
  return faker.number.int({ min: 1, max: 6 });
};

