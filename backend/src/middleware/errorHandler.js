export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message || 'Something went wrong.';
  res.status(status).json({ error: message });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}