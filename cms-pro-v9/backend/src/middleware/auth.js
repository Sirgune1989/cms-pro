function auth(req, res, next) {
  // Skip auth for TV screen endpoint and static uploads
  if (req.path.startsWith('/api/screen/') || req.path.startsWith('/api/uploads/')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
  }

  const token = authHeader.slice(7);
  if (token !== process.env.CMS_TOKEN) {
    return res.status(403).json({ error: 'Nieprawidłowy token' });
  }

  next();
}

module.exports = auth;
