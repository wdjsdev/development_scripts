#target Illustrator
function duplicateDatabaseEntry()
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




	





	//logic container
	function validate()
	{
		var garmentRegex = /[fpbm][dsmb][b]?[-_][\d]{3,}[wyg]?$/i
		if(!garmentRegex.test(searchInput.text) || !garmentRegex.test(newInput.text))
		{
			alert("Invalid garment code.");
			return false;
		}
		
		if(!prepressInfo[searchInput.text])
		{
			//can't find the search term in the database.. so can't copy it. return false
			alert(searchInput.text + " does not exist in the build prepress database.")
			return false;
		}

		if(!templateInfo[searchInput.text])
		{
			//can't find the search term in the database.. so can't copy it. return false
			alert(newInput.text + " does not exist in the build template database.")
			return false
		}


		//check if the proposed new garment code already exists
		if(prepressInfo[newInput.text] || templateInfo[newInput.text])
		{
			return getOverwritePref();
		}

		return true;
	}


	function getOverwritePref()
	{
		var owPref = false;
		var ow = new Window("dialog","Overwrite existing?");
		var msg = UI.static(ow,"Do you want to overwrite the database entry for: " + newInput.text + "?");
		var msg2 = UI.static(ow,"This action cannot be undone.");
		var btnGroup = UI.group(ow);
			var noBtn = UI.button(btnGroup,"CANCEL",function()
			{
				ow.close();
				owPref = false;
			})
			var yesBtn = UI.button(btnGroup,"Yes! Overwrite.",function()
			{
				ow.close();
				owPref = true;
			})
		ow.show();

		return owPref;
	}

	function getDatabaseFiles(input)
	{
		// var clPath = "~/Desktop/temp/database_testing/central_library_testing.js";
		// var btlPath = "~/Desktop/temp/database_testing/build_template_library_testing.js";

		var clPath = dataPath + "central_library.js";
		var btlPath = dataPath + "build_template_library.js";

		var ct = File(clPath);
		var btl = File(btlPath);

		if(!ct.exists || !btl.exists)
		{
			alert("At least one of the database files cannot be found.");
			valid = false;
			return undefined;
		}

		if(input === "cl")
		{
			return clPath;
		}
		else if (input === "btl")
		{
			return btlPath;
		}

	}
	

	function duplicateEntry(searchCode,newCode)
	{

		//duplicate the item in the central library
		var exObj = prepressInfo[searchCode]; //existing object

		
		newObj = jsonCopy(exObj);
		newObj.copiedFrom = searchCode;
		prepressInfo[newCode] = newObj;

		writeDatabase(centralLibraryPath,"var prepressInfo = " + JSON.stringify(prepressInfo));

		//duplicate the item in the build template library

		exObj = templateInfo[searchCode];
		newObj = jsonCopy(exObj);
		newObj.copiedFrom = searchCode;
		templateInfo[newCode] = newObj;
		writeDatabase(buildTemplateLibraryPath,"var templateInfo = " + JSON.stringify(templateInfo));

		alert("Success!\n A new database entry based on " + searchCode + " has been created with the garment code: " + newCode + ".");
	}


	function jsonCopy(src)
	{
		return JSON.parse(JSON.stringify(src));
	}





	//import the databases
	var centralLibraryPath = getDatabaseFiles("cl");
	var buildTemplateLibraryPath = getDatabaseFiles("btl");

	if(valid)
	{
		//prepressInfo is the variable name of this database
		eval("#include \"" + centralLibraryPath + "\"");

		//templateInfo is the variableName of this database
		eval("#include \"" + buildTemplateLibraryPath + "\"");	
	}
	

	






	//dialog window


	//display a dialog to get a garment code as input, and a new garment code for the key of the new entry
	//eg. you want to duplicate FD-161, and call the new copy "FD-162"

	var w = new Window("dialog","Duplicate Database Entry:");
	var topGroup = UI.group(w);
		topGroup.orientation = "row";
		var searchGroup = UI.group(topGroup);
			searchGroup.orientation = "row";
			var searchMsg = UI.static(searchGroup,"Existing Garment Code:");
			var searchInput = UI.edit(searchGroup,"FD-XXXX",10);

		var newGroup = UI.group(topGroup);
			newGroup.orientation = "row";
			var newMsg = UI.static(newGroup,"New Garment Code:");
			var newInput = UI.edit(newGroup,"FD-YYYY",10);

	var btnGroup = UI.group(w);
		var cancel = UI.button(btnGroup,"Cancel",function()
		{
			valid = false;
			w.close();
		})
		var submit = UI.button(btnGroup,"Submit",function()
		{
			if(validate())
			{
				w.close();
				duplicateEntry(searchInput.text,newInput.text);
			}

		})
	w.show();




}
duplicateDatabaseEntry();