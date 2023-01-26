let map = null; // variable to store map obj from mapbox
const contactTableInfo = new Array(); // list of user defined addresses
const mapMarkerIdArr = new Array(); // maps all the corresponding maker id with corresponding contactTable's idx
// also stores the marker itself

// Todo: put this as a env var
const mapBoxAccessToken =
	"pk.eyJ1IjoiYWF1ODE0NCIsImEiOiJjbDI3bWR3dTcwMHZlM2VuejRsenExNHYwIn0.1GyO4cRK877SEu0iJbCeoQ";

// initalizes the map and adds a event listner for form submit button
const Init = function () {
	// create map
	CreateMap();

	// mask the pages
	MaskPage(true, false, false);
};

// function to create the map widget
const CreateMap = function () {
	//  center of London with zoom level of 13
	map = L.map("mapBox").setView([51.505, -0.09], 13);

	L.tileLayer(
		"https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
		{
			attribution:
				'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: "mapbox/streets-v11",
			tileSize: 512,
			zoomOffset: -1,
			accessToken:
				"pk.eyJ1IjoiYWF1ODE0NCIsImEiOiJjbDI3bWR3dTcwMHZlM2VuejRsenExNHYwIn0.1GyO4cRK877SEu0iJbCeoQ",
		}
	).addTo(map);
};

// funciton to set the map view to the passed address
// its a animated move
const FlyTo = function (latLongAddr) {
	// going the map to the new location
	map.flyTo([latLongAddr.latitude, latLongAddr.longitude], 10);
};

// funciton to add a marker at the said address
const AddMarker = function (latLongAddr, contactIdxInContactTable) {
	// create a marker
	let currMarker = L.marker([latLongAddr.latitude, latLongAddr.longitude], {
		draggable: false,
	});

	const contact = contactTableInfo[contactIdxInContactTable];

	/// @TODO: would love to add a on hover event, where the popup would open on marker hover
	// adding a popup
	const popupContent =
		contact.title +
		" " +
		contact.name +
		"</br>" +
		contact.addr +
		"</br>" +
		contact.phone +
		"</br>" +
		contact.email +
		"</br>";
	currMarker.bindPopup(popupContent);

	// add the markerIdx to contactInfo in the contactTable for easier access to
	// delete the map
	contactTableInfo[contactIdxInContactTable].marker = currMarker;

	// add the marker to the map
	map.addLayer(currMarker);
};

// deletets the specified marker; contactIdxInContactTable specifies the marker to delete
const DeleteMarker = function (contactIdxInContactTable) {
	map.removeLayer(contactTableInfo[contactIdxInContactTable].marker);
};

// shows the address corresponding to the clicked tableRow  on map
const ShowClickedAddressOnMap = function (tableRowElement) {
	// serching the addres in our stored array by the stored objectId

	const contactIdxInContactTable = GetIdxInfoInContactTable(
		tableRowElement.parentElement.lastChild.innerHTML
	);

	if (contactIdxInContactTable === -1) {
		console.log(
			"In ShowClickedAddressOnMap(): contact not found in the table"
		);
		return;
	}

	// fly to the marker
	FlyTo(contactTableInfo[contactIdxInContactTable].latLongAddr);
};

// funciton to process the new contact form and send it back to the server to
// save it in the db and get the lat and log and update the map accordingly
const ProcessNewForm = async function (id) {
	try {
		// extract the form info
		const formData = ExtractFormData(id);

		clearFormData();

		// send it bakc to the server and wait for a response
		const mailerResult = await axios.post("contactHandeling/mailer", {
			formData,
		});

		const contactInfo = mailerResult.data;

		contactTableInfo.push(contactInfo);

		// adding the address to the dom
		AddContactToTable(contactInfo, contactTableInfo.length - 1);

		// show the pages
		MaskPage(true, false, true);

		//adding the marker
		AddMarker(contactInfo.latLongAddr, contactTableInfo.length - 1);

		// move the map to the said address
		FlyTo(contactInfo.latLongAddr);
	} catch (err) {
		console.log(err);
	}
};

