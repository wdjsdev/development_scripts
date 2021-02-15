/*

Script Name: add_placement_guides
Author: William Dowling
Build Date: 28 July, 2017
Description: Create a sublayer on the information layer that contains guides at the desired
			 size and location of standard artwork.
Build number: 1.0

*/

function addPlacementGuides()
{

	var valid = true;

	function getUtilities()
	{
		var result = [];
		var utilPath = "/Volumes/Customization/Library/Scripts/Script_Resources/Data/";
		var ext = ".jsxbin"

		//check for dev utilities preference file
		var devUtilitiesPreferenceFile = File("~/Documents/script_preferences/dev_utilities.txt");

		if(devUtilitiesPreferenceFile.exists)
		{
			devUtilitiesPreferenceFile.open("r");
			var prefContents = devUtilitiesPreferenceFile.read();
			devUtilitiesPreferenceFile.close();
			if(prefContents === "true")
			{
				utilPath = "~/Desktop/automation/utilities/";
				ext = ".js";
			}
		}

		if($.os.match("Windows"))
		{
			utilPath = utilPath.replace("/Volumes/","//AD4/");
		}

		result.push(utilPath + "Utilities_Container" + ext);
		result.push(utilPath + "Batch_Framework" + ext);

		if(!result.length)
		{
			valid = false;
			alert("Failed to find the utilities.");
		}
		return result;

	}

	var utilities = getUtilities();
	for(var u=0,len=utilities.length;u<len;u++)
	{
		eval("#include \"" + utilities[u] + "\"");	
	}

	if(!valid)return;



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
		alert(errorList.join("\n"));
	}

	function setupPlacementGuideLayer()
	{
		try
		{
			infoLay.layers["Placement Guides"].remove();
		}
		catch(e)
		{
			//no placement guides layer existed
		}
		guidesLay = infoLay.layers.add();
		guidesLay.name = "Placement Guides";
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

	function addGuides(data)
	{
		var thisObj,newGuide;
		for(var thing in data)
		{
			if(thing.indexOf("created")>-1)continue;
			thisObj = data[thing];
			newGuide = guidesLay.pathItems.rectangle(thisObj.y,thisObj.x,thisObj.w,thisObj.h);	
			newGuide.name = thing;
			newGuide.filled = false;
			newGuide.stroked = false;
			newGuide.guides = true;
		}
	}




	////////End//////////
	///Logic Container///
	/////////////////////

	/*****************************************************************************/

	///////Begin////////
	////Data Storage////
	////////////////////

	//get the database file
	var dbPath = dataPath + "placement_guides_database.js";

	eval("#include \"" + dbPath + "\"");


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
	var infoLay = docRef.layers[0].layers["Information"];
	var guidesLay;


	var errorList = [];

	var code = getCode(layers[0].name);

	if(!code)
	{
		valid = false;
	}

	if(valid && entryExist(code))
	{
		infoLay.locked = false;
		setupPlacementGuideLayer();
		addGuides(data[code]);
		infoLay.locked = true;
	}
	else
	{
		errorList.push("There's no entry in the database for the garment: " + code + ".");
		errorList.push("Please run the \"Log_Placement_Guides.jsx\" script first.");
		valid = false;
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
addPlacementGuides();
