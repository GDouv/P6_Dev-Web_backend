// La commande "require('module');" charge les modules qu'on utilisera dans l'application.
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

// Configuration de dotenv pour pouvoir utiliser les variables d'environnement.
dotenv.config();

const sauceRoutes = require("./routes/sauce");
const userRoutes = require("./routes/user");

// Mongoose est une bibliothèque permettant d'utiliser MongoDB avec Node.js.
mongoose
	.connect(
		`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`,
		{ useNewUrlParser: true, useUnifiedTopology: true }
	)
	.then(() => console.log("Connexion à MongoDB réussie !"))
	.catch(() => console.log("Connexion à MongoDB échouée !"));

// Création d'une application express.
const app = express();
app.use(express.json());

// On rend disponible dans l'application les images du fichier images.
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(cors());

app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
	);
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, DELETE, PATCH, OPTIONS"
	);
	next();
});

app.use("/api/sauces", sauceRoutes);
app.use("/api/auth", userRoutes);

module.exports = app;
