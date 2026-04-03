const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") { status = 400; message = `Invalid value: ${err.value}`; }
  if (err.code === 11000) { status = 409; message = `Duplicate: ${Object.keys(err.keyValue || {}).join(", ")}`; }
  if (err.name === "ValidationError") { status = 400; message = Object.values(err.errors).map((e) => e.message).join(", "); }

  if (process.env.NODE_ENV === "development") console.error(err);
  res.status(status).json({ message, ...(process.env.NODE_ENV === "development" && { stack: err.stack }) });
};

module.exports = { notFound, errorHandler };
