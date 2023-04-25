const passwordValidator = require("password-validator");

const passwordSchema = new passwordValidator();

passwordSchema
	.is()
	.min(8) // Minimum length 8
	.is()
	.max(100) // Maximum length 100
	.has()
	.uppercase() // Must have uppercase letters
	.has()
	.lowercase() // Must have lowercase letters
	.has()
	.digits(2) // Must have at least 2 digits
	.has()
	.not()
	.spaces() // Should not have spaces
	.is()
	.not()
	.oneOf(["Passw0rd", "Password123"]); // Blacklist these values

module.exports = (req, res, next) => {
	function createErrorMessage() {
		const passwordValidationError = passwordSchema.validate(
			req.body.password,
			{ list: true }
		);
		let errorMessage = "Le mot de passe : ";
		if (passwordValidationError.indexOf("min") !== -1) {
			errorMessage += " doit contenir au moins 8 caractères;";
		}
		if (passwordValidationError.indexOf("max") !== -1) {
			errorMessage += " ne doit pas contenir plus de 100 caractères;";
		}
		if (passwordValidationError.indexOf("uppercase") !== -1) {
			errorMessage += " doit contenir au moins 1 lettre majuscule;";
		}
		if (passwordValidationError.indexOf("lowercase") !== -1) {
			errorMessage += " doit contenir au moins 1 lettre minuscule;";
		}
		if (passwordValidationError.indexOf("digits") !== -1) {
			errorMessage += " doit contenir au moins 2 chiffres;";
		}
		if (passwordValidationError.indexOf("spaces") !== -1) {
			errorMessage += " ne doit pas contenir d'espaces;";
		}
		return errorMessage;
	}

	if (passwordSchema.validate(req.body.password)) {
		next();
	} else {
		return res.status(400).json({
			error: createErrorMessage(),
		});
	}
};
