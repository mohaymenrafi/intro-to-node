import { test, expect } from "@jest/globals";

const add = (num1, num2) => num1 + num2;

test("add takes two numbers and returns their sum", () => {
  const result = add(3, 3);
  expect(result).toBe(6);
});
