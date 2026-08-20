const User = require("../models/User");
const getAllUsers = async (req, res) => {
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
    res.status(500).json({
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch user",
      error: err.message,
    });
  }
};
const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: after,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Failed to update user",
      error: err.message,
    });
  }
};
const deleteUser = async (req, res) => {
  try{
    const user = await User.findByIdAndDelete(req.params.id);
    if(!user){
      return res.status(404).json({message: "User not found"});
    }
    res.json({message: "User deleted successfully"});
  }catch(err){
    res.status(500).json({
      message: "Failed to delete user",
      error: err.message,
    });
  }
}
module.exports = {  getAllUsers, getUserById, updateUser, deleteUser };
