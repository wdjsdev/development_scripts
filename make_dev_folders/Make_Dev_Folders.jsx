function makeDevFolders()
{
	var valid = true,
		dest,
		exportPreference = false,
		code, sizes = [];
	var possibleSizes = ["YXXS","YXS", "YS", "YM", "YL", "YXL", "Y2XL", "XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]

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

	

	if (app.documents.length)
	{
		var docRef = app.activeDocument;
		var aB = docRef.artboards;
		var layers = docRef.layers;
	}
	else
	{
		errorList.push("Please open a document and try again.");
		valid = false;
	}

	function dialogWindow()
	{
		function makeBoxes()
		{
			for (var x = 0; x < possibleSizes.length; x++)
			{
				checkboxGroup.add("checkbox", undefined, possibleSizes[x])
			}
		}


		/* beautify ignore:start */
		var w = new Window("dialog", "Enter the info.");
			var codeGroup = w.add("group");
				var codeTxt = codeGroup.add("statictext", undefined, "Enter the Garment Code Info:");
				var codeInput = codeGroup.add("edittext", undefined, "FD-000-0000");
				codeInput.characters = 20;

			var sizeGroup = w.add("group");
				sizeGroup.orientation = "column";
			var sizeTxt = sizeGroup.add("statictext", undefined, "Select the sizes you'll need:");
			var checkboxGroup = sizeGroup.add("group");
			makeBoxes();

			var sizeInput = sizeGroup.add("edittext", undefined, "Enter any additional sizes you need, spearated by commas.");
				sizeInput.characters = 20;

			var btnGroup = w.add("group");
				var foldersOnly = btnGroup.add("button", undefined, "Create Folders Only");
				foldersOnly.onClick = function()
				{
					logSizes();
					w.close();
				}

				var foldersAndExport = btnGroup.add("button", undefined, "Export Artboards to Size Folders");
				foldersAndExport.onClick = function()
				{
					exportPreference = true;
					logSizes();
					w.close();
				}

				var cancel = btnGroup.add("button", undefined, "Cancel");
				cancel.onClick = function()
				{
					valid = false;
					w.close();
				}

		w.show();
		/* beautify ignore:end */


		function logSizes()
		{
			code = codeInput.text;
			for (var x = 0; x < checkboxGroup.children.length; x++)
			{
				var thisBox = checkboxGroup.children[x];
				if (thisBox.value)
				{
					sizes.push(thisBox.text);
				}
			}
			if (sizeInput.text != "" && sizeInput.text.indexOf("Enter") == -1)
			{
				var otherSizes = sizeInput.text.split(",");
				for (var x = 0; x < otherSizes.length; x++)
				{
					sizes.push(otherSizes[x]);
				}
			}
		}
	}


	function exportSize(curSize,dest)
	{
		var curItem, pdfFile;
		var pdfSaveOpts = new PDFSaveOptions();
			pdfSaveOpts.preserveEditability = false;
			pdfSaveOpts.viewAfterSaving = false;
			pdfSaveOpts.compressArt = true;
			pdfSaveOpts.optimization = true;
			pdfSaveOpts.artboardRange = 1;

		// var curSizeFolder = Folder("/Volumes/Macintosh HD" + dest.fsName + "/" + curSize);
		// if(!curSizeFolder.exists)
		// {
		// 	curSizeFolder.create();
		// }

		for (var x = 0, len = aB.length; x < len; x++)
		{
			aB.setActiveArtboardIndex(x);
			docRef.selectObjectsOnActiveArtboard();
			curItem = docRef.selection[0];
			if (curItem.name.indexOf(curSize) === 0)
			{
				pdfSaveOpts.artboardRange = (x + 1) + "";
				pdfFile = File(dest + "/" + code + "-" + curItem.name + ".pdf");
				docRef.saveAs(pdfFile,pdfSaveOpts);
			}
		}
	}

	function makeFolders()
	{
		var user = $.getenv("USER");
		// var dest = new Folder("/Volumes/Macintosh HD/Users/" + user + "/Desktop/" + code);
		// var dest = new Folder("~/Desktop/" + code);
		dest = Folder("/Volumes/Macintosh HD" + desktopFolder.selectDlg("Please choose a save location.").fsName + "/" + code);

		if(!dest)
		{
			valid = false;
			return;
		}
		else if (!dest.exists)
		{
			dest.create();
		}

		for (var x = 0; x < sizes.length; x++)
		{
			var newDest = new Folder(dest.fsName + "/" + code + "-" + sizes[x]);
			newDest.create();
			if(exportPreference)
			{
				exportSize(sizes[x],newDest);
			}
		}
	}

	if(valid)
	{
		dialogWindow();
	}
	if(valid)
	{
		makeFolders();
	}

}
makeDevFolders();