export function fail(
  value: unknown,
  message = 'Assertion Error',
): asserts value {
  if (!value) {
    throw new Error(message);
  }
}
