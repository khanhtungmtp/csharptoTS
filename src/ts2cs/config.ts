export interface ExtensionTs2CsConfig {
    /**True for PascalCase (set first char to upper case), false for preserving original name */
    propertiesToPascalCase: boolean;
    /**Set the replacement type for array*/
    arrayType: "list" | "iqueryable" | "ienumerable";
}