// funciton to process the update form and send it back to the server to
// update it in the db and get the lat and log and update the map accordingly
const ProcessUpdateForm = async function (id) {
	try {
		// extract the form info
		const formData = ExtractFormData(id);

		clearFormData();

		// send it back to the server and wait for a response
		const mailerResult = await axios.post("contactHandeling/mailerUpdate", {
			formData,
		});

		const contactInfo = mailerResult.data;
		console.log("In ProcessUpdateForm(): contactInfo");
		console.log(contactInfo);

		// serching the contactInfo in our stored array by the stored objectId
		const contactIdxInContactTable = GetIdxInfoInContactTable(
			contactInfo._id
		);
		if (contactIdxInContactTable === -1) {
			console.log(
				"In ProcessUpdateForm(): contact not found in the table"
			);
			return;
		}
		// delete map marker
		DeleteMarker(contactIdxInContactTable);

		// update the contact info in contactTableInfo arr
		contactTableInfo[contactIdxInContactTable] = contactInfo;

		// update the html contact table
		UpdateHtmlContactTable(contactInfo, contactIdxInContactTable);

		// show the pages
		MaskPage(true, false, true);

		//adding a new marker marker
		AddMarker(contactInfo.latLongAddr, contactIdxInContactTable);

		// move the map to the said address
		FlyTo(contactInfo.latLongAddr);
	} catch (err) {
		console.log(err);
	}
};

// function to update the html contact table
function UpdateHtmlContactTable(contactInfo, contactIdxInContactTable) {
	// getting all the table data that are present that row
	// they are in order -> title, name, address, phone, email, conPhone,
	// conMail, conEmail, updateBtn, DeleteBtn, objId

	// getting the table row
	const tableRow =
		document.getElementById("contactTable").lastChild.childNodes[
			contactIdxInContactTable
		];
	const tableRowElements = tableRow.childNodes;

	// checking that the objId are the same and then updating the elements
	if (contactInfo._id === tableRowElements[10].innerHTML) {
		console.log("inside UpdateContactTable: tableRow");
		console.log(tableRow);

		tableRowElements[0].innerHTML = contactInfo.title;
		tableRowElements[1].innerHTML = contactInfo.name;
		tableRowElements[2].innerHTML = contactInfo.addr;
		tableRowElements[3].innerHTML = contactInfo.phone;
		tableRowElements[4].innerHTML = contactInfo.email;
		tableRowElements[5].innerHTML = contactInfo.contactType.phone
			? "yes"
			: "no";
		tableRowElements[6].innerHTML = contactInfo.contactType.mail
			? "yes"
			: "no";
		tableRowElements[7].innerHTML = contactInfo.contactType.email
			? "yes"
			: "no";
	}

	console.log("inside UpdateContactTable: tableRowElements");
	console.log(tableRowElements);
}

const clearFormData = function clearForm() {
	document.getElementById("ContactForm").reset();
};

// adds the contact info into the contact table
const AddContactToTable = function (contactInfo) {
	const tableRow = document.createElement("tr");
	// for each property in the contactInfo create and add td to the tr
	console.log("inside AddContactToTable: contactInfo");
	console.log(contactInfo);
	for (const property in contactInfo) {
		// check if the current property is  contactType
		if (property === "contactType") {
			console.log("inside AddContactToTable: contactInfo[property]");
			console.log(contactInfo[property]);
			// it is a contact type
			// it is an object so create and add each of them to the list
			for (let eachcontactType in contactInfo[property]) {
				// create a td and add a text
				const tableData = document.createElement("td");
				if (contactInfo[property][eachcontactType]) {
					tableData.innerHTML = "yes";
				} else {
					tableData.innerHTML = "no";
				}
				tableRow.appendChild(tableData);
			}

			// creating an update button
			const updateTableData = document.createElement("td");
			const updateBtn = document.createElement("input");
			updateBtn.setAttribute("type", "button");
			updateBtn.className = "form-control dyButton";
			updateBtn.setAttribute(
				"onclick",
				"LoadUpdateForm('" + contactInfo["_id"] + "')"
			);
			updateBtn.setAttribute("value", "update");
			updateTableData.appendChild(updateBtn);
			tableRow.appendChild(updateTableData);

			// creating a delete button
			const deleteTableData = document.createElement("td");
			const deleteBtn = document.createElement("input");
			deleteBtn.setAttribute("type", "button");
			deleteBtn.setAttribute(
				"onclick",
				"DeleteContact('" + contactInfo["_id"] + "')"
			);
			deleteBtn.setAttribute("value", "delete");
			deleteBtn.className = "form-control dyButton";
			deleteTableData.appendChild(deleteBtn);
			tableRow.appendChild(deleteTableData);

			//creating a hidden child for object id at the last element
			const idTableData = document.createElement("td");
			idTableData.innerHTML = contactInfo["_id"];
			idTableData.setAttribute("hidden", "true");
			tableRow.appendChild(idTableData);

			break;
		}

		// for rest of the data
		// create a td and add a text
		const tableData = document.createElement("td");
		tableData.innerHTML = contactInfo[property];
		// add the td to the tr
		tableRow.appendChild(tableData);
	}

	// adding a event listner  to all the the list Item except for the buttons and hidden _id
	const tableDataNumber = tableRow.childNodes.length - 3; // stores the number child node except for the buttons and hidden _id
	for (let childIdx = 0; childIdx < tableDataNumber; ++childIdx) {
		tableRow.childNodes[childIdx].addEventListener(
			"click",
			function (evnt) {
				const tableData = evnt.target;
				ShowClickedAddressOnMap(tableData);
			}
		);
	}
	// get the contact table body and prepend to the list
	document.getElementById("contactTable").lastChild.append(tableRow);
};

