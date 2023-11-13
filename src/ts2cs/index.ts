import * as vscode from 'vscode';
import { ExtensionTs2CsConfig } from "./config";

//#region TS TO CS
const interfaceNameRegex = /(interface|class) ([a-zA-Z0-9_?]+) /g;
const interfaceBodyRegex = /((interface|class) [a-zA-Z0-9_?]+\s*{[\sa-zA-Z0-9_:?;\[\]]+})/g;
const interfaceBodyExportsOnlyRegex = /(export (interface|class) [a-zA-Z0-9_?]+\s*{[\sa-zA-Z0-9_:?;\[\]]+})/g;
const propertyRegex = /([a-zA-Z0-9_?]+\s*:\s*[a-zA-Z_\[\]]+)/g;

interface TsProperty {
    property: string;
    type: string;
}
const typeMappings = {
    string: "string",
    number: "int",
    boolean: "bool",
    any: "object",
    void: "void",
    never: "void",
};
const convertToPascalCase = (str: string) => {
    return str.length >= 2
        ? `${str[0].toUpperCase()}${str.slice(1)}`
        : str.toUpperCase();
};
const csClass1 = (className: string, classProperties: string) => {
    return `
public class ${className} {
    ${classProperties}
}
    `;
};
const csProperty = (propertyName: string, propertyType: string, config: ExtensionTs2CsConfig) => {
    const isList = propertyType.includes("[");
    propertyType = propertyType.replace(/\[\]/g, "");

    let csType: string;
    if (Object.keys(typeMappings).includes(propertyType)) {
        csType = typeMappings[propertyType];
    } else {
        csType = convertToPascalCase(propertyType);
    }
    var types: { [index: string]: string } = {
        'list': 'List',
        'iqueryable': 'IQueryable',
        'ienumerable': 'IEnumerable'
    };
    // Convert list to IEnumerable if necessary
    if (isList) {
        csType = `${types[config.arrayType]}<${csType}>`;
    }
    const csPropertyName = config.propertiesToPascalCase ? convertToPascalCase(propertyName) : propertyName;
    return `
    public ${csType} ${csPropertyName} { get; set; }
    `;
};
const convertInterfaceToCSharp = (
    tsInterface: string,
    classPrefix: string,
    classSuffix: string,
    config: ExtensionTs2CsConfig
): string => {
    const interfaceName = `${classPrefix}${extractInterfaceName(
        tsInterface
    )}${classSuffix}`;

    const props = extractProperties(tsInterface);

    const csProps = props
        .map(property => {
            return csProperty(property.property, property.type, config);
        })
        .join("");

    return csClass1(interfaceName, csProps);
};
const extractInterfaceName = (tsInterface: string): string => {
    interfaceNameRegex.lastIndex = 0;
    let matches = interfaceNameRegex.exec(tsInterface);
    if (!matches || matches.length === 0) {
        return "";
    }
    return matches[matches.length - 1];
};
const extractProperties = (tsInterface: string): TsProperty[] => {
    propertyRegex.lastIndex = 0;

    let matches = tsInterface.match(propertyRegex);
    if (!matches) {
        return [];
    }

    let tsProperties: TsProperty[] = matches.map(match => {
        const components = match.split(":");
        return {
            property: components[0].trim().replace("?", ""),
            type: components[1].trim(),
        };
    });
    return tsProperties;
};
export function getTs2CsConfiguration(): ExtensionTs2CsConfig {

    const propertiesToPascalCase = vscode.workspace.getConfiguration('converter').get("propertiesToPascalCase") as boolean;
    const arrayType = vscode.workspace.getConfiguration('converter').get("arrayType") as ("list" | "iqueryable" | "ienumerable");
    return {
        propertiesToPascalCase,
        arrayType,
    };
}
/**Convert typescript code to c# code */
export function ts2cs(
    tsInterfaces: string,
    config: ExtensionTs2CsConfig,
    exportsOnly?: boolean,
    classPrefix?: string,
    classSuffix?: string
): string {
    const matches = exportsOnly
        ? tsInterfaces.match(interfaceBodyExportsOnlyRegex)
        : tsInterfaces.match(interfaceBodyRegex);
    if (!matches) {
        return "";
    }

    return matches
        .map(iface => {
            return convertInterfaceToCSharp(
                iface,
                classPrefix ? classPrefix : "",
                classSuffix ? classSuffix : "",
                config
            );
        })
        .join("");
}
//#endregion