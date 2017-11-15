function container()
{
	var valid = true;
	eval("#include \"/Volumes/Customization/Library/Scripts/Script Resources/Data/Utilities_Container.js\"");

	var devComponents = "~/Desktop/automation/development_scripts/add_placement_guides/prepress_guides/components";
	var prodComponents = "/Volumes/Customization/Library/Scripts/Script Resources/components/prepress_guides";
	var components = includeComponents(devComponents,prodComponents,false);
	var compLen = components.length;
	for(var x=0;x<compLen;x++)
	{
		eval("#include " + components[x]);
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