// funciton to prepare the form on new Contact btn click
function LoadNewContactForm() {
	// show the pages
	MaskPage(false, true, false);

	// show the sendme span forever btn and hide the update button
	MaskButton(false, true);
}

// funciton to prepare the form on table's update btn click
//  populates the form with the info
function LoadUpdateForm(contactID) {
	// getting the idx of the contact from the table
	const contactIdxInContactTable = GetIdxInfoInContactTable(contactID);
	if (contactIdxInContactTable === -1) {
		console.log("In LoadUpdateForm(): contact not found in the table");
		return;
	}

	PopulateContactForm(contactID, contactIdxInContactTable);

	// show the pages
	MaskPage(true, true, false);

	// hide the sendme span forever btn and show the update button
	MaskButton(true, false);
}

// populates the contact form
function PopulateContactForm(contactID, contactIdxInContactTable) {
	// getting hte contact to update
	const contactToUpdate = contactTableInfo[contactIdxInContactTable];

	console.log("Inside PopulateContactForm: contactToUpdate");
	console.log(contactToUpdate);

	// populate the form
	const formElement = document.getElementById("ContactForm");

	const allPelements = formElement.childNodes[0].childNodes;

	//populating the radTitle
	const allRadioTitles = allPelements[0].childNodes;
	for (let idx = 0; idx < allRadioTitles.length; idx = idx + 2) {
		if (
			allRadioTitles[idx].getAttribute("value") == contactToUpdate.title
		) {
			allRadioTitles[idx].checked = true;
		} else {
			allRadioTitles[idx].checked = false;
		}
	}

	// prefilling the name -> first name and last name
	const nameArr = contactToUpdate.name.split(" ");
	document.getElementById("fName").innerHTML = nameArr[0];
	document.getElementById("fName").value = nameArr[0];
	document.getElementById("lName").innerHTML = nameArr[1];
	document.getElementById("lName").value = nameArr[1];

	// prefilling the addr -> street, city , state, US, zipcode
	const addrArr = contactToUpdate.addr.split(" ");
	// street
	const streeVal = addrArr[0].substring(0, addrArr[0].indexOf(","));
	document.getElementById("street").innerHTML = streeVal;
	document.getElementById("street").value = streeVal;
	//city
	const cityVal = addrArr[1].substring(0, addrArr[0].indexOf(","));
	document.getElementById("city").innerHTML = cityVal;
	document.getElementById("city").value = cityVal;
	// state
	const allStateElements = document.getElementById("state").childNodes;
	for (let idx = 0; idx < allStateElements.length; ++idx) {
		if (allStateElements[idx].getAttribute("value") == addrArr[2]) {
			allStateElements[idx].selected = true;
		} else {
			allStateElements[idx].selected = false;
		}
	}
	// zip
	document.getElementById("zip").innerHTML = addrArr[4];
	document.getElementById("zip").value = addrArr[4];

	// prefilling the phone
	const phone = contactToUpdate.phone;
	const onlyPhNumber =
		phone.substring(1, 4) + phone.substring(6, 9) + phone.substring(10);
	document.getElementById("ph").innerHTML = onlyPhNumber;
	document.getElementById("ph").value = onlyPhNumber;

	// prefilling the email
	document.getElementById("email").innerHTML = contactToUpdate.email;
	document.getElementById("email").value = contactToUpdate.email;

	// prefilling the contact type -> phone, mail, email, any
	// check if phone, mail, email, of them are true then its any
	if (
		contactToUpdate.contactType.phone &&
		contactToUpdate.contactType.mail &&
		contactToUpdate.contactType.email
	) {
		document.getElementById("chkAny").checked = true;
		document.getElementById("chkPh").checked = false;
		document.getElementById("chkMail").checked = false;
		document.getElementById("chkEMail").checked = false;
	} else {
		document.getElementById("chkAny").checked = false;
		document.getElementById("chkPh").checked =
			contactToUpdate.contactType.phone;
		document.getElementById("chkMail").checked =
			contactToUpdate.contactType.mail;
		document.getElementById("chkEMail").checked =
			contactToUpdate.contactType.email;
	}

	// prefilling the dbId
	document.getElementById("contactId").innerHTML = contactID;
	document.getElementById("contactId").value = contactID;
}

