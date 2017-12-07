/*

Script Name:  log_new_placement_guides
Author: William Dowling
Build Date: 31 July, 2017
Description: add data for placement guides to central database, or update existing data
Build number: 1.0
*/

function container()
{
	var valid = true;
	eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/Utilities_Container.jsxbin\"");

	
	//verify the existence of a document
	if(app.documents.length === 0)
	{
		errorList.push("You must have a document open.");
		sendErrors(errorList);
		return false;
	}

	/*****************************************************************************/

	///////Begin/////////
	///Logic Container///
	/////////////////////

	//sendErrors Function Description
	//Display any errors to the user in a preformatted list
	function sendErrors(errorList)
	{
		alert("The following errors occured:\n" + errorList.join("\n"));
	}

	function getCode(layName)
	{
		var result;
		var pat = /(.*)([-_][\d]{3,}([-_][a-z])?)/i;
		result = layName.match(pat)[1];

		return result;
	}

	function entryExist(code)
	{
		var result;
		if(data[code])
		{
			result = true;
		}
		else
		{
			result = false;
		}
		return result;
	}

	function makeThemGuides(sel)
	{
		var result = {};
		result.createdBy = user;
		result.createdOn = logTime();
		//loop the objects in sel array
		//create a property in the result object for each one
		//log it's position, size and shape
		var len = sel.length;
		var g,n;
		for(var x=0;x<len;x++)
		{
			g = sel[x];
			n = checkName(g);
			if(!n)continue;
			g.stroked = false;
			result[n] = {};
			result[n].x = g.left;
			result[n].y = g.top;
			result[n].w = g.width;
			result[n].h = g.height;
		}

		return result;
	}

	function checkName(obj)
	{
		var result = obj.name;
		var namePat = /[A-Z]{4}/;
		if(obj.name === "")
		{
			errorList.push("One of your proposed guides doesn't have a name.");
			result = false;
		}
		else if(!namePat.test(obj.name) || !artworkTargets[obj.name])
		{
			if(artworkTargets[obj.name])
			{
				result = artworkTargets[obj.name];
			}
			else if(obj.name.toLowerCase().indexOf("nfhs")>-1)
			{
				result = obj.name;
			}
			else
			{
				errorList.push("Your proposed guide: " + obj.name + " has an invalid name.\nDouble check for typos.");
				// result = false	
			}
		}

		if(!result)
		{
			obj.filled = true;
			obj.fillColor = highlight;
			valid = false;
		}
		return result;
	}

	function writeDatabaseFile()
	{
		var parenPat = /[\(\)]/g;
		var newContents = "var data = " + JSON.stringify(data).replace(parenPat,"");
		var dbFile = File(dbPath);
		dbFile.open("w");
		dbFile.write(newContents);
		dbFile.close();
	}

	////////End//////////
	///Logic Container///
	/////////////////////

	/*****************************************************************************/

	///////Begin////////
	////Data Storage////
	////////////////////
	
	var dbPath = "/Volumes/Customization/Library/Scripts/Script Resources/Data/placement_guides_database.js";

	eval("#include \"" + dbPath + "\"");



	//all possible art locations and their respective code from the builder
	var artworkTargets = 
	{
		"Front Upper Right": "TFUR",
		"Front Upper Left": "TFUL",
		"Front Center": "TFCC",
		"Front Lower Right": "TFLR",
		"Front Lower Center": "TFLC",
		"Front Lower Left": "TFRL",
		"Back Locker Tag": "TBLT",
		"Back Player Name": "TBPL",
		"Back Player Number": "TBNM",
		"Back Large": "TBLB",
		"Right Shoulder": "TRSH",
		"Right Sleeve": "TRSL",
		"Left Shoulder": "TLSH",
		"Left Sleeve": "TLSL",
		"Right Hood": "TRHD",
		"Left Hood": "TLHD",
		"Back Center": "TBCB",
		"Back Ghosted Mascot": "TBGG",
		"Back Lower Back": "TBLC",
		"Front Right Leg": "BFRL",
		"Front Left Leg": "BFLL",
		"Back Right Leg": "BBRL",
		"Back Left Leg": "BBLL",
		"Right Side Leg": "BRSD",
		"Right Lower Leg": "BRLW",
		"Left Side Leg": "BLSD",
		"Left Lower Leg": "BLLW",
		"Back Waistband": "BBWB",
		"Left Waistband": "BFUL",
		"Right Waistband": "BFUR",
		"Right Hip": "BFRH",
		"Left Hip": "BFLH",
		"TFUR": "TFUR",
		"TFUL": "TFUL",
		"TFCC": "TFCC",
		"TFLR": "TFLR",
		"TFLC": "TFLC",
		"TFRL": "TFRL",
		"TBLT": "TBLT",
		"TBPL": "TBPL",
		"TBNM": "TBNM",
		"TBLB": "TBLB",
		"TRSH": "TRSH",
		"TRSL": "TRSL",
		"TLSH": "TLSH",
		"TLSL": "TLSL",
		"TRHD": "TRHD",
		"TLHD": "TLHD",
		"TBCB": "TBCB",
		"TBGG": "TBGG",
		"TBLC": "TBLC",
		"BFRL": "BFRL",
		"BFLL": "BFLL",
		"BBRL": "BBRL",
		"BBLL": "BBLL",
		"BRSD": "BRSD",
		"BRLW": "BRLW",
		"BLSD": "BLSD",
		"BLLW": "BLLW",
		"BBWB": "BBWB",
		"BFUL": "BFUL",
		"BFUR": "BFUR",
		"BFRH": "BFRH",
		"BFLH": "BFLH"
	}

	//a cmyk color to use to highlight any proposed guides with missing or incorrect properties
	var highlight = new CMYKColor;
		highlight.cyan = 0;
		highlight.magenta = 100;
		highlight.yellow = 75;
		highlight.black = 0;


	////////End/////////
	////Data Storage////
	////////////////////

	/*****************************************************************************/

	///////Begin////////
	///Function Calls///
	////////////////////

	var docRef = app.activeDocument;
	var layers = docRef.layers;
	var aB = docRef.artboards;
	var swatches = docRef.swatches;
	var errorList = [];
	var sel = docRef.selection;
	var PI = Math.PI;
	var thisConfig;


	var code = getCode(layers[0].name);

	if(entryExist(code))
	{
		valid = confirm(code + " already has an entry in the database. Do you want to overwrite it?");
	}

	if(valid && sel.length === 0)
	{
		errorList.push("You must select your guide boxes.");
		errorList.push("Create a shape for each guide you need and name it according to the 4 letter target code.");
		errorList.push("See William if you need clarification about target codes.");
		valid = false;
	}

	if(valid)
	{
		data[code] = makeThemGuides(sel);
	}

	if(valid && data[code])
	{
		writeDatabaseFile();
		alert("Successfully updated the database.\nYou're ready to make placement guides for " + code + ".");
	}


	////////End/////////
	///Function Calls///
	////////////////////

	/*****************************************************************************/

	if(errorList.length>0)
	{
		sendErrors(errorList);
	}
	return valid

}
container();