// utils/asyncHandler.js — lets route functions be async without try/catch
// in every route: any error is passed to the error handler in app.js.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