// serchs the contactInfo in our stored array by the stored objectId
// returns the idx of the info in the table if found, else reurns -1
const GetIdxInfoInContactTable = function GetIdxInfo(contactId) {
	// serching the contactInfo in our stored array by the stored objectId
	console.log("Inside GetIdxInfoInContactTable(): contactTableInfo[idx]._id");
	console.log(contactId);
	for (const idx in contactTableInfo) {
		console.log(contactTableInfo[idx]._id);
		if (contactTableInfo[idx]._id === contactId) {
			return idx;
		}
	}
	return -1;
};

// extracting the form data and putts them as obj
const ExtractFormData = function ExtractData(id) {
	const contactInfo = {};

	// extracting the form data and putting them as obj
	const rawFormData = new FormData(document.getElementById(id));
	for (var pair of rawFormData.entries()) {
		contactInfo[pair[0]] = pair[1];
	}

	// if an contactId is not empty then this is an update call
	if (document.getElementById("contactId").innerHTML != "") {
		contactInfo["_id"] = document.getElementById("contactId").innerHTML;
	}
	return contactInfo;
};

function DeleteContact(contactID) {
	try {
		// server side delete
		axios.post("contactHandeling/deleteContact", { contactID });

		// client side delete
		const contactIdxInContactTable = GetIdxInfoInContactTable(contactID);
		if (contactIdxInContactTable === -1) {
			console.log("In DeleteContact(): contact not found in the table");
			return;
		}
		// delete the marker
		DeleteMarker(contactIdxInContactTable);

		// getting the table row whichneeds to be deleted
		const tableRow =
			document.getElementById("contactTable").lastChild.childNodes[
				contactIdxInContactTable
			];

		// delete the table row
		document.getElementById("contactTable").lastChild.removeChild(tableRow);

		// delete the contact info from the array
		contactTableInfo.splice(contactIdxInContactTable, 1);
	} catch (err) {
		console.log(err);
	}
}

// function to mask the core elemetns -> add new btn, form page, thank you page
const MaskPage = function (addNewBtn, formStatus, thankYouPageStatus) {
	// thank you
	document.getElementById("ThankYouPage").style.display = thankYouPageStatus
		? "block"
		: "none";

	// add new btn
	document.getElementById("AddNewBtn").style.display = addNewBtn
		? "block"
		: "none";

	// contactform
	document.getElementById("ContactForm").parentElement.style.display =
		formStatus ? "block" : "none";
};

// function to mask the buttons -> send me spams and update submission button
const MaskButton = function (sendSpamBtnStatus, updateBtnStatus) {
	const btnFormGroup =
		document.getElementById("ContactForm").firstChild.lastChild;
	console.log(document.getElementById("ContactForm").firstChild.lastChild);
	btnFormGroup.firstChild.hidden = sendSpamBtnStatus; // spanBtn
	btnFormGroup.lastChild.hidden = updateBtnStatus; // updateBtn
};
