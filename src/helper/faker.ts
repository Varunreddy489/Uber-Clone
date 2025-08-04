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
