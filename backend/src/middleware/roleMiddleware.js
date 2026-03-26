export const requireAdmin = (req, res, next) => {
    const role = (req.user?.role_name || '').toLowerCase();

    if (role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    next();
};