/*

Script Name: create_guide_boxes
Author: William Dowling
Build Date: 01 August, 2017
Description: display a dialog to the user and allow them to select all of the guide boxes they need for the given
			garment and draw a box on screen with the appropriate name. the user will then position the
			boxes as needed and then run the log_placement_guides script to add them to the database.
Build number: 1.0
*/

function container()
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

	function whichGuides()
	{
		var result = [];
		var checkBoxes = [];
		/* beautify ignore:start */
		var w = new Window("dialog", "Check a box for each guide you need.");
			var txtGroup = w.add("group");
				txtGroup.orientation = "column";
				var topTxt = txtGroup.add("statictext", undefined, "***YOU WILL NEED TO SIZE THEM TO YOUR NEEDS***");
				var topTxt2 = txtGroup.add("statictext", undefined, "This just creates prenamed boxes.");
			var boxGroup = w.add("group");
				boxGroup.orientation = "column";
				for(var target in artworkTargets)
				{
					makeCheckBox(target);
				}
			var btnGroup = w.add("group");
				var submit = btnGroup.add("button", undefined, "Submit");
					submit.onClick = function()
					{
						for(var x=0;x<checkBoxes.length;x++)
						{
							if(checkBoxes[x].value)
							{
								result.push(artworkTargets[checkBoxes[x].text]);
							}
						}
						w.close();
					}

				var cancel = btnGroup.add("button", undefined, "Cancel");
					cancel.onClick = function()
					{
						result = null;
						w.close();
					}
		

		w.show();

		return result;	

		function makeCheckBox(target)
		{
			checkBoxes.push(boxGroup.add("checkbox", undefined, target));
		}
	}

	function makeBoxes(guides)
	{
		var dim = 36;
		var left = 0;
		var top = dim * 2;
		var newBox;

		for(var x=0;x<guides.length;x++)
		{
			newBox = layers[0].pathItems.rectangle(top,left,dim,dim);
			newBox.name = guides[x];
			left += dim;
		}
	}


	////////End//////////
	///Logic Container///
	/////////////////////

	/*****************************************************************************/

	///////Begin////////
	////Data Storage////
	////////////////////



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
		"Left Hip": "BFLH"
	}


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


	var guidesNeeded = whichGuides();

	if(guidesNeeded)
	{
		makeBoxes(guidesNeeded);
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