const jwt = require('jsonwebtoken')
const User = require('./../models/User');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    userName: req.body.userName,
    password: req.body.password,
  });

  createSendToken(newUser, 201, res);
});
exports.login = catchAsync(async (req, res, next) => {
  const { userName, password } = req.body;

  // 1) Check if email and password exist
  if (!userName || !password) {
    return next(new AppError('Please provide username and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ userName });
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect username or password', 401));
  }
  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});