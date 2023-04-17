const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.createSauce = (req, res) => {
	const sauceInput = JSON.parse(req.body.sauce);
	delete sauceInput._id;
	delete sauceInput._userId;
	const sauce = new Sauce({
		...sauceInput,
		userId: req.auth.userId,
		// req.protocol récupère le protocole "http" ou "https" et req.get("host") récupère le début de l'URL ("localhost:4200" par exemple);
		imageUrl: `${req.protocol}://${req.get("host")}/images/${
			req.file.filename
		}`,
	});

	try {
		sauce.save();
		res.status(201).json({ message: "Objet enregistré !" });
	} catch (err) {
		res.status(400).json({ err });
	}
};

// ES7
exports.modifySauce = async (req, res) => {
	try {
		/* let sauceObject = req.body.sauce
		 if (sauceObject !== undefined) {
			CODE ICI
		} */
		const sauceObject = req.file
			? {
					...JSON.parse(req.body.sauce),
					imageUrl: `${req.protocol}://${req.get("host")}/images/${
						req.file.filename
					}`,
			  }
			: { ...req.body };

		/* On supprime l'userId de la requête pour éviter que l'objet puisse être
		 réassigné à un autre utilisateur. */
		delete sauceObject._userId;
		const sauce = await Sauce.findById(req.params.id).exec();
		if (sauce.userId != req.auth.userId) {
			res.status(403).json({ message: "Unauthorized request." });
		} else {
			if (sauceObject.imageUrl != null) {
				const filename = sauce.imageUrl.split("images/")[1];
				fs.unlink(`images/${filename}`, (err) => {
					if (err) throw err;
				});
			}
			try {
				await Sauce.findByIdAndUpdate(req.params.id, {
					...sauceObject,
					_id: req.params.id,
				}).exec();
				res.status(200).json({ message: "Objet modifié!" });
			} catch (err) {
				res.status(401).json({ err });
			}
		}
	} catch (err) {
		res.status(400).json({ err });
	}
};

// ES7
exports.likeSauce = async (req, res) => {
	try {
		const sauce = await Sauce.findById(req.params.id).exec();
		switch (req.body.like) {
			case 1:
				if (
					!sauce.usersLiked.includes(req.body.userId) &&
					!sauce.usersDisliked.includes(req.body.userId)
				) {
					try {
						await Sauce.findByIdAndUpdate(req.params.id, {
							$inc: { likes: 1 },
							$push: { usersLiked: req.body.userId },
						});
						res.status(201).json({ message: "Like = 1" });
					} catch (err) {
						res.status(400).json({ err });
					}
				} else {
					res.status(400).json({
						message: "Impossible de liker la sauce !",
					});
				}
				break;
			case -1:
				if (
					!sauce.usersDisliked.includes(req.body.userId) &&
					!sauce.usersLiked.includes(req.body.userId)
				) {
					try {
						await Sauce.findByIdAndUpdate(req.params.id, {
							$inc: { dislikes: 1 },
							$push: { usersDisliked: req.body.userId },
						});
						res.status(201).json({ message: "Like = -1" });
					} catch (err) {
						res.status(400).json({ err });
					}
				} else {
					res.status(400).json({
						message: "Impossible de disliker la sauce !",
					});
				}
				break;
			case 0:
				if (sauce.usersLiked.includes(req.body.userId)) {
					try {
						await Sauce.findByIdAndUpdate(req.params.id, {
							$inc: { likes: -1 },
							$pull: { usersLiked: req.body.userId },
						});
						res.status(201).json({ message: "Like = 0" });
					} catch (err) {
						res.status(400).json({ err });
					}
				} else if (sauce.usersDisliked.includes(req.body.userId)) {
					try {
						await Sauce.findByIdAndUpdate(req.params.id, {
							$inc: { dislikes: -1 },
							$pull: { usersDisliked: req.body.userId },
						});
						res.status(201).json({ message: "Like = 0" });
					} catch (err) {
						res.status(400).json({ err });
					}
				} else {
					res.status(400).json({
						message: "Pas de like ou dislike à supprimer !",
					});
				}
				break;
			default:
				alert("Unknown sauce or user");
		}
	} catch (err) {
		res.status(404).json({ err });
	}
};

//ES7
exports.deleteSauce = async (req, res) => {
	try {
		const sauce = await Sauce.findById(req.params.id).exec();
		if (sauce.userId != req.auth.userId) {
			res.status(403).json({ message: "Unauthorized request." });
		} else {
			const filename = sauce.imageUrl.split("images/")[1];
			fs.unlink(`images/${filename}`, async () => {
				try {
					await Sauce.findByIdAndDelete(req.params.id).exec();
					res.status(200).json({
						message: "Objet supprimé !",
					});
				} catch (err) {
					res.status(401).json({ err });
				}
			});
		}
	} catch (err) {
		res.status(404).json({ err });
	}
};

// ES7
exports.getOneSauce = async (req, res) => {
	try {
		const sauce = await Sauce.findById(req.params.id).exec(); // Appeler une query sans exec() ni une callback renverrai un thenable et non pas une promise.
		res.status(200).json(sauce);
	} catch (err) {
		res.status(404).json({ err });
	}
};

// ECMAScript7 (ES7 : 2016), toujours valable, async/await
exports.getAllSauces = async (req, res) => {
	try {
		const sauces = await Sauce.find({})
			//.select("imageUrl name heat mainPepper") // .select permet de ne charger que les propriétés précisées, ou inversement de ne pas charger "-propriété" (avec un - devant)
			.exec();
		res.status(200).json(sauces);
	} catch (err) {
		res.status(404).json({ err });
	}
};
