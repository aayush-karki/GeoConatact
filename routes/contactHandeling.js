const express = require("express");
const res = require("express/lib/response");
const router = express.Router();
const db = require("../model/mongoServer");
const axios = require("axios");

db.StartMongoDBServer();

// access token to get api access to mapbox api
const mapBoxAccessToken =
	"pk.eyJ1IjoiYWF1ODE0NCIsImEiOiJjbDI3bWR3dTcwMHZlM2VuejRsenExNHYwIn0.1GyO4cRK877SEu0iJbCeoQ";

// funciton search the latitude and longitute in the mapbox
// returns a address obj with enteredAddress, lat, and long in it
const SearchAddressInMapBox = async function (a_entredAddress) {
	const address = {};
	address.entredAddress = a_entredAddress;
	const entredAddressUrlForm = encodeURIComponent(address.entredAddress);

	// making a forward geocoding api call to mapbox
	try {
		console.log("\tgetting lat long form mapbox.");
		const mapBoxResponse = await axios.get(
			"https://api.mapbox.com/geocoding/v5/mapbox.places/" +
				entredAddressUrlForm +
				".json?access_token=" +
				mapBoxAccessToken
		);

		// getting latitude and longitude from the  response
		address.longitude = mapBoxResponse.data.features[0].center[0];
		address.latitude = mapBoxResponse.data.features[0].center[1];

		return address;
	} catch (err) {
		console.error(err);
	}
};

// helper funciton to concot title, name, address, phone, email, and contactType
// from the contact form post
// return is obj with { title, name, addr, phone, email, contactType }
function concotContactInfo(req) {
	// etracting the data
	let title = req.body.formData.radTitle;
	let name =
		req.body.formData.txtFirstName + " " + req.body.formData.txtLastName;

	let addr =
		req.body.formData.txtStreet +
		", " +
		req.body.formData.txtCity +
		", " +
		req.body.formData.selState +
		" " +
		"US " +
		req.body.formData.numZIP;

	let phoneNum = req.body.formData.telPh;

	// assumes that phone num is 10 digit long
	let phone =
		"(" +
		phoneNum.slice(0, 3) +
		") " +
		phoneNum.slice(3, 6) +
		"-" +
		phoneNum.slice(6);

	let email = req.body.formData.email;

	let contactTypeForm = req.body.formData.chkContact; // getting the contact Type form the form
	const validContactType = ["phone", "mail", "email"]; // list of valid contact form. there can also be "any"

	let contactType = { phone: false, mail: false, email: false }; // this is passed to the object that is later stored

	// checking what the user wants to be contact by
	// if any then all is true
	if (contactTypeForm != undefined) {
		if (contactTypeForm.includes("any")) {
			contactType.phone = true;
			contactType.mail = true;
			contactType.email = true;
		} else {
			// checkich if each element in validContactType is pressent int the array passed by form
			for (value in validContactType) {
				contactType[validContactType[value]] = contactTypeForm.includes(
					validContactType[value]
				)
					? true
					: false;
			}
		}
	}

	// creating a temp object to store a contact info

	return { title, name, addr, phone, email, contactType };
}

// search the requested address and respond back with the lat and long
// and then it responds back to the client
router.post("/searchAddress", async function (req, res, next) {
	// search and user entered address in the mapbox
	searchResult = await SearchAddressInMapBox(req.body.address);

	// responding with the searchResult
	console.log("\tsending back searchResult.");
	res.json(searchResult);
});

router.post("/mailer", async function (req, res, next) {
	try {
		const contactInfo = concotContactInfo(req);

		// geting the
		// search and user entered address in the mapbox
		searchResult = await SearchAddressInMapBox(contactInfo.addr);

		// adding the lat and long to the contact info
		contactInfo.latLongAddr = {
			latitude: searchResult.latitude,
			longitude: searchResult.longitude,
		};

		// adding the contactInfo to the db
		// and _id property is also inserted in the contactInfo
		console.log("\tadding to database.");
		await db.AddContactInfo(contactInfo);

		// responding with the searchResult
		console.log("\tsending back contact info.");
		res.json(contactInfo);
	} catch (err) {
		console.log(err);
	}
});

router.post("/mailerUpdate", async function (req, res, next) {
	try {
		console.log(req.body);
		const contactInfo = concotContactInfo(req);

		// geting the
		// search and user entered address in the mapbox
		searchResult = await SearchAddressInMapBox(contactInfo.addr);

		// adding the lat and long to the contact info
		contactInfo.latLongAddr = {
			latitude: searchResult.latitude,
			longitude: searchResult.longitude,
		};

		// inserted _id in the contactInfo
		contactInfo._id = req.body.formData._id;

		// updating the contactInfo to the db
		console.log("\tupdating to database.");
		await db.UpdateContactInfo(contactInfo);

		// responding with the searchResult
		console.log("\tsending back contact info.");
		res.json(contactInfo);
	} catch (err) {
		console.log(err);
	}
});

router.post("/deleteContact", async function (req, res, next) {
	try {
		console.log(req.body.contactID);

		// updating the contactInfo to the db
		console.log("deleteing from database.");
		await db.DeleteContactInfo(req.body.contactID);
	} catch (err) {
		console.log(err);
	}
});

module.exports = router;
