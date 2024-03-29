const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cryptoJS = require("crypto-js");

const User = require("../models/User");

exports.signup = (req, res, next) => {
	// Chiffrement de l'email avant de l'envoyer dans la base de données
	const emailCryptoJS = cryptoJS.AES.encrypt(
		req.body.email,
		process.env.CRYPTOJS_EMAIL
	).toString();

	bcrypt
		.hash(req.body.password, 10)
		.then((hash) => {
			const user = new User({
				email: cryptoJS.AES.decrypt(
					emailCryptoJS,
					process.env.CRYPTOJS_EMAIL
				).toString(),
				password: hash,
			});
			user.save()
				.then(() =>
					res.status(201).json({ message: "Utilisateur créé !" })
				)
				.catch((error) => res.status(400).json({ error }));
		})
		.catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
	// Chiffrement de l'email entré par l'utilisateur pour comparer le hash avant la connexion
	const emailCryptoJS = cryptoJS.AES.encrypt(
		req.body.email,
		process.env.CRYPTOJS_EMAIL
	).toString();

	User.findOne({
		email: cryptoJS.AES.decrypt(
			emailCryptoJS,
			process.env.CRYPTOJS_EMAIL
		).toString(),
	})
		.then((user) => {
			if (!user) {
				return res.status(401).json({
					message: "Paire identifiant/mot de passe incorrecte",
				});
			}
			bcrypt
				.compare(req.body.password, user.password)
				.then((valid) => {
					if (!valid) {
						return res.status(401).json({
							message:
								"Paire identifiant/mot de passe incorrecte",
						});
					}
					res.status(200).json({
						userId: user._id,
						token: jwt.sign(
							{ userId: user._id },
							process.env.JWT_KEY,
							{ expiresIn: `${process.env.TOKEN_VALIDITY_TIME}` }
						),
					});
				})
				.catch((error) => res.status(403).json({ error }));
		})
		.catch((error) => res.status(500).json({ error }));
};
