const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.createSauce = (req, res) => {
    const sauceInput = JSON.parse(req.body.sauce);
    console.log("createSauce ---> req.body.sauce : ");
    console.log(req.body.sauce);
    delete sauceInput._id;
    delete sauceInput._userId;
    const sauce = new Sauce({
        ...sauceInput,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
            req.file.filename
        }`,
    });

    sauce.save();
    try {
        res.status(201).json({ message: "Objet enregistré !" });
    } catch (err) {
        res.status(400).json({ err });
    }
};

// ES7
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

        delete sauceObject._userId;
        const sauce = await Sauce.findById(req.params.id).exec();
        if (sauce.userId != req.auth.userId) {
            res.status(403).json({ message: "Unauthorized request." });
        } else {
            if (sauceObject.imageUrl != null) {
                const filename = sauce.imageUrl.split("images/")[1];
                fs.unlink(`images/${filename}`, (err) => {
                    if (err) throw err;
                    console.log("Ancienne image supprimée.");
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
                if (!sauce.usersLiked.includes(req.body.userId)) {
                    try {
                        await Sauce.findByIdAndUpdate(req.params.id, {
                            $inc: { likes: 1 },
                            $push: { usersLiked: req.body.userId },
                        });
                        res.status(201).json({ message: "Like = 1" });
                    } catch (err) {
                        res.status(400).json({ err });
                    }
                }
                break;
            case -1:
                if (!sauce.usersDisliked.includes(req.body.userId)) {
                    try {
                        await Sauce.findByIdAndUpdate(req.params.id, {
                            $inc: { dislikes: 1 },
                            $push: { usersDisliked: req.body.userId },
                        });
                        res.status(201).json({ message: "Like = -1" });
                    } catch (err) {
                        res.status(400).json({ err });
                    }
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
                }
                break;
            default:
                console.log("Unknown sauce or user");
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
        res.status(500).json({ err });
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
            .select("imageUrl name heat mainPepper") // .select permet de ne charger que les propriétés précisées, ou inversement de ne pas charger "-propriété" (avec un - devant)
            .exec();
        res.status(200).json(sauces);
    } catch (err) {
        res.status(500).json({ err });
    }
};

// ES6
// exports.createSauce = (req, res) => {
//     const sauceInput = JSON.parse(req.body.sauce);
//     console.log("createSauce ---> req.body.sauce : ");
//     console.log(req.body.sauce);
//     delete sauceInput._id;
//     delete sauceInput._userId;
//     const sauce = new Sauce({
//         ...sauceInput,
//         userId: req.auth.userId,
//         imageUrl: `${req.protocol}://${req.get("host")}/images/${
//             req.file.filename
//         }`,
//     });

//     sauce
//         .save()
//         .then(() => {
//             res.status(201).json({ message: "Objet enregistré !" });
//         })
//         .catch((error) => {
//             res.status(400).json({ error });
//         });
// };

// ES6
// exports.modifySauce = (req, res) => {
//     const sauceObject = req.file
//         ? {
//               ...JSON.parse(req.body.sauce),
//               imageUrl: `${req.protocol}://${req.get("host")}/images/${
//                   req.file.filename
//               }`,
//           }
//         : { ...req.body };

//     delete sauceObject._userId;
//     Sauce.findById(req.params.id)
//         .then((sauce) => {
//             if (sauce.userId != req.auth.userId) {
//                 res.status(403).json({ message: "Unauthorized request." });
//             } else {
//                 Sauce.findByIdAndUpdate(req.params.id, {
//                     ...sauceObject,
//                     _id: req.params.id,
//                 })
//                     .then(() =>
//                         res.status(200).json({ message: "Objet modifié!" })
//                     )
//                     .catch((error) => res.status(401).json({ error }));
//             }
//         })
//         .catch((error) => {
//             res.status(400).json({ error });
//         });
// };

// ES6
// exports.likeSauce = (req, res) => {
//     Sauce.findById(req.params.id)
//         .then((sauce) => {
//                 switch (req.body.like) {
//                     case 1:
//                         if (!sauce.usersLiked.includes(req.body.userId)) {
//                             Sauce.findByIdAndUpdate(req.params.id, {
//                                 $inc: { likes: 1 },
//                                 $push: { usersLiked: req.body.userId },
//                             })
//                                 .then(() =>
//                                     res
//                                         .status(201)
//                                         .json({ message: "Like = 1" })
//                                 )
//                                 .catch((error) =>
//                                     res.status(400).json({ error })
//                                 );
//                         }
//                         break;
//                     case -1:
//                         if (!sauce.usersDisliked.includes(req.body.userId)) {
//                             Sauce.findByIdAndUpdate(req.params.id, {
//                                 $inc: { dislikes: 1 },
//                                 $push: { usersDisliked: req.body.userId },
//                             })
//                                 .then(() =>
//                                     res
//                                         .status(201)
//                                         .json({ message: "Like = -1" })
//                                 )
//                                 .catch((error) =>
//                                     res.status(400).json({ error })
//                                 );
//                         }
//                         break;
//                     case 0:
//                         if (sauce.usersLiked.includes(req.body.userId)) {
//                             Sauce.findByIdAndUpdate(req.params.id, {
//                                 $inc: { likes: -1 },
//                                 $pull: { usersLiked: req.body.userId },
//                             })
//                                 .then(() =>
//                                     res
//                                         .status(201)
//                                         .json({ message: "Like = 0" })
//                                 )
//                                 .catch((error) =>
//                                     res.status(400).json({ error })
//                                 );
//                         } else if (
//                             sauce.usersDisliked.includes(req.body.userId)
//                         ) {
//                             Sauce.findByIdAndUpdate(req.params.id, {
//                                 $inc: { dislikes: -1 },
//                                 $pull: { usersDisliked: req.body.userId },
//                             })
//                                 .then(() =>
//                                     res
//                                         .status(201)
//                                         .json({ message: "Like = 0" })
//                                 )
//                                 .catch((error) =>
//                                     res.status(400).json({ error })
//                                 );
//                         }
//                         break;
//                     default:
//                         console.log("Unknown sauce or user");
//                 }
//         })
//         .catch((error) => {
//             res.status(404).json({ error });
//         });
// };

// ES6
// exports.deleteSauce = (req, res) => {
//     Sauce.findById(req.params.id)
//         .then((sauce) => {
//             if (sauce.userId != req.auth.userId) {
//                 res.status(403).json({ message: "Unauthorized request." });
//             } else {
//                 const filename = sauce.imageUrl.split("images/")[1];
//                 fs.unlink(`images/${filename}`, () => {
//                     Sauce.deleteOne({ _id: req.params.id })
//                         .then(() => {
//                             res.status(200).json({
//                                 message: "Objet supprimé !",
//                             });
//                         })
//                         .catch((error) => res.status(401).json({ error }));
//                 });
//             }
//         })
//         .catch((error) => {
//             res.status(500).json({ error });
//         });
// };

// ES6
// exports.deleteSauce = (req, res) => {
//     Sauce.findById(req.params.id)
//         .then((sauce) => {
//             if (sauce.userId != req.auth.userId) {
//                 res.status(403).json({ message: "Unauthorized request." });
//             } else {
//                 const filename = sauce.imageUrl.split("images/")[1];
//                 fs.unlink(`images/${filename}`, () => {
//                     Sauce.deleteOne({ _id: req.params.id })
//                         .then(() => {
//                             res.status(200).json({
//                                 message: "Objet supprimé !",
//                             });
//                         })
//                         .catch((error) => res.status(401).json({ error }));
//                 });
//             }
//         })
//         .catch((error) => {
//             res.status(500).json({ error });
//         });
// };

// ES6
// exports.getOneSauce = (req, res) => {
//     Sauce.findOne({ _id: req.params.id })
//         .then((sauce) => res.status(200).json(sauce))
//         .catch((error) => res.status(404).json({ error }));
// };

// ECMAScript6 (ES6 : 2015)
// exports.getAllSauces = (req, res) => {
//     Sauce.find()
//         .then((sauces) => {
//             res.status(200).json(sauces);
//         })
//         .catch((error) => res.status(400).json({ error }));
// };
