function container()
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



	var devComponents = desktopPath + "/automation/development_scripts/add_placement_guides/prepress_guides/components";
	var prodComponents = componentsPath + "prepress_guides";

	var compFiles = includeComponents(devComponents,prodComponents,false);
	if(compFiles.length)
	{
		var curComponent;
		for(var cf=0,len=compFiles.length;cf<len;cf++)
		{
			curComponent = compFiles[cf].fullName;
			eval("#include \"" + curComponent + "\"");
			log.l("included: " + compFiles[cf].name);
		}
	}
	else
	{
		errorList.push("Failed to find the necessary components.");
		log.e("No components were found.");
		valid = false;
		return valid;
	}

	/************************************************************/

	var batchFiles = [];

	if(valid)
	{
		var guidesToAdd = getGuides(app.activeDocument);
	}

	if(valid && guidesToAdd)
	{
		batchPrompt();
	}
	if(valid)
	{
		saveAndClose();
	}

	if(errorList.length)
	{
		sendErrors(errorList);
	}

}
container();