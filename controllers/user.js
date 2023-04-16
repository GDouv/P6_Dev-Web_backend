const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cryptoJS = require("crypto-js");

const User = require("../models/User");

exports.signup = (req, res, next) => {
	//chiffrement de l'email avant de l'envoyer dans la base de données
	const emailCryptoJS = cryptoJS
		.HmacSHA256(req.body.email, process.env.CRYPTOJS_EMAIL)
		.toString();

	bcrypt
		.hash(req.body.password, 10)
		.then((hash) => {
			const user = new User({
				email: emailCryptoJS,
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
	//chiffrement de l'email entré par l'utilisateur pour comparer le SHA avant la connexion
	// Utiliser AES pour crypter l'email car c'est symétrique
	const emailCryptoJS = cryptoJS
		.HmacSHA256(req.body.email, process.env.CRYPTOJS_EMAIL)
		.toString();

	// let decrypted = cryptoJS
	// 	.HmacSHA256(emailCryptoJS, process.env.CRYPTOJS_EMAIL)
	// 	.toString();
	// console.log(decrypted);

	User.findOne({ email: emailCryptoJS })
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
							{ expiresIn: "2h" }
						),
					});
				})
				.catch((error) => res.status(500).json({ error }));
		})
		.catch((error) => res.status(500).json({ error }));
};
