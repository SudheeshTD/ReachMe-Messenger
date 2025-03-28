import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be atlease 6 Character" });
    }
    const user = await User.findOne({ email });

    if (user)
      return res
        .status(400)
        .json({ message: "User already exists, Please Signin " });

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalud user Data, Couldnt add user" });
    }
  } catch (error) {
    console.log("Error in Signup Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid User Credential" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid User Credential" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in Login Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged Out Successfully" });
  } catch (error) {
    console.log("Error in Logout Controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile Pic is required" });
    }

    // Validate base64 image size before upload
    const base64Size = (profilePic.length * 3) / 4;
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

    if (base64Size > maxSizeInBytes) {
      return res.status(413).json({
        message: "Image size too large. Maximum 5MB allowed.",
      });
    }

    // Add upload options to limit file size and type
    const uploadOptions = {
      folder: "profile_pics",
      max_bytes: maxSizeInBytes,
      allowed_formats: ["png", "jpg", "jpeg", "webp"],
    };

    const uploadResponse = await cloudinary.uploader.upload(
      profilePic,
      uploadOptions
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
    });
  } catch (error) {
    console.error("Error in Update Profile:", error);

    if (error.http_code === 413) {
      return res.status(413).json({
        message: "File size too large. Maximum 5MB allowed.",
      });
    }

    res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// export const updateProfile = async (req, res) => {
//   try {
//     const { profilePic } = req.body;

//     const userId = req.user._id;

//     if (!profilePic) {
//       return res.status(400).json({ message: "Profile Pic is required" });
//     }

//     const uploadResponse = await cloudinary.uploader.upload(profilePic);
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { profilePic: uploadResponse.secure_url },
//       { new: true }
//     );
//     res.status(200).json(updatedUser);
//   } catch (error) {
//     console.log("Error in Update Profile", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
