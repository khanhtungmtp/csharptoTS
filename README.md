# C# to TypeScript

Convert C# Models, ViewModels and DTOs into their TypeScript equivalents, Support All UpperCase ex: KHANHTUNG_MTP, CamelCase, ....

# C# to TypeScript (To File)

![In Action](https://raw.githubusercontent.com/khanhtungmtp/csharptoTS/master/images/cstotstofile.gif)

# C# to TypeScript (Paste As)

![In Action](https://raw.githubusercontent.com/khanhtungmtp/csharptoTS/master/images/cstotstpasteas.gif)

# C# to TypeScript (Replace on File)

![In Action](https://raw.githubusercontent.com/khanhtungmtp/csharptoTS/master/images/cstotstonfile.gif)

## Commands

-   `"C# to TypeScript (Replace)"` - converts content of open document (or it's selected part) and replaces it.
-   `"C# to TypeScript (To Clipboard)"`- writes converted code to clipboard.
-   `"C# to TypeScript (Paste As)"` - converts content of clipboard and pastes it.
-   `"C# to TypeScript (To File)"` (_explorer context menu_) - converts picked file into new file.

## Known limitations / design choices

-   Always outputs interface type.
-   Only includes public, non-static properties & fields - not methods, not private members.
-   Import generation assumes flat output directory structure and file names corresponding to type names (e.g. `MyType`: `myType.ts`, `my-type.ts`, `my-type.model.ts`).
