const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.getOneSauce = async (req, res) => {
	try {
		// Appeler une query sans exec() ni une callback renverrai un thenable et pas une promise.
		const sauce = await Sauce.findById(req.params.id).exec();
		res.status(200).json(sauce);
	} catch (err) {
		res.status(404).json({ err });
	}
};

exports.getAllSauces = async (req, res) => {
	try {
		const sauces = await Sauce.find({}).exec();
		res.status(200).json(sauces);
	} catch (err) {
		res.status(404).json({ err });
	}
};

exports.createSauce = (req, res) => {
	const sauceInput = JSON.parse(req.body.sauce);
	// Suppression de l'id de la requête (un id est généré automatiquement par MongoDB)
	delete sauceInput._id;
	// Supporession de l'userId de la requête (on utilise req.auth.userId)
	delete sauceInput._userId;
	const sauce = new Sauce({
		...sauceInput,
		userId: req.auth.userId,
		/* req.protocol récupère le protocole "http" ou "https" et req.get("host")
		récupère le début de l'URL ("localhost:4200" par exemple); */
		imageUrl: `${req.protocol}://${req.get("host")}/images/${
			req.file.filename
		}`,
	});

	try {
		sauce.save();
		res.status(201).json({
			message: `La sauce : ${sauce.name} ayant pour id ${sauce._id} a bien été créée !`,
		});
	} catch (err) {
		res.status(400).json({ err });
	}
};

exports.modifySauce = async (req, res) => {
	try {
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
			if (sauce.imageUrl != (null || undefined)) {
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
				res.status(200).json({
					message: `La sauce ${sauce.name} ayant pour id ${sauce._id} a bien été modifiée !`,
				});
			} catch (err) {
				res.status(401).json({ err });
			}
		}
	} catch (err) {
		res.status(400).json({ err });
	}
};

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
				// Si avec Postman par exemple on entre un chiffre autre que 0, 1 ou -1 :
				res.status(400).json({ message: "Requête incorrecte." });
		}
	} catch (err) {
		res.status(404).json({ err });
	}
};

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
						message: `La sauce : ${sauce.name} a bien été supprimée !`,
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
