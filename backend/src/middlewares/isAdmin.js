export const isAdmin = (req, res, next) => {
  // asumo que auth ya setea req.user
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  // adaptá según tu modelo: role, isAdmin, etc.
  const role = req.user.role;
  if (role !== "admin") return res.status(403).json({ message: "Forbidden (admin only)" });

  next();
};
