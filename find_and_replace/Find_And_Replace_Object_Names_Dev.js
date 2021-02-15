#target Illustrator;
function FindAndReplaceObjectNames()
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


	function getLayerNames()
	{
		var result = [];
		for(var x=0,len=layers.length;x<len;x++)
		{
			result.push(layers[x].name);
		}
		return result;
	}


	function getRenamePreferenceDialog()
	{
		var w = new Window("dialog","Batch Rename");
			var topTxt = UI.static(w,"Please input the \"find\" and \"replace\" strings:");
			UI.hseparator(w,400);
			
			var inputGroup = UI.group(w);
				inputGroup.orientation = "row";

				var findGroup = UI.group(inputGroup);
					findGroup.orientation = "column"
					var findLabel = UI.static(findGroup,"Find:");
					var find1 = UI.edit(findGroup,"",20);
					UI.hseparator(findGroup,150);
					var find2 = UI.edit(findGroup,"",20);


				var replaceGroup = UI.group(inputGroup);
					replaceGroup.orientation = "column";
					var replaceLabel = UI.static(replaceGroup,"Replace:");
					var replace1 = UI.edit(replaceGroup,"",20);
					UI.hseparator(replaceGroup,150);
					var replace2 = UI.edit(replaceGroup,"",20);


			UI.hseparator(w,400);

			var layerSelectGroup = UI.group(w);
				layerSelectGroup.orientation = "column";
				var lsgLabel = UI.static(layerSelectGroup,"Select which layers you want to process.");
				var lb = UI.listbox(layerSelectGroup,undefined,getLayerNames(),{multiselect:true});

			UI.hseparator(w,400);

			var btnGroup = UI.group(w);
				var cancel = UI.button(btnGroup,"Cancel",function()
				{
					w.close();
				})
				var submit = UI.button(btnGroup,"Submit",function()
				{
					var newObj1 = {};
					if(find1.text && replace1.text)
					{
						newObj1[find1.text] = replace1.text;
						renamePreferences.push(newObj1);
					}
					

					var newObj2 = {};
					if(find2.text && replace2.text)
					{
						newObj2[find2.text] = replace2.text;
						renamePreferences.push(newObj2);
					}

					if(lb.selection.length)
					{
						for(var x=0,len=lb.selection.length;x<len;x++)
						{
							layersToRenameItems.push(layers[lb.selection[x]]);
						}
					}
					w.close();


				})


		w.show();
	}

	function renameItem(item)
	{
		var curRegex;
		for(var r=0,len=renamePreferences.length;r<len;r++)
		{
			for(var search in renamePreferences[r])
			{
				item.name = item.name.split(search).join(renamePreferences[r][search]);
			}
			
		}
	}

	function findAndReplace()
	{
		//loop the layersToRenameItems array
		var curLay,curItem;
		for(var x=0,len=layersToRenameItems.length;x<len;x++)
		{
			//loop the items on the layer and rename
			curLay = layersToRenameItems[x];
			for(var y=0,yLen=curLay.pageItems.length;y<yLen;y++)
			{
				curItem = curLay.pageItems[y];
				renameItem(curItem);
			}
		}
	}
	

	var docRef = app.activeDocument;
	var layers = docRef.layers;
	var aB = docRef.artboards;
	var swatches = docRef.swatches;

	//these are the find and replace preferences
	//format should be like this: 
	//
	// 		[{"searchTerm":"replaceTerm"},{"searchTerm":"replaceTerm"}]
	//

	var renamePreferences = [];
	var layersToRenameItems = [];
	
	getRenamePreferenceDialog();
	findAndReplace();
	
	
}
FindAndReplaceObjectNames();