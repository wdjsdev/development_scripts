#target Illustrator
function UpdateDatabaseDialog()
{
	// var clPath = "/Volumes/Customization/Library/Scripts/Script_Resources/Data/central_library.js"
	// var btlPath = "/Volumes/Customization/Library/Scripts/Script_Resources/Data/build_template_library.js"

	var clPath = "~/Desktop/temp/database_testing/central_library_testing.js";
	var btlPath = "~/Desktop/temp/database_testing/build_template_library_testing.js";

	var ct = File(clPath);
	var btl = File(btlPath);

	if(!ct.exists || !btl.exists)
	{
		alert("At least one of the database files cannot be found.");
		return;
	}

	//prepressInfo is the variable name of this database
	eval("#include \"" + clPath + "\"");

	//templateInfo is the variableName of this database
	eval("#include \"" + btlPath + "\"");

	
	
}
UpdateDatabaseDialog();