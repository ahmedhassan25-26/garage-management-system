require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be provided"
    );
  }

  if (ADMIN_PASSWORD.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters");
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existingAdmin = await User.findOne({ role: "admin" });

  if (existingAdmin) {
    throw new Error("An administrator already exists");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    password,
    role: "admin",
    isActive: true,
  });

  console.log(`Administrator created for ${email}`);
};

connectDB()
  .then(createAdmin)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unable to create administrator:", error.message);
    process.exit(1);
  });