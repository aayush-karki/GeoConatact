const express = require("express");

// mongoDB require
const MongoCLient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectId;
const url = "mongodb://localhost:27017/GeoContact";

let dbconnection; // stores the database once it is opened/created
let UserDataCollection; // stores the UserDataCollection once it is opened/created

// checks if the collection exists or not
async function DoesCollectionExistInDb(db, collectionName) {
	const collections = await db.collections();
	return collections.some(
		(collection) => collection.collectionName === collectionName
	);
}

// starts the mongoDBserver
exports.StartMongoDBServer = async function MongoDBServerStartUp() {
	try {
		const connection = await MongoCLient.connect(url);
		dbconnection = connection.db("GeoContact");

		// if collection exist get that collection
		// else create new
		if (await DoesCollectionExistInDb(dbconnection, "UserData")) {
			UserDataCollection = dbconnection.collection("UserData");
		} else {
			UserDataCollection = await dbconnection.createCollection(
				"UserData"
			);
		}

		console.log("MongoDB connection created!");
		console.log("\tMongoDB URL: mongodb://localhost:27017/GeoContact");
	} catch (ex) {
		console.error(ex);
	}
};

exports.AddContactInfo = async function AddEntry(contactInfo) {
	try {
		await UserDataCollection.insertOne(contactInfo);
	} catch (err) {
		console.log(err);
	}
};

exports.UpdateContactInfo = async function UpdateEntry(contactInfo) {
	try {
		await UserDataCollection.updateOne(
			{ _id: ObjectID(contactInfo._id) },
			{
				$set: {
					title: contactInfo.title,
					name: contactInfo.name,
					addr: contactInfo.addr,
					phone: contactInfo.phone,
					email: contactInfo.email,
					contactType: contactInfo.contactType,
					latLongAddr: contactInfo.latLongAddr,
				},
			}
		);
	} catch (err) {
		console.log(err);
	}
};

exports.DeleteContactInfo = async function DeleteEntry(contactID) {
	try {
		await UserDataCollection.deleteOne({ _id: ObjectID(contactID) });
	} catch (err) {
		console.log(err);
	}
};

exports.GetDb = function () {
	return dbconnection;
};

exports.GetUserDataCollection = function () {
	return UserDataCollection;
};
