function makeDevFolders()
{
	var valid,code,sizes = [];
	var possibleSizes = ["YXS", "YS", "YM", "YL", "YXL", "Y2XL", "XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]

	function dialogWindow()
	{
		function makeBoxes()
		{
			for(var x=0;x<possibleSizes.length;x++)
			{
				checkboxGroup.add("checkbox", undefined, possibleSizes[x])
			}
		}


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
				var submit = btnGroup.add("button", undefined, "Submit");
					submit.onClick = function()
					{
						code = codeInput.text;
						for(var x=0;x<checkboxGroup.children.length;x++)
						{
							var thisBox = checkboxGroup.children[x];
							if(thisBox.value)
							{
								sizes.push(thisBox.text);
							}
						}
						if(sizeInput.text != "" && sizeInput.text.indexOf("Enter") == -1)
						{
							var otherSizes = sizeInput.text.split(",");
							for(var x=0;x<otherSizes.length;x++)
							{
								sizes.push(otherSizes[x]);
							}
						}
						valid = true;
						w.close();
					}

				var cancel = btnGroup.add("button", undefined, "Cancel");
					cancel.onClick = function()
					{
						valid = false;
						w.close();
					}

		w.show();
	}

	function makeFolders()
	{
		var user = $.getenv("USER");
		var dest = new Folder("/Volumes/Macintosh HD/Users/" + user + "/Desktop/" + code);
		// var dest = new Folder("~/Desktop/" + code);
		dest.create();

		for(var x=0;x<sizes.length;x++)
		{
			var newDest = new Folder(dest.fsName + "/" + code + "-" + sizes[x]);
			newDest.create();
		}
	}

	dialogWindow();
	makeFolders();

}
makeDevFolders();