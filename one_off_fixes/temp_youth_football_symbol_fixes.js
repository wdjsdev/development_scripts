function tempYouthFootballFixes()
{
	var valid = true;
	//Production Utilities
	
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

	var docRef;
	var layers;
	var ppLay;

	var data = 
	{
		"YXS":
		{
			"Front Logo":
			{
				"width": 9,
				"height":1.75
			},
			"Front Number":
			{
				"width":8,
				"height":8,
				"move":-.25
			}
		},
		"YS":
		{
			"Front Logo":
			{
				"width": 9,
				"height": 1.75
			},
			"Front Number":
			{
				"width": 8,
				"height": 8,
				"move": -.25
			}
		},
		"YM":
		{
			"Front Logo":
			{
				"width": 10,
				"height": 2
			},
			"Front Number":
			{
				"width": 9,
				"height": 9,
				"move": -.5
			}
		},
		"YL":
		{
			"Front Logo":
			{
				"width": 10,
				"height": 2
			},
			"Front Number":
			{
				"width": 9,
				"height": 9,
				"move": -.5
			},
			"Player Name": 
			{
				"width": 9,
				"height": 1.75,
				"align": "bot"
			}
		}

	}

	function updateSymbols()
	{
		var curSizeLayer,curSymbol;
		for(var curSize in data)
		{
			curSizeLayer = ppLay.layers[curSize];
			for(var curPiece in data[curSize])
			{
				curSymbol = findSymbol(curSizeLayer,curPiece);
				if(!curSymbol)
				{
					continue;
				}
				manipulateSymbol(curSymbol,data[curSize][curPiece])
			}
		}
	}

	function manipulateSymbol(symbol,info)
	{
		if(info.align)
		{
			symbol.refPoint = symbol.top - symbol.height;
		}
		symbol.oldTop = symbol.top;
		symbol.center = symbol.left + (symbol.width/2);
		symbol.width = inchesToPoints(info.width);
		symbol.height = inchesToPoints(info.height);
		symbol.left = symbol.center - (symbol.width/2);
		
		if(info.align)
		{
			symbol.top = symbol.refPoint + symbol.height;
		}
		else
		{
			symbol.top = symbol.oldTop;
		}

		if(info.move)
		{
			symbol.top += inchesToPoints(info.move);
		}
	}

	function findSymbol(layer,symbolName)
	{
		var result;

		loop(layer.pageItems);

		if(!result)
		{
			alert("Didn't find a symbol called " + symbolName + " on the size layer " + layer.name);
		}
		return result;

		function dig(item)
		{
			if(item.typename === "SymbolItem" && item.name.indexOf(symbolName)>-1)
			{
				result = item;
				return;
			}
			else if(item.typename === "GroupItem")
			{
				loop(item.pageItems);
			}
		}

		function loop(list)
		{
			for(var x=0,len=list.length;x<len && !result;x++)
			{
				dig(list[x]);
			}
		}
	}

	function inchesToPoints(inches)
	{
		return inches * 7.2;
	}
	
	function execute()
	{
		docRef = app.activeDocument;
		layers = docRef.layers;
		ppLay = getPPLay(layers[0]);

		ppLay.visible = true;
		ppLay.locked = false;
		updateSymbols();
		ppLay.visible = false;

	}

	batchInit(execute,"Updating sizing/position of youth football symbols on front logo, front number and player name");
	// execute();


}
tempYouthFootballFixes()