#target Illustrator
function duplicateDatabaseEntry()
{
	var valid = true;

	function getUtilities ()
	{
		var utilNames = [ "Utilities_Container" ]; //array of util names
		var utilFiles = []; //array of util files
		//check for dev mode
		var devUtilitiesPreferenceFile = File( "~/Documents/script_preferences/dev_utilities.txt" );
		function readDevPref ( dp ) { dp.open( "r" ); var contents = dp.read() || ""; dp.close(); return contents; }
		if ( devUtilitiesPreferenceFile.exists && readDevPref( devUtilitiesPreferenceFile ).match( /true/i ) )
		{
			$.writeln( "///////\n////////\nUsing dev utilities\n///////\n////////" );
			var devUtilPath = "~/Desktop/automation/utilities/";
			utilFiles =[ devUtilPath + "Utilities_Container.js", devUtilPath + "Batch_Framework.js" ];
			return utilFiles;
		}

		var dataResourcePath = customizationPath + "Library/Scripts/Script_Resources/Data/";
		
		for(var u=0;u<utilNames.length;u++)
		{
			var utilFile = new File(dataResourcePath + utilNames[u] + ".jsxbin");
			if(utilFile.exists)
			{
				utilFiles.push(utilFile);	
			}
			
		}

		if(!utilFiles.length)
		{
			alert("Could not find utilities. Please ensure you're connected to the appropriate Customization drive.");
			return [];
		}

		
		return utilFiles;

	}
	var utilities = getUtilities();

	for ( var u = 0, len = utilities.length; u < len && valid; u++ )
	{
		eval( "#include \"" + utilities[ u ] + "\"" );
	}

	if ( !valid || !utilities.length) return;




	





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