exports.getMe = (req, res) => {
    const { user } = req; // El middleware ya habrá verificado el JWT
    res.json({
      userId: user.id,
      email: user.email,
      plan: user.plan || 'Free'
    });
  };