const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ==========================================
// Get all users
// ==========================================
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Get mechanics
// ==========================================
const getMechanics = async (req, res) => {
  try {
    const mechanics = await User.find({
      role: "mechanic",
      isActive: true,
    }).select("-password");

    res.status(200).json({
      count: mechanics.length,
      mechanics,
    });
  } catch (error) {
    console.error("Get mechanics error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Create user
// ==========================================
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "User with this email already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "receptionist",
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Update user
// ==========================================
const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      isActive,
    } = req.body;

    const user =
      await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined) {
      user.email = email;
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    if (password) {
      user.password =
        await bcrypt.hash(password, 10);
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// Delete user
// ==========================================
const deleteUser = async (req, res) => {
  try {
    const user =
      await User.findByIdAndDelete(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getUsers,
  getMechanics,
  createUser,
  updateUser,
  deleteUser,
};