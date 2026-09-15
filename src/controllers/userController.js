const User = require("../models/User");
const AppError = require("../utils/AppError");
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const sort = req.query.sort || "name";
    const users = await User.find({
      name: {
        $regex: search,
        $options: "i",
      },
    })
      .sort(sort)
      .skip(skip)
      .limit(limit);
    res.json(users);
  } catch (err) {
    next(err);
  }
};
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: after,
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};
module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
