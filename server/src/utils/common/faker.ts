import { faker } from "@faker-js/faker";

export const genName = () => {
  return faker.person.fullName();
};

export const genEmail = () => {
  return faker.internet.email();
};

export const genPhoneNumber = () => {
  const startDigit = faker.helpers.arrayElement(["9", "8", "7", "6"]);
  const restDigits = faker.string.numeric(9);
  return `+91${startDigit}${restDigits}`;
};

export const genPassword = () => {
  return faker.internet.password({ length: 8, pattern: /[a-zA-Z0-9]/ });
};

export const genCarModel = () => {
  return faker.vehicle.model();
};

export const genCarNumber = () => {
  return faker.vehicle.vrm();
};

export const genIsAvailable = () => {
  return faker.datatype.boolean();
};
