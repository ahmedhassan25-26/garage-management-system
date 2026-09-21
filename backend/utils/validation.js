const mongoose = require("mongoose");

const validationError = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

const assertObjectId = (value, field) => {
  if (!value || !mongoose.isValidObjectId(value)) {
    throw validationError(`${field} must be a valid ID`);
  }

  return value;
};

const finiteNumber = (value, field, { min = null } = {}) => {
  const number = Number(value);

  if (!Number.isFinite(number) || (min !== null && number < min)) {
    throw validationError(
      `${field} must be a finite number${min === 0 ? " greater than or equal to zero" : ""}`
    );
  }

  return number;
};

module.exports = {
  assertObjectId,
  finiteNumber,
  validationError,
